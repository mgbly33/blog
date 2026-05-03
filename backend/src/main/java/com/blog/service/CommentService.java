package com.blog.service;

import com.blog.dto.CommentDto.AuthorInfo;
import com.blog.dto.CommentDto.CommentResponse;
import com.blog.dto.CommentDto.CreateRequest;
import com.blog.dto.PageDto;
import com.blog.entity.Blog;
import com.blog.entity.Comment;
import com.blog.entity.Notification;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.exception.UnauthorizedException;
import com.blog.repository.BlogRepository;
import com.blog.repository.CommentRepository;
import com.blog.repository.NotificationRepository;
import com.blog.repository.UserRepository;
import com.blog.util.HtmlSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final BlogRepository blogRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final HtmlSanitizer htmlSanitizer;
    private final SensitiveWordService sensitiveWordService;

    public PageDto<CommentResponse> getCommentsByBlog(Long blogId, int page, int size, Long currentUserId) {
        Blog blog = blogRepository.findById(blogId)
                .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));
        assertCanReadBlogComments(blog, currentUserId);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Comment> comments = commentRepository.findByBlogIdAndParentCommentIdIsNull(blogId, pageable);

        List<Long> authorIds = comments.getContent().stream()
                .map(Comment::getAuthorId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return PageDto.from(comments, comment -> toCommentResponse(comment, authorMap, currentUserId));
    }

    public List<CommentResponse> getReplies(Long commentId, Long currentUserId) {
        Comment parentComment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("评论不存在"));
        Blog blog = blogRepository.findById(parentComment.getBlogId())
                .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));
        assertCanReadBlogComments(blog, currentUserId);

        List<Comment> replies = commentRepository.findByParentCommentId(commentId);

        List<Long> authorIds = replies.stream()
                .map(Comment::getAuthorId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return replies.stream()
                .map(reply -> toCommentResponse(reply, authorMap, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse createComment(CreateRequest request, Long authorId) {
        Blog blog = blogRepository.findById(request.getBlogId())
                .orElseThrow(() -> new ResourceNotFoundException("博客不存在"));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        String sanitizedContent = htmlSanitizer.sanitizeComment(request.getContent());
        if (sensitiveWordService.containsBlockedWord(sanitizedContent)) {
            throw new IllegalArgumentException("评论包含违禁词汇，请修改后重新提交");
        }

        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("父评论不存在"));
            if (!parentComment.getBlogId().equals(request.getBlogId())) {
                throw new IllegalArgumentException("父评论不属于当前博客");
            }
        }

        Comment comment = Comment.builder()
                .blogId(request.getBlogId())
                .content(sanitizedContent)
                .authorId(authorId)
                .parentCommentId(parentComment != null ? parentComment.getId() : null)
                .mentions(request.getMentions() != null ? request.getMentions() : Set.of())
                .build();

        Comment savedComment = commentRepository.save(comment);

        int commentCount = blog.getCommentCount() != null ? blog.getCommentCount() : 0;
        blog.setCommentCount(commentCount + 1);
        blogRepository.save(blog);

        if (parentComment != null) {
            int replyCount = parentComment.getReplyCount() != null ? parentComment.getReplyCount() : 0;
            parentComment.setReplyCount(replyCount + 1);
            commentRepository.save(parentComment);

            if (!parentComment.getAuthorId().equals(authorId)) {
                createNotification(parentComment.getAuthorId(), authorId, blog.getId(), "reply");
            }
        }

        if (!blog.getAuthorId().equals(authorId)) {
            createNotification(blog.getAuthorId(), authorId, blog.getId(), "comment");
        }

        if (request.getMentions() != null) {
            for (Long mentionedUserId : request.getMentions()) {
                if (!mentionedUserId.equals(authorId)) {
                    createNotification(mentionedUserId, authorId, blog.getId(), "mention");
                }
            }
        }

        return toCommentResponse(savedComment, Map.of(authorId, author), authorId);
    }

    @Transactional
    public void deleteComment(Long id, Long userId) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("评论不存在"));

        if (!comment.getAuthorId().equals(userId)) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || !Boolean.TRUE.equals(user.getIsAdmin())) {
                throw new UnauthorizedException("无权删除该评论");
            }
        }

        Blog blog = blogRepository.findById(comment.getBlogId()).orElse(null);
        if (blog != null) {
            int commentCount = blog.getCommentCount() != null ? blog.getCommentCount() : 0;
            int replyCount = comment.getReplyCount() != null ? comment.getReplyCount() : 0;
            blog.setCommentCount(Math.max(0, commentCount - 1 - replyCount));
            blogRepository.save(blog);
        }

        List<Comment> replies = commentRepository.findByParentCommentId(id);
        commentRepository.deleteAll(replies);

        if (comment.getParentCommentId() != null) {
            Comment parentComment = commentRepository.findById(comment.getParentCommentId()).orElse(null);
            if (parentComment != null) {
                int replyCount = parentComment.getReplyCount() != null ? parentComment.getReplyCount() : 0;
                parentComment.setReplyCount(Math.max(0, replyCount - 1));
                commentRepository.save(parentComment);
            }
        }

        commentRepository.delete(comment);
    }

    @Transactional
    public CommentResponse toggleLike(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("评论不存在"));

        if (comment.getLikes().contains(userId)) {
            comment.getLikes().remove(userId);
        } else {
            comment.getLikes().add(userId);
        }

        Comment updatedComment = commentRepository.save(comment);

        User author = userRepository.findById(comment.getAuthorId()).orElse(null);
        Map<Long, User> authorMap = author != null ? Map.of(author.getId(), author) : Map.of();

        return toCommentResponse(updatedComment, authorMap, userId);
    }

    private void createNotification(Long recipientId, Long senderId, Long blogId, String type) {
        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .senderId(senderId)
                .type(Notification.NotificationType.valueOf(type.toUpperCase()))
                .relatedBlogId(blogId)
                .build();
        notificationRepository.save(notification);
    }

    private void assertCanReadBlogComments(Blog blog, Long currentUserId) {
        boolean isAuthor = blog.getAuthorId().equals(currentUserId);
        boolean isApprovedPublic = blog.getStatus() == Blog.Status.APPROVED
                && blog.getVisibility() == Blog.Visibility.PUBLIC;
        if (isAuthor || isApprovedPublic) {
            return;
        }

        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        if (currentUser == null || !Boolean.TRUE.equals(currentUser.getIsAdmin())) {
            throw new UnauthorizedException("您无权查看此博客的评论");
        }
    }

    private CommentResponse toCommentResponse(Comment comment, Map<Long, User> authorMap, Long currentUserId) {
        User author = authorMap.get(comment.getAuthorId());

        return CommentResponse.builder()
                .id(comment.getId())
                .blogId(comment.getBlogId())
                .content(comment.getContent())
                .author(author != null ? AuthorInfo.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .avatar(author.getAvatar())
                        .build() : null)
                .parentCommentId(comment.getParentCommentId())
                .mentions(comment.getMentions())
                .replyCount(comment.getReplyCount())
                .likesCount(comment.getLikes().size())
                .isLiked(comment.getLikes().contains(currentUserId))
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
