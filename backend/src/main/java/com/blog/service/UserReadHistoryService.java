package com.blog.service;

import com.blog.dto.BlogDto.AuthorInfo;
import com.blog.entity.Blog;
import com.blog.entity.User;
import com.blog.entity.UserReadHistory;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.BlogRepository;
import com.blog.repository.UserReadHistoryRepository;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserReadHistoryService {

    private final UserReadHistoryRepository historyRepository;
    private final BlogRepository blogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void updateProgress(Long userId, Long blogId, Integer progress, Integer scrollPosition) {
        if (!blogRepository.existsById(blogId)) {
            throw new ResourceNotFoundException("博客不存在: " + blogId);
        }
        if (progress == null || progress < 0 || progress > 100) {
            throw new IllegalArgumentException("progress 必须在 0-100 之间");
        }
        if (scrollPosition == null || scrollPosition < 0) {
            throw new IllegalArgumentException("scrollPosition 不能小于 0");
        }

        historyRepository.upsertProgress(userId, blogId, progress, scrollPosition);
    }

    public java.util.Optional<UserReadHistory> getProgress(Long userId, Long blogId) {
        return historyRepository.findByUserIdAndBlogId(userId, blogId);
    }

    public Map<String, Object> getUserHistory(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserReadHistory> historyPage = historyRepository.findByUserIdOrderByLastReadAtDesc(userId, pageable);

        List<Long> blogIds = historyPage.getContent().stream()
                .map(UserReadHistory::getBlogId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, Blog> blogMap = blogRepository.findAllById(blogIds).stream()
                .collect(Collectors.toMap(Blog::getId, Function.identity()));

        Set<Long> authorIds = blogMap.values().stream()
                .map(Blog::getAuthorId)
                .collect(Collectors.toSet());
        Map<Long, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<Map<String, Object>> items = historyPage.getContent().stream()
                .filter(h -> {
                    Blog blog = blogMap.get(h.getBlogId());
                    if (blog == null) {
                        return false;
                    }
                    boolean isOwnBlog = userId.equals(blog.getAuthorId());
                    boolean isPublicApproved = blog.getStatus() == Blog.Status.APPROVED
                            && blog.getVisibility() == Blog.Visibility.PUBLIC;
                    return isOwnBlog || isPublicApproved;
                })
                .map(h -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", String.valueOf(h.getId()));
                    item.put("blogId", String.valueOf(h.getBlogId()));
                    item.put("progress", h.getProgress());
                    item.put("scrollPosition", h.getScrollPosition());
                    item.put("lastReadAt", h.getLastReadAt());

                    Blog blog = blogMap.get(h.getBlogId());
                    item.put("blogTitle", blog.getTitle() != null ? blog.getTitle() : "未命名文章");
                    item.put("blogSummary", blog.getSummary());
                    item.put("blogImage", blog.getImage());
                    item.put("readTime", blog.getReadTime() != null ? blog.getReadTime() : 1);

                    User author = authorMap.get(blog.getAuthorId());
                    if (author != null) {
                        item.put("author", AuthorInfo.builder()
                                .id(author.getId())
                                .username(author.getUsername())
                                .avatar(author.getAvatar())
                                .build());
                    }
                    return item;
                }).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", items);
        result.put("page", historyPage.getNumber());
        result.put("size", historyPage.getSize());
        result.put("totalElements", historyPage.getTotalElements());
        result.put("totalPages", historyPage.getTotalPages());
        result.put("first", historyPage.isFirst());
        result.put("last", historyPage.isLast());
        return result;
    }

    @Transactional
    public void deleteHistory(Long userId, Long blogId) {
        historyRepository.deleteByUserIdAndBlogId(userId, blogId);
    }
}
