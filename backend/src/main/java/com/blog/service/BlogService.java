package com.blog.service;

import com.blog.dto.BlogDto.AuthorInfo;
import com.blog.dto.BlogDto.BlogListItem;
import com.blog.dto.BlogDto.BlogResponse;
import com.blog.dto.BlogDto.CreateRequest;
import com.blog.dto.BlogDto.UpdateRequest;
import com.blog.dto.PageDto;
import com.blog.entity.Blog;
import com.blog.entity.Series;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.exception.UnauthorizedException;
import com.blog.repository.BlogRepository;
import com.blog.repository.SeriesRepository;
import com.blog.repository.UserRepository;
import com.blog.util.HtmlSanitizer;
import com.blog.util.SensitiveWordFilter;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final SeriesRepository seriesRepository;
    private final HtmlSanitizer htmlSanitizer;
    private final SensitiveWordService sensitiveWordService;
    private final Parser markdownParser = Parser.builder().build();
    private final HtmlRenderer htmlRenderer = HtmlRenderer.builder().build();

    public PageDto<BlogListItem> getPublicBlogs(int page, int size, Long categoryId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "isSticky", "createdAt"));
        Page<Blog> blogs = categoryId != null
                ? blogRepository.findByCategoryIdAndStatusAndVisibility(categoryId, Blog.Status.APPROVED, Blog.Visibility.PUBLIC, pageable)
                : blogRepository.findByStatusAndVisibility(Blog.Status.APPROVED, Blog.Visibility.PUBLIC, pageable);
        return toPageDto(blogs);
    }

    public PageDto<BlogListItem> getUserBlogs(Long userId, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Blog> blogs;
        if (userId.equals(currentUserId)) {
            blogs = blogRepository.findByAuthorId(userId, pageable);
        } else {
            User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
            if (currentUser != null && Boolean.TRUE.equals(currentUser.getIsAdmin())) {
                blogs = blogRepository.findByAuthorId(userId, pageable);
            } else {
                blogs = blogRepository.findByAuthorIdAndStatusAndVisibility(
                        userId, Blog.Status.APPROVED, Blog.Visibility.PUBLIC, pageable);
            }
        }
        return toPageDto(blogs);
    }

    public PageDto<BlogListItem> getBookmarkedBlogs(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        Set<Long> bookmarkIds = user.getBookmarks() != null ? user.getBookmarks() : Set.of();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Blog> blogs = blogRepository.findByIdIn(new ArrayList<>(bookmarkIds), pageable);
        return toPageDto(blogs);
    }

    public PageDto<BlogListItem> getLikedBlogs(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Blog> blogs = blogRepository.findLikedByUserId(userId, pageable);
        return toPageDto(blogs);
    }

    public PageDto<BlogListItem> getBlogsByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Blog> blogs = blogRepository.findByCategoryIdAndStatusAndVisibility(
                categoryId, Blog.Status.APPROVED, Blog.Visibility.PUBLIC, pageable);
        return toPageDto(blogs);
    }

    public PageDto<BlogListItem> searchBlogs(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Blog> blogs = blogRepository.searchByText(query, pageable);
        return toPageDto(blogs);
    }

    public PageDto<BlogListItem> getBlogsByTag(Long tagId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Blog> blogs = blogRepository.findByTagsContainingAndStatusAndVisibility(
                tagId, Blog.Status.APPROVED, Blog.Visibility.PUBLIC, pageable);
        return toPageDto(blogs);
    }

    @Transactional
    public BlogResponse getBlogById(Long id, Long currentUserId) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));

        boolean isAuthor = currentUserId != null && blog.getAuthorId().equals(currentUserId);
        boolean isApprovedPublic = blog.getStatus() == Blog.Status.APPROVED && blog.getVisibility() == Blog.Visibility.PUBLIC;
        if (!isAuthor && !isApprovedPublic) {
            User user = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
            if (user == null || !Boolean.TRUE.equals(user.getIsAdmin())) {
                throw new UnauthorizedException("无权查看该博客");
            }
        }

        int latestViews = (blog.getViews() != null ? blog.getViews() : 0) + 1;
        blogRepository.incrementViews(id);

        BlogResponse response;
        try {
            response = toBlogResponse(blog, currentUserId);
        } catch (Exception ex) {
            log.error("Failed to map blog detail response, fallback to safe mapper. blogId={}", id, ex);
            response = toSafeBlogResponse(blog);
        }
        response.setViews(latestViews);
        return response;
    }

    @Transactional
    public BlogResponse createBlog(CreateRequest request, Long authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        LocalDateTime publishAt = parseScheduleTime(request.getPublishAt());
        LocalDateTime unpublishAt = parseScheduleTime(request.getUnpublishAt());

        if (request.getSeriesId() != null) {
            validateSeriesExists(request.getSeriesId());
        }

        SensitiveWordFilter.CheckResult checkResult = sensitiveWordService.prePublishCheck(
                request.getTitle(), request.getContent(), null);
        if (!checkResult.passed) {
            String blockedWords = checkResult.matches.stream()
                    .filter(m -> m.level == com.blog.entity.SensitiveWord.Level.BLOCK)
                    .map(m -> m.word)
                    .distinct()
                    .collect(Collectors.joining(", "));
            throw new IllegalArgumentException("鍐呭鍖呭惈杩濈璇嶏紝璇蜂慨鏀瑰悗閲嶈瘯: " + blockedWords);
        }

        String rawHtml = htmlRenderer.render(markdownParser.parse(request.getContent()));
        String htmlContent = htmlSanitizer.sanitizeBlogContent(rawHtml);

        Blog blog = Blog.builder()
                .title(request.getTitle())
                .content(htmlContent)
                .rawContent(request.getContent())
                .image(request.getImage())
                .categoryId(request.getCategoryId())
                .tags(request.getTags() != null ? request.getTags() : Set.of())
                .visibility(request.getVisibility() != null ? request.getVisibility() : Blog.Visibility.PUBLIC)
                .publishAt(publishAt)
                .unpublishAt(unpublishAt)
                .seriesId(request.getSeriesId())
                .chapterOrder(request.getChapterOrder())
                .status(resolveStatusForSubmission(Boolean.TRUE.equals(author.getIsAdmin()), publishAt))
                .authorId(authorId)
                .build();

        validateScheduleDates(blog.getPublishAt(), blog.getUnpublishAt());
        blog.calculateReadTime();
        blog.generateSummary();

        Blog savedBlog = blogRepository.save(blog);
        return toBlogResponse(savedBlog, authorId);
    }

    @Transactional
    public BlogResponse updateBlog(Long id, UpdateRequest request, Long userId) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));

        User operator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        boolean isAdminOperator = Boolean.TRUE.equals(operator.getIsAdmin());

        if (!blog.getAuthorId().equals(userId) && !isAdminOperator) {
            throw new UnauthorizedException("无权更新该博客");
        }

        if (request.getTitle() != null) {
            blog.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            SensitiveWordFilter.CheckResult checkResult = sensitiveWordService.prePublishCheck(
                    request.getTitle(), request.getContent(), null);
            if (!checkResult.passed) {
                String blockedWords = checkResult.matches.stream()
                        .filter(m -> m.level == com.blog.entity.SensitiveWord.Level.BLOCK)
                        .map(m -> m.word)
                        .distinct()
                        .collect(Collectors.joining(", "));
                throw new IllegalArgumentException("鍐呭鍖呭惈杩濈璇嶏紝璇蜂慨鏀瑰悗閲嶈瘯: " + blockedWords);
            }

            String rawHtml = htmlRenderer.render(markdownParser.parse(request.getContent()));
            String htmlContent = htmlSanitizer.sanitizeBlogContent(rawHtml);
            blog.setContent(htmlContent);
            blog.setRawContent(request.getContent());
            blog.calculateReadTime();
            blog.generateSummary();
        }
        if (request.getImage() != null) {
            blog.setImage(request.getImage());
        }
        if (request.getCategoryId() != null) {
            blog.setCategoryId(request.getCategoryId());
        }
        if (request.getTags() != null) {
            blog.setTags(request.getTags());
        }
        if (request.getVisibility() != null) {
            blog.setVisibility(request.getVisibility());
        }
        if (request.getPublishAt() != null) {
            blog.setPublishAt(parseScheduleTime(request.getPublishAt()));
        }
        if (request.getUnpublishAt() != null) {
            blog.setUnpublishAt(parseScheduleTime(request.getUnpublishAt()));
        }

        validateScheduleDates(blog.getPublishAt(), blog.getUnpublishAt());

        if (request.getSeriesId() != null) {
            validateSeriesExists(request.getSeriesId());
            blog.setSeriesId(request.getSeriesId());
        }
        if (request.getChapterOrder() != null) {
            blog.setChapterOrder(request.getChapterOrder());
        }

        if (hasReviewSensitiveUpdate(request)) {
            blog.setStatus(resolveStatusForSubmission(isAdminOperator, blog.getPublishAt()));
        }

        Blog updatedBlog = blogRepository.save(blog);
        return toBlogResponse(updatedBlog, userId);
    }

    @Transactional
    public void deleteBlog(Long id, Long userId) {
        Blog blog = blogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));

        if (!blog.getAuthorId().equals(userId)) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || !Boolean.TRUE.equals(user.getIsAdmin())) {
                throw new UnauthorizedException("无权删除该博客");
            }
        }

        blogRepository.delete(blog);
    }

    @Transactional
    public BlogResponse toggleLike(Long blogId, Long userId) {
        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                Blog blog = blogRepository.findById(blogId)
                        .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));

                if (blog.getLikes() == null) {
                    blog.setLikes(new HashSet<>());
                }

                if (blog.getLikes().contains(userId)) {
                    blog.getLikes().remove(userId);
                } else {
                    blog.getLikes().add(userId);
                }
                blog.syncLikesCount();

                Blog updatedBlog = blogRepository.save(blog);
                return toBlogResponse(updatedBlog, userId);
            } catch (OptimisticLockingFailureException e) {
                if (attempt == maxRetries - 1) {
                    log.warn("toggleLike failed after {} retries for blog {}", maxRetries, blogId);
                    throw e;
                }
            }
        }
        throw new IllegalStateException("点赞切换出现不可达状态");
    }

    @Transactional
    public void toggleBookmark(Long blogId, Long userId) {
        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
                Blog blog = blogRepository.findById(blogId)
                        .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));

                if (user.getBookmarks() == null) {
                    user.setBookmarks(new HashSet<>());
                }

                if (user.getBookmarks().contains(blogId)) {
                    user.getBookmarks().remove(blogId);
                    blog.setCollectCount(Math.max(0, blog.getCollectCount() - 1));
                } else {
                    user.getBookmarks().add(blogId);
                    blog.setCollectCount(blog.getCollectCount() + 1);
                }

                userRepository.save(user);
                blogRepository.save(blog);
                return;
            } catch (OptimisticLockingFailureException e) {
                if (attempt == maxRetries - 1) {
                    log.warn("toggleBookmark failed after {} retries for blog {}", maxRetries, blogId);
                    throw e;
                }
            }
        }
    }

    public List<BlogListItem> getStickyBlogs() {
        List<Blog> stickyBlogs = blogRepository.findByIsStickyTrueAndStatusAndVisibilityOrderByCreatedAtDesc(
                Blog.Status.APPROVED, Blog.Visibility.PUBLIC);
        return stickyBlogs.stream().map(this::toBlogListItem).collect(Collectors.toList());
    }

    private PageDto<BlogListItem> toPageDto(Page<Blog> blogs) {
        List<Long> authorIds = blogs.getContent().stream().map(Blog::getAuthorId).distinct().collect(Collectors.toList());
        Map<Long, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return PageDto.from(blogs, blog -> {
            BlogListItem item = toBlogListItem(blog);
            User author = authorMap.get(blog.getAuthorId());
            if (author != null) {
                item.setAuthor(AuthorInfo.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .avatar(author.getAvatar())
                        .build());
            }
            return item;
        });
    }

    private BlogListItem toBlogListItem(Blog blog) {
        Set<Long> tags = blog.getTags() != null ? new HashSet<>(blog.getTags()) : Set.of();
        return BlogListItem.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .summary(blog.getSummary())
                .image(blog.getImage())
                .categoryId(blog.getCategoryId())
                .tags(tags)
                .status(blog.getStatus())
                .readTime(blog.getReadTime() != null ? blog.getReadTime() : 1)
                .views(blog.getViews() != null ? blog.getViews() : 0)
                .likesCount(blog.getLikesCount() != null ? blog.getLikesCount() : 0)
                .commentCount(blog.getCommentCount() != null ? blog.getCommentCount() : 0)
                .isSticky(blog.getIsSticky() != null ? blog.getIsSticky() : false)
                .publishAt(blog.getPublishAt())
                .seriesId(blog.getSeriesId())
                .chapterOrder(blog.getChapterOrder())
                .createdAt(blog.getCreatedAt())
                .build();
    }

    private BlogResponse toBlogResponse(Blog blog, Long currentUserId) {
        User author = userRepository.findById(blog.getAuthorId()).orElse(null);
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        Set<Long> tags = blog.getTags() != null ? new HashSet<>(blog.getTags()) : Set.of();
        Set<Long> likes = blog.getLikes() != null ? new HashSet<>(blog.getLikes()) : Set.of();
        Set<Long> bookmarks = currentUser != null && currentUser.getBookmarks() != null ? currentUser.getBookmarks() : Set.of();
        int likesCount = blog.getLikesCount() != null ? blog.getLikesCount() : likes.size();

        return BlogResponse.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .content(blog.getContent())
                .rawContent(blog.getRawContent())
                .summary(blog.getSummary())
                .image(blog.getImage())
                .categoryId(blog.getCategoryId())
                .tags(tags)
                .visibility(blog.getVisibility())
                .status(blog.getStatus())
                .readTime(blog.getReadTime() != null ? blog.getReadTime() : 1)
                .views(blog.getViews() != null ? blog.getViews() : 0)
                .likesCount(likesCount)
                .collectCount(blog.getCollectCount() != null ? blog.getCollectCount() : 0)
                .commentCount(blog.getCommentCount() != null ? blog.getCommentCount() : 0)
                .isSticky(blog.getIsSticky() != null ? blog.getIsSticky() : false)
                .publishAt(blog.getPublishAt())
                .unpublishAt(blog.getUnpublishAt())
                .seriesId(blog.getSeriesId())
                .chapterOrder(blog.getChapterOrder())
                .createdAt(blog.getCreatedAt())
                .isLiked(currentUserId != null && likes.contains(currentUserId))
                .isBookmarked(bookmarks.contains(blog.getId()))
                .author(author != null ? AuthorInfo.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .avatar(author.getAvatar())
                        .build() : null)
                .build();
    }

    private BlogResponse toSafeBlogResponse(Blog blog) {
        User author = userRepository.findById(blog.getAuthorId()).orElse(null);
        return BlogResponse.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .content(blog.getContent())
                .rawContent(blog.getRawContent())
                .summary(blog.getSummary())
                .image(blog.getImage())
                .categoryId(blog.getCategoryId())
                .tags(Set.of())
                .visibility(blog.getVisibility())
                .status(blog.getStatus())
                .readTime(blog.getReadTime() != null ? blog.getReadTime() : 1)
                .views(blog.getViews() != null ? blog.getViews() : 0)
                .likesCount(blog.getLikesCount() != null ? blog.getLikesCount() : 0)
                .collectCount(blog.getCollectCount() != null ? blog.getCollectCount() : 0)
                .commentCount(blog.getCommentCount() != null ? blog.getCommentCount() : 0)
                .isSticky(blog.getIsSticky() != null ? blog.getIsSticky() : false)
                .publishAt(blog.getPublishAt())
                .unpublishAt(blog.getUnpublishAt())
                .seriesId(blog.getSeriesId())
                .chapterOrder(blog.getChapterOrder())
                .createdAt(blog.getCreatedAt())
                .isLiked(false)
                .isBookmarked(false)
                .author(author != null ? AuthorInfo.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .avatar(author.getAvatar())
                        .build() : null)
                .build();
    }

    private void validateSeriesExists(Long seriesId) {
        Series series = seriesRepository.findById(seriesId)
                .orElseThrow(() -> new ResourceNotFoundException("专栏不存在"));
        if (series.getStatus() == null) {
            throw new IllegalArgumentException("专栏状态异常，暂不可选");
        }
    }

    private Blog.Status resolveStatusForSubmission(boolean isAdminOperator, LocalDateTime publishAt) {
        if (!isAdminOperator) {
            return Blog.Status.PENDING;
        }
        if (publishAt != null && publishAt.isAfter(LocalDateTime.now())) {
            return Blog.Status.SCHEDULED;
        }
        return Blog.Status.APPROVED;
    }

    private boolean hasReviewSensitiveUpdate(UpdateRequest request) {
        return request.getTitle() != null
                || request.getContent() != null
                || request.getImage() != null
                || request.getCategoryId() != null
                || request.getTags() != null
                || request.getVisibility() != null
                || request.getPublishAt() != null
                || request.getUnpublishAt() != null
                || request.getSeriesId() != null
                || request.getChapterOrder() != null;
    }

    private void validateScheduleDates(LocalDateTime publishAt, LocalDateTime unpublishAt) {
        if (publishAt != null && publishAt.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new IllegalArgumentException("鍙戝竷鏃堕棿涓嶈兘鏃╀簬褰撳墠鏃堕棿");
        }
        if (unpublishAt != null && unpublishAt.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new IllegalArgumentException("涓嬬嚎鏃堕棿涓嶈兘鏃╀簬褰撳墠鏃堕棿");
        }
        if (publishAt != null && unpublishAt != null && !unpublishAt.isAfter(publishAt)) {
            throw new IllegalArgumentException("涓嬬嚎鏃堕棿蹇呴』鏅氫簬鍙戝竷鏃堕棿");
        }
    }
    private LocalDateTime parseScheduleTime(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        try {
            return OffsetDateTime.parse(rawValue)
                    .atZoneSameInstant(ZoneId.systemDefault())
                    .toLocalDateTime();
        } catch (DateTimeParseException ignore) {
            // Fallback for legacy payloads without timezone offset.
        }

        try {
            return LocalDateTime.parse(rawValue);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("鏃堕棿鏍煎紡涓嶆纭紝璇蜂娇鐢↖SO8601鏍煎紡");
        }
    }
}
