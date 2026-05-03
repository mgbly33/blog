package com.blog.service;

import com.blog.dto.DraftDto.DraftListItem;
import com.blog.dto.DraftDto.DraftResponse;
import com.blog.dto.DraftDto.SaveRequest;
import com.blog.dto.DraftDto.VersionResponse;
import com.blog.dto.PageDto;
import com.blog.entity.Draft;
import com.blog.entity.DraftVersion;
import com.blog.exception.ResourceNotFoundException;
import com.blog.exception.UnauthorizedException;
import com.blog.repository.DraftRepository;
import com.blog.repository.DraftVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DraftService {

    private final DraftRepository draftRepository;
    private final DraftVersionRepository draftVersionRepository;

    public PageDto<DraftListItem> getUserDrafts(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Draft> drafts = draftRepository.findByAuthorIdOrderByUpdatedAtDesc(userId, pageable);

        return PageDto.from(drafts, this::toDraftListItem);
    }

    public DraftResponse getDraftById(Long id, Long userId) {
        Draft draft = draftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("草稿不存在"));

        if (!draft.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("无权访问该草稿");
        }

        return toDraftResponse(draft);
    }

    public DraftResponse getDraftByBlogId(Long blogId, Long userId) {
        Draft draft = draftRepository.findByAuthorIdAndBlogId(userId, blogId)
                .orElseThrow(() -> new ResourceNotFoundException("该博客不存在对应草稿"));

        return toDraftResponse(draft);
    }

    @Transactional
    public DraftResponse saveDraft(SaveRequest request, Long userId) {
        Draft draft;

        // Check if editing an existing blog's draft
        if (request.getBlogId() != null) {
            draft = draftRepository.findByAuthorIdAndBlogId(userId, request.getBlogId())
                    .orElse(Draft.builder()
                            .authorId(userId)
                            .blogId(request.getBlogId())
                            .build());
        } else {
            // New draft
            draft = Draft.builder()
                    .authorId(userId)
                    .build();
        }

        // Update draft fields
        if (request.getTitle() != null) {
            draft.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            draft.setContent(request.getContent());
        }
        if (request.getCategoryId() != null) {
            draft.setCategoryId(request.getCategoryId());
        }
        if (request.getTags() != null) {
            draft.setTags(request.getTags());
        }
        if (request.getVisibility() != null) {
            draft.setVisibility(request.getVisibility());
        }
        if (request.getImage() != null) {
            draft.setImage(request.getImage());
        }

        draft.setLastSavedAt(LocalDateTime.now());
        draft.setCurrentVersion(draft.getCurrentVersion() + 1);

        Draft savedDraft = draftRepository.save(draft);

        // Save version history
        saveVersion(savedDraft);

        return toDraftResponse(savedDraft);
    }

    @Transactional
    public DraftResponse updateDraft(Long id, SaveRequest request, Long userId) {
        Draft draft = draftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("草稿不存在"));

        if (!draft.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("无权更新该草稿");
        }

        if (request.getTitle() != null) {
            draft.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            draft.setContent(request.getContent());
        }
        if (request.getCategoryId() != null) {
            draft.setCategoryId(request.getCategoryId());
        }
        if (request.getTags() != null) {
            draft.setTags(request.getTags());
        }
        if (request.getVisibility() != null) {
            draft.setVisibility(request.getVisibility());
        }
        if (request.getImage() != null) {
            draft.setImage(request.getImage());
        }

        draft.setLastSavedAt(LocalDateTime.now());
        draft.setCurrentVersion(draft.getCurrentVersion() + 1);

        Draft savedDraft = draftRepository.save(draft);

        // Save version history
        saveVersion(savedDraft);

        return toDraftResponse(savedDraft);
    }

    @Transactional
    public void deleteDraft(Long id, Long userId) {
        Draft draft = draftRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("草稿不存在"));

        if (!draft.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("无权删除该草稿");
        }

        // Delete all versions
        draftVersionRepository.deleteByDraftId(id);

        draftRepository.delete(draft);
    }

    public List<VersionResponse> getVersionHistory(Long draftId, Long userId) {
        Draft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new ResourceNotFoundException("草稿不存在"));

        if (!draft.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("无权访问该草稿");
        }

        List<DraftVersion> versions = draftVersionRepository.findByDraftIdOrderByVersionNumberDesc(draftId);
        return versions.stream()
                .map(this::toVersionResponse)
                .collect(Collectors.toList());
    }

    public VersionResponse getVersion(Long draftId, int version, Long userId) {
        Draft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new ResourceNotFoundException("草稿不存在"));

        if (!draft.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("无权访问该草稿");
        }

        DraftVersion draftVersion = draftVersionRepository.findByDraftIdAndVersionNumber(draftId, version)
                .orElseThrow(() -> new ResourceNotFoundException("版本不存在"));

        return toVersionResponse(draftVersion);
    }

    @Transactional
    public DraftResponse restoreVersion(Long draftId, int version, Long userId) {
        Draft draft = draftRepository.findById(draftId)
                .orElseThrow(() -> new ResourceNotFoundException("草稿不存在"));

        if (!draft.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("无权访问该草稿");
        }

        DraftVersion draftVersion = draftVersionRepository.findByDraftIdAndVersionNumber(draftId, version)
                .orElseThrow(() -> new ResourceNotFoundException("版本不存在"));

        draft.setTitle(draftVersion.getTitle());
        draft.setContent(draftVersion.getContent());
        draft.setCurrentVersion(draft.getCurrentVersion() + 1);
        draft.setLastSavedAt(LocalDateTime.now());

        Draft savedDraft = draftRepository.save(draft);
        saveVersion(savedDraft, DraftVersion.ChangeType.RESTORE);

        return toDraftResponse(savedDraft);
    }

    private void saveVersion(Draft draft) {
        saveVersion(draft, DraftVersion.ChangeType.AUTO);
    }

    private void saveVersion(Draft draft, DraftVersion.ChangeType changeType) {
        DraftVersion version = DraftVersion.builder()
                .draftId(draft.getId())
                .versionNumber(draft.getCurrentVersion())
                .title(draft.getTitle())
                .content(draft.getContent())
                .wordCount(draft.getWordCount())
                .changeType(changeType)
                .build();
        draftVersionRepository.save(version);

        // Keep only the last 20 versions
        List<DraftVersion> allVersions = draftVersionRepository.findByDraftIdOrderByVersionNumberDesc(draft.getId());
        if (allVersions.size() > 20) {
            List<DraftVersion> toDelete = allVersions.subList(20, allVersions.size());
            draftVersionRepository.deleteAll(toDelete);
        }
    }

    private DraftResponse toDraftResponse(Draft draft) {
        return DraftResponse.builder()
                .id(draft.getId())
                .title(draft.getTitle())
                .content(draft.getContent())
                .categoryId(draft.getCategoryId())
                .tags(draft.getTags())
                .visibility(draft.getVisibility())
                .image(draft.getImage())
                .blogId(draft.getBlogId())
                .currentVersion(draft.getCurrentVersion())
                .wordCount(draft.getWordCount())
                .summary(draft.getSummary())
                .lastSavedAt(draft.getLastSavedAt())
                .createdAt(draft.getCreatedAt())
                .updatedAt(draft.getUpdatedAt())
                .build();
    }

    private DraftListItem toDraftListItem(Draft draft) {
        return DraftListItem.builder()
                .id(draft.getId())
                .title(draft.getTitle())
                .summary(draft.getSummary())
                .wordCount(draft.getWordCount())
                .isNew(draft.isNewDraft())
                .updatedAt(draft.getUpdatedAt())
                .build();
    }

    private VersionResponse toVersionResponse(DraftVersion version) {
        return VersionResponse.builder()
                .id(version.getId())
                .draftId(version.getDraftId())
                .version(version.getVersionNumber())
                .title(version.getTitle())
                .content(version.getContent())
                .wordCount(version.getWordCount())
                .createdAt(version.getCreatedAt())
                .build();
    }
}
