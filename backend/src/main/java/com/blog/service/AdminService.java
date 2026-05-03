package com.blog.service;

import com.blog.dto.AdminDto;
import com.blog.dto.AdminDto.BlogAdminView;
import com.blog.dto.AdminDto.BlogApprovalRequest;
import com.blog.dto.AdminDto.DashboardStats;
import com.blog.dto.AdminDto.UserBanRequest;
import com.blog.dto.PageDto;
import com.blog.dto.UserDto.UserListItem;
import com.blog.entity.Blog;
import com.blog.entity.Comment;
import com.blog.entity.Draft;
import com.blog.entity.Notification;
import com.blog.entity.Series;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.BlogRepository;
import com.blog.repository.CommentRepository;
import com.blog.repository.DraftRepository;
import com.blog.repository.DraftVersionRepository;
import com.blog.repository.MessageRepository;
import com.blog.repository.NotificationRepository;
import com.blog.repository.SeriesRepository;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final BlogRepository blogRepository;
    private final CommentRepository commentRepository;
    private final DraftRepository draftRepository;
    private final DraftVersionRepository draftVersionRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final SeriesRepository seriesRepository;
    private final CommentService commentService;

    public DashboardStats getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalBlogs = blogRepository.count();
        long totalComments = commentRepository.count();
        long pendingBlogs = blogRepository.countByStatusAndVisibility(Blog.Status.PENDING, Blog.Visibility.PUBLIC);
        long bannedUsers = userRepository.countByIsBannedTrue();

        return DashboardStats.builder()
                .totalUsers(totalUsers)
                .totalBlogs(totalBlogs)
                .totalComments(totalComments)
                .pendingBlogs(pendingBlogs)
                .bannedUsers(bannedUsers)
                .todayViews(0L)
                .build();
    }

    public PageDto<UserListItem> getAllUsers(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users;
        if (search != null && !search.isEmpty()) {
            users = userRepository.findByUsernameContainingIgnoreCase(search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return PageDto.from(users, this::toUserListItem);
    }

    @Transactional
    public void toggleUserBan(Long userId, UserBanRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsBanned(request.getBanned());
        userRepository.save(user);

        if (request.getBanned() && request.getReason() != null) {
            Notification notification = Notification.builder()
                    .recipientId(userId)
                    .type(Notification.NotificationType.SYSTEM)
                    .content("Your account has been banned. Reason: " + request.getReason())
                    .build();
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void toggleUserAdmin(Long userId, boolean isAdmin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsAdmin(isAdmin);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Long> likedBlogIds = blogRepository.findLikedBlogIdsByUserId(userId);
        blogRepository.removeLikesByUserId(userId);
        commentRepository.removeLikesByUserId(userId);
        commentRepository.removeMentionsByUserId(userId);

        if (!likedBlogIds.isEmpty()) {
            List<Blog> likedBlogs = blogRepository.findAllById(likedBlogIds);
            likedBlogs.forEach(Blog::syncLikesCount);
            blogRepository.saveAll(likedBlogs);
        }

        List<Long> authoredCommentIds = commentRepository.findByAuthorId(userId).stream()
                .map(Comment::getId)
                .distinct()
                .collect(Collectors.toList());
        for (Long commentId : authoredCommentIds) {
            try {
                commentService.deleteComment(commentId, userId);
            } catch (ResourceNotFoundException ignored) {
                // Parent comment deletion can already remove child comments.
            }
        }

        List<Blog> authoredBlogs = blogRepository.findAllByAuthorId(userId);
        for (Blog blog : authoredBlogs) {
            deleteBlogData(blog);
        }

        List<Draft> drafts = draftRepository.findAllByAuthorId(userId);
        for (Draft draft : drafts) {
            draftVersionRepository.deleteByDraftId(draft.getId());
        }
        if (!drafts.isEmpty()) {
            draftRepository.deleteAll(drafts);
        }

        List<Series> seriesList = seriesRepository.findAllByAuthorId(userId);
        if (!seriesList.isEmpty()) {
            List<Long> seriesIds = seriesList.stream()
                    .map(Series::getId)
                    .collect(Collectors.toList());
            blogRepository.clearSeriesIds(seriesIds);
            seriesRepository.deleteAll(seriesList);
        }

        notificationRepository.deleteByUserInvolved(userId);
        messageRepository.deleteByParticipantId(userId);

        userRepository.removeFromAllFollowing(userId);
        userRepository.removeFromAllFollowers(userId);

        userRepository.delete(user);
    }

    public PageDto<BlogAdminView> getAllBlogs(int page, int size, Blog.Status status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Blog> blogs;
        if (status != null) {
            blogs = blogRepository.findByStatusAndVisibility(status, Blog.Visibility.PUBLIC, pageable);
        } else {
            blogs = blogRepository.findAll(pageable);
        }

        List<Long> authorIds = blogs.getContent().stream()
                .map(Blog::getAuthorId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return PageDto.from(blogs, blog -> toBlogAdminView(blog, authorMap));
    }

    public PageDto<BlogAdminView> getPendingBlogs(int page, int size) {
        return getAllBlogs(page, size, Blog.Status.PENDING);
    }

    @Transactional
    public Blog.Status updateBlogStatus(Long blogId, BlogApprovalRequest request) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));

        if (request.getStatus() != Blog.Status.APPROVED && request.getStatus() != Blog.Status.REJECTED) {
            throw new IllegalArgumentException("Only APPROVED or REJECTED are allowed");
        }

        Blog.Status finalStatus;
        if (request.getStatus() == Blog.Status.APPROVED
                && blog.getPublishAt() != null
                && blog.getPublishAt().isAfter(LocalDateTime.now())) {
            finalStatus = Blog.Status.SCHEDULED;
        } else {
            finalStatus = request.getStatus();
        }

        blog.setStatus(finalStatus);
        blogRepository.save(blog);

        String message;
        if (finalStatus == Blog.Status.SCHEDULED) {
            String publishAtText = blog.getPublishAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            message = "Your article \"" + blog.getTitle() + "\" was approved and will be published at "
                    + publishAtText + ".";
        } else if (finalStatus == Blog.Status.APPROVED) {
            message = "Your article \"" + blog.getTitle() + "\" was approved.";
        } else {
            String reason = request.getRejectReason() == null || request.getRejectReason().isBlank()
                    ? "No reason provided"
                    : request.getRejectReason();
            message = "Your article \"" + blog.getTitle() + "\" was rejected. Reason: " + reason;
        }

        Notification notification = Notification.builder()
                .recipientId(blog.getAuthorId())
                .type(Notification.NotificationType.SYSTEM)
                .content(message)
                .relatedBlogId(blogId)
                .build();
        notificationRepository.save(notification);

        return finalStatus;
    }

    @Transactional
    public void toggleBlogSticky(Long blogId) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));

        blog.setIsSticky(!blog.getIsSticky());
        blogRepository.save(blog);
    }

    @Transactional
    public void deleteBlog(Long blogId) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new ResourceNotFoundException("Blog not found"));

        deleteBlogData(blog);
    }

    private UserListItem toUserListItem(User user) {
        return UserListItem.builder()
                .id(user.getId())
                .username(user.getUsername())
                .avatar(user.getAvatar())
                .bio(user.getBio())
                .isAdmin(user.getIsAdmin())
                .isBanned(user.getIsBanned())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private BlogAdminView toBlogAdminView(Blog blog, Map<Long, User> authorMap) {
        User author = authorMap.get(blog.getAuthorId());

        return BlogAdminView.builder()
                .id(blog.getId())
                .title(blog.getTitle())
                .summary(blog.getSummary())
                .author(author != null ? AdminDto.AuthorInfo.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .avatar(author.getAvatar())
                        .build() : null)
                .status(blog.getStatus())
                .visibility(blog.getVisibility())
                .views(blog.getViews())
                .likesCount(blog.getLikesCount())
                .commentCount(blog.getCommentCount())
                .createdAt(blog.getCreatedAt())
                .build();
    }

    private void deleteBlogData(Blog blog) {
        List<Long> blogIds = List.of(blog.getId());
        List<Comment> comments = commentRepository.findByBlogIdIn(blogIds);
        if (!comments.isEmpty()) {
            commentRepository.deleteAll(comments);
        }
        notificationRepository.deleteByRelatedBlogIdIn(blogIds);
        userRepository.removeBookmarksForBlogs(blogIds);
        blogRepository.delete(blog);
    }
}
