package com.blog.service;

import com.blog.dto.TagDto.CreateRequest;
import com.blog.dto.TagDto.TagResponse;
import com.blog.dto.TagDto.UpdateRequest;
import com.blog.entity.Tag;
import com.blog.exception.DuplicateResourceException;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    public List<TagResponse> getAllTags() {
        List<Tag> tags = tagRepository.findAll();
        return tags.stream()
                .map(this::toTagResponse)
                .collect(Collectors.toList());
    }

    public List<TagResponse> getHotTags() {
        List<Tag> tags = tagRepository.findByIsHotTrue();
        return tags.stream()
                .map(this::toTagResponse)
                .collect(Collectors.toList());
    }

    public List<TagResponse> getPopularTags() {
        List<Tag> tags = tagRepository.findTop20ByOrderByCountDesc();
        return tags.stream()
                .map(this::toTagResponse)
                .collect(Collectors.toList());
    }

    public TagResponse getTagById(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("标签不存在"));
        return toTagResponse(tag);
    }

    public TagResponse getTagByName(String name) {
        Tag tag = tagRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("标签不存在"));
        return toTagResponse(tag);
    }

    @Transactional
    public TagResponse createTag(CreateRequest request) {
        if (tagRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("该标签名称已存在");
        }

        Tag tag = Tag.builder()
                .name(request.getName())
                .description(request.getDescription() != null ? request.getDescription() : "")
                .color(request.getColor() != null ? request.getColor() : "#007bff")
                .icon(request.getIcon() != null ? request.getIcon() : "")
                .isHot(request.getIsHot() != null ? request.getIsHot() : false)
                .build();

        Tag savedTag = tagRepository.save(tag);
        return toTagResponse(savedTag);
    }

    @Transactional
    public TagResponse updateTag(Long id, UpdateRequest request) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("标签不存在"));

        if (request.getName() != null && !request.getName().equals(tag.getName())) {
            if (tagRepository.existsByName(request.getName())) {
                throw new DuplicateResourceException("该标签名称已存在");
            }
            tag.setName(request.getName());
        }

        if (request.getDescription() != null) {
            tag.setDescription(request.getDescription());
        }
        if (request.getColor() != null) {
            tag.setColor(request.getColor());
        }
        if (request.getIcon() != null) {
            tag.setIcon(request.getIcon());
        }
        if (request.getIsHot() != null) {
            tag.setIsHot(request.getIsHot());
        }

        Tag updatedTag = tagRepository.save(tag);
        return toTagResponse(updatedTag);
    }

    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("标签不存在");
        }
        tagRepository.deleteById(id);
    }

    @Transactional
    public void incrementCount(Long tagId) {
        Tag tag = tagRepository.findById(tagId).orElse(null);
        if (tag != null) {
            tag.setCount(tag.getCount() + 1);
            tagRepository.save(tag);
        }
    }

    @Transactional
    public void decrementCount(Long tagId) {
        Tag tag = tagRepository.findById(tagId).orElse(null);
        if (tag != null) {
            tag.setCount(Math.max(0, tag.getCount() - 1));
            tagRepository.save(tag);
        }
    }

    private TagResponse toTagResponse(Tag tag) {
        return TagResponse.builder()
                .id(tag.getId().toString())
                .name(tag.getName())
                .description(tag.getDescription())
                .color(tag.getColor())
                .icon(tag.getIcon())
                .count(tag.getCount())
                .isHot(tag.getIsHot())
                .createdAt(tag.getCreatedAt())
                .build();
    }
}
