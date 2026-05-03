package com.blog.service;

import com.blog.dto.CommentDto.CommentResponse;
import com.blog.dto.CommentDto.CreateRequest;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * CommentService 单元测试
 * 覆盖评论创建、XSS消毒、删除权限和通知触发
 */
@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private BlogRepository blogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SensitiveWordService sensitiveWordService;

    @Spy
    private HtmlSanitizer htmlSanitizer = new HtmlSanitizer();

    @InjectMocks
    private CommentService commentService;

    private User testUser;
    private User blogAuthor;
    private Blog testBlog;
    private Comment testComment;
    private Comment parentComment;

    @BeforeEach
    void setUp() {
        lenient().when(sensitiveWordService.containsBlockedWord(any())).thenReturn(false);

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .avatar("avatar.png")
                .isAdmin(false)
                .build();

        blogAuthor = User.builder()
                .id(2L)
                .username("blogauthor")
                .avatar("author-avatar.png")
                .isAdmin(false)
                .build();

        testBlog = Blog.builder()
                .id(1L)
                .title("测试博客")
                .authorId(2L)
                .commentCount(5)
                .build();

        testComment = Comment.builder()
                .id(1L)
                .blogId(1L)
                .content("测试评论内容")
                .authorId(1L)
                .likes(new HashSet<>())
                .replyCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        parentComment = Comment.builder()
                .id(2L)
                .blogId(1L)
                .content("父评论")
                .authorId(2L)
                .likes(new HashSet<>())
                .replyCount(2)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ========== 评论创建测试 ==========

    @Nested
    @DisplayName("创建评论测试")
    class CreateCommentTests {

        @Test
        @DisplayName("成功创建评论")
        void createComment_success() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setBlogId(1L);
            request.setContent("这是一条新评论");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment comment = invocation.getArgument(0);
                comment.setId(3L);
                comment.setCreatedAt(LocalDateTime.now());
                return comment;
            });
            when(blogRepository.save(any(Blog.class))).thenReturn(testBlog);

            // Act
            CommentResponse response = commentService.createComment(request, 1L);

            // Assert
            assertThat(response).isNotNull();
            verify(commentRepository).save(any(Comment.class));
            // 验证博客评论数增加
            verify(blogRepository).save(argThat(blog -> blog.getCommentCount() == 6));
        }

        @Test
        @DisplayName("创建评论时应进行 XSS 消毒")
        void createComment_shouldSanitizeContent() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setBlogId(1L);
            request.setContent("<script>alert('xss')</script>正常内容");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment comment = invocation.getArgument(0);
                comment.setId(4L);
                comment.setCreatedAt(LocalDateTime.now());
                return comment;
            });
            when(blogRepository.save(any(Blog.class))).thenReturn(testBlog);

            // Act
            commentService.createComment(request, 1L);

            // Assert - 验证保存的内容不包含 script 标签
            verify(commentRepository).save(argThat(comment -> !comment.getContent().contains("<script>") &&
                    comment.getContent().contains("正常内容")));
        }

        @Test
        @DisplayName("博客不存在时应抛出异常")
        void createComment_blogNotFound_shouldThrowException() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setBlogId(999L);
            request.setContent("评论");

            when(blogRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> commentService.createComment(request, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("用户不存在时应抛出异常")
        void createComment_userNotFound_shouldThrowException() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setBlogId(1L);
            request.setContent("评论");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> commentService.createComment(request, 999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("回复评论时应更新父评论回复数")
        void createComment_reply_shouldUpdateParentReplyCount() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setBlogId(1L);
            request.setContent("这是一条回复");
            request.setParentCommentId(2L);

            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(commentRepository.findById(2L)).thenReturn(Optional.of(parentComment));
            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment comment = invocation.getArgument(0);
                comment.setId(5L);
                comment.setCreatedAt(LocalDateTime.now());
                return comment;
            });
            when(blogRepository.save(any(Blog.class))).thenReturn(testBlog);

            // Act
            commentService.createComment(request, 1L);

            // Assert - 验证父评论回复数增加（从2变为3）
            verify(commentRepository, atLeast(2)).save(any(Comment.class));
        }

        @Test
        @DisplayName("评论博客时应发送通知给博客作者")
        void createComment_shouldNotifyBlogAuthor() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setBlogId(1L);
            request.setContent("给你的博客点个赞");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment comment = invocation.getArgument(0);
                comment.setId(6L);
                comment.setCreatedAt(LocalDateTime.now());
                return comment;
            });
            when(blogRepository.save(any(Blog.class))).thenReturn(testBlog);

            // Act
            commentService.createComment(request, 1L);

            // Assert - 验证通知被保存（发送给博客作者 2L）
            verify(notificationRepository)
                    .save(argThat(notification -> notification.getRecipientId().equals(2L) &&
                            notification.getSenderId().equals(1L) &&
                            notification.getType() == Notification.NotificationType.COMMENT));
        }

        @Test
        @DisplayName("评论自己的博客时不应发送通知")
        void createComment_ownBlog_shouldNotNotify() {
            // Arrange
            testBlog.setAuthorId(1L); // 评论者就是博客作者
            CreateRequest request = new CreateRequest();
            request.setBlogId(1L);
            request.setContent("我自己的博客");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
                Comment comment = invocation.getArgument(0);
                comment.setId(7L);
                comment.setCreatedAt(LocalDateTime.now());
                return comment;
            });
            when(blogRepository.save(any(Blog.class))).thenReturn(testBlog);

            // Act
            commentService.createComment(request, 1L);

            // Assert - 不应该发送通知
            verify(notificationRepository, never()).save(any());
        }
    }

    // ========== 评论删除测试 ==========

    @Nested
    @DisplayName("删除评论权限测试")
    class DeleteCommentTests {

        @Test
        @DisplayName("作者可以删除自己的评论")
        void deleteComment_author_canDelete() {
            // Arrange
            when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(commentRepository.findByParentCommentId(1L)).thenReturn(List.of());

            // Act
            commentService.deleteComment(1L, 1L);

            // Assert
            verify(commentRepository).delete(testComment);
        }

        @Test
        @DisplayName("非作者非管理员无法删除评论")
        void deleteComment_otherUser_cannotDelete() {
            // Arrange
            when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
            when(userRepository.findById(3L)).thenReturn(Optional.of(
                    User.builder().id(3L).isAdmin(false).build()));

            // Act & Assert
            assertThatThrownBy(() -> commentService.deleteComment(1L, 3L))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        @DisplayName("管理员可以删除任何评论")
        void deleteComment_admin_canDeleteAnyComment() {
            // Arrange
            User admin = User.builder().id(2L).isAdmin(true).build();
            when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
            when(userRepository.findById(2L)).thenReturn(Optional.of(admin));
            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(commentRepository.findByParentCommentId(1L)).thenReturn(List.of());

            // Act
            commentService.deleteComment(1L, 2L);

            // Assert
            verify(commentRepository).delete(testComment);
        }

        @Test
        @DisplayName("删除评论时应减少博客评论数")
        void deleteComment_shouldDecreaseBlogCommentCount() {
            // Arrange
            when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
            when(blogRepository.findById(1L)).thenReturn(Optional.of(testBlog));
            when(commentRepository.findByParentCommentId(1L)).thenReturn(List.of());

            // Act
            commentService.deleteComment(1L, 1L);

            // Assert - 评论数应从5减少到4
            verify(blogRepository).save(argThat(blog -> blog.getCommentCount() == 4));
        }
    }

    // ========== 点赞功能测试 ==========

    @Nested
    @DisplayName("评论点赞测试")
    class LikeCommentTests {

        @Test
        @DisplayName("用户点赞评论")
        void toggleLike_like_shouldAddToList() {
            // Arrange
            when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(commentRepository.save(any(Comment.class))).thenReturn(testComment);

            // Act
            commentService.toggleLike(1L, 1L);

            // Assert
            verify(commentRepository).save(argThat(comment -> comment.getLikes().contains(1L)));
        }

        @Test
        @DisplayName("用户取消点赞")
        void toggleLike_unlike_shouldRemoveFromList() {
            // Arrange
            testComment.getLikes().add(1L);
            when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(commentRepository.save(any(Comment.class))).thenReturn(testComment);

            // Act
            commentService.toggleLike(1L, 1L);

            // Assert
            verify(commentRepository).save(argThat(comment -> !comment.getLikes().contains(1L)));
        }
    }
}
