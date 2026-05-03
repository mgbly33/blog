package com.blog.service;

import com.blog.dto.BlogDto.BlogResponse;
import com.blog.dto.BlogDto.CreateRequest;
import com.blog.dto.BlogDto.UpdateRequest;
import com.blog.entity.Blog;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.exception.UnauthorizedException;
import com.blog.repository.BlogRepository;
import com.blog.repository.UserRepository;
import com.blog.util.HtmlSanitizer;
import com.blog.util.SensitiveWordFilter;
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
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * BlogService 单元测试
 * 覆盖核心业务逻辑：博客创建、可见性权限、XSS消毒、更新删除权限
 */
@ExtendWith(MockitoExtension.class)
class BlogServiceTest {

    @Mock
    private BlogRepository blogRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private HtmlSanitizer htmlSanitizer = new HtmlSanitizer();

    @Mock
    private SensitiveWordService sensitiveWordService;

    @InjectMocks
    private BlogService blogService;

    private User normalUser;
    private User adminUser;
    private Blog publicApprovedBlog;
    private Blog privateBlog;
    private Blog pendingBlog;

    @BeforeEach
    void setUp() {
        // 普通用户
        normalUser = User.builder()
                .id(1L)
                .username("testuser")
                .password("encoded-password")
                .isAdmin(false)
                .build();

        // 管理员用户
        adminUser = User.builder()
                .id(2L)
                .username("admin")
                .password("encoded-password")
                .isAdmin(true)
                .build();

        // 公开已审核博客
        publicApprovedBlog = Blog.builder()
                .id(1L)
                .title("测试博客")
                .content("<p>测试内容</p>")
                .rawContent("测试内容")
                .authorId(1L)
                .status(Blog.Status.APPROVED)
                .visibility(Blog.Visibility.PUBLIC)
                .views(0)
                .likes(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();

        // 私有博客
        privateBlog = Blog.builder()
                .id(2L)
                .title("私有博客")
                .content("<p>私有内容</p>")
                .rawContent("私有内容")
                .authorId(1L)
                .status(Blog.Status.APPROVED)
                .visibility(Blog.Visibility.PRIVATE)
                .views(0)
                .likes(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();

        // 待审核博客
        pendingBlog = Blog.builder()
                .id(3L)
                .title("待审核博客")
                .content("<p>待审核内容</p>")
                .rawContent("待审核内容")
                .authorId(1L)
                .status(Blog.Status.PENDING)
                .visibility(Blog.Visibility.PUBLIC)
                .views(0)
                .likes(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ========== 博客创建测试 ==========

    @Nested
    @DisplayName("创建博客测试")
    class CreateBlogTests {

        @Test
        @DisplayName("普通用户创建博客 - 状态应为 PENDING")
        void createBlog_normalUser_shouldBePending() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setTitle("新博客标题");
            request.setContent("# Markdown 内容");
            request.setCategoryId(10L);
            request.setTags(Set.of(100L, 101L));

            when(userRepository.findById(1L)).thenReturn(Optional.of(normalUser));
            when(sensitiveWordService.prePublishCheck(anyString(), anyString(), any()))
                    .thenReturn(new SensitiveWordFilter.CheckResult(true, List.of()));
            when(blogRepository.save(any(Blog.class))).thenAnswer(invocation -> {
                Blog blog = invocation.getArgument(0);
                blog.setId(4L);
                return blog;
            });

            // Act
            BlogResponse response = blogService.createBlog(request, 1L);

            // Assert
            assertThat(response).isNotNull();
            verify(blogRepository).save(argThat(blog -> blog.getStatus() == Blog.Status.PENDING &&
                    blog.getTitle().equals("新博客标题")));
        }

        @Test
        @DisplayName("管理员创建博客 - 状态应为 APPROVED")
        void createBlog_adminUser_shouldBeApproved() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setTitle("管理员博客");
            request.setContent("管理员发布的内容");

            when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));
            when(sensitiveWordService.prePublishCheck(anyString(), anyString(), any()))
                    .thenReturn(new SensitiveWordFilter.CheckResult(true, List.of()));
            when(blogRepository.save(any(Blog.class))).thenAnswer(invocation -> {
                Blog blog = invocation.getArgument(0);
                blog.setId(5L);
                return blog;
            });

            // Act
            blogService.createBlog(request, 2L);

            // Assert
            verify(blogRepository).save(argThat(blog -> blog.getStatus() == Blog.Status.APPROVED));
        }

        @Test
        @DisplayName("创建博客时应进行 XSS 消毒")
        void createBlog_shouldSanitizeContent() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setTitle("XSS 测试");
            request.setContent("<script>alert('xss')</script>正常内容");

            when(userRepository.findById(1L)).thenReturn(Optional.of(normalUser));
            when(sensitiveWordService.prePublishCheck(anyString(), anyString(), any()))
                    .thenReturn(new SensitiveWordFilter.CheckResult(true, List.of()));
            when(blogRepository.save(any(Blog.class))).thenAnswer(invocation -> {
                Blog blog = invocation.getArgument(0);
                blog.setId(6L);
                return blog;
            });

            // Act
            blogService.createBlog(request, 1L);

            // Assert - 验证保存的内容不包含 script 标签
            verify(blogRepository).save(argThat(blog -> !blog.getContent().contains("<script>") &&
                    blog.getContent().contains("正常内容")));
        }

        @Test
        @DisplayName("用户不存在时应抛出异常")
        void createBlog_userNotFound_shouldThrowException() {
            // Arrange
            CreateRequest request = new CreateRequest();
            request.setTitle("测试");
            request.setContent("内容");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> blogService.createBlog(request, 999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ========== 博客可见性测试 ==========

    @Nested
    @DisplayName("博客可见性权限测试")
    class VisibilityTests {

        @Test
        @DisplayName("公开已审核博客 - 任何人都可查看")
        void getBlogById_publicApproved_anyoneCanView() {
            // Arrange
            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));

            // Act - 匿名用户查看
            BlogResponse response = blogService.getBlogById(1L, null);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("测试博客");
        }

        @Test
        @DisplayName("私有博客 - 作者可以查看")
        void getBlogById_privateBlog_authorCanView() {
            // Arrange
            when(blogRepository.findById(2L)).thenReturn(Optional.of(privateBlog));

            // Act - 作者查看
            BlogResponse response = blogService.getBlogById(2L, 1L);

            // Assert
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("私有博客 - 非作者非管理员无法查看")
        void getBlogById_privateBlog_otherUserCannotView() {
            // Arrange
            when(blogRepository.findById(2L)).thenReturn(Optional.of(privateBlog));
            when(userRepository.findById(3L)).thenReturn(Optional.of(
                    User.builder().id(3L).isAdmin(false).build()));

            // Act & Assert
            assertThatThrownBy(() -> blogService.getBlogById(2L, 3L))
                    .isInstanceOf(UnauthorizedException.class)
                    .hasMessageContaining("无权查看");
        }

        @Test
        @DisplayName("私有博客 - 管理员可以查看")
        void getBlogById_privateBlog_adminCanView() {
            // Arrange
            when(blogRepository.findById(2L)).thenReturn(Optional.of(privateBlog));
            when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));

            // Act
            BlogResponse response = blogService.getBlogById(2L, 2L);

            // Assert
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("待审核博客 - 非作者非管理员无法查看")
        void getBlogById_pendingBlog_otherUserCannotView() {
            // Arrange
            when(blogRepository.findById(3L)).thenReturn(Optional.of(pendingBlog));
            when(userRepository.findById(3L)).thenReturn(Optional.of(
                    User.builder().id(3L).isAdmin(false).build()));

            // Act & Assert
            assertThatThrownBy(() -> blogService.getBlogById(3L, 3L))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        @DisplayName("博客不存在时应抛出异常")
        void getBlogById_notFound_shouldThrowException() {
            // Arrange
            when(blogRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> blogService.getBlogById(999L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("博客不存在");
        }
    }

    // ========== 博客更新测试 ==========

    @Nested
    @DisplayName("博客更新权限测试")
    class UpdateBlogTests {

        @Test
        @DisplayName("作者可以更新自己的博客")
        void updateBlog_author_canUpdate() {
            // Arrange
            UpdateRequest request = new UpdateRequest();
            request.setTitle("更新后的标题");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(userRepository.findById(1L)).thenReturn(Optional.of(normalUser));
            when(blogRepository.save(any(Blog.class))).thenReturn(publicApprovedBlog);

            // Act
            BlogResponse response = blogService.updateBlog(1L, request, 1L);

            // Assert
            assertThat(response).isNotNull();
            verify(blogRepository).save(any(Blog.class));
        }

        @Test
        @DisplayName("非作者非管理员无法更新博客")
        void updateBlog_otherUser_cannotUpdate() {
            // Arrange
            UpdateRequest request = new UpdateRequest();
            request.setTitle("试图篡改");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(userRepository.findById(3L)).thenReturn(Optional.of(
                    User.builder().id(3L).isAdmin(false).build()));

            // Act & Assert
            assertThatThrownBy(() -> blogService.updateBlog(1L, request, 3L))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        @DisplayName("管理员可以更新任何博客")
        void updateBlog_admin_canUpdateAnyBlog() {
            // Arrange
            UpdateRequest request = new UpdateRequest();
            request.setTitle("管理员修改");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));
            when(blogRepository.save(any(Blog.class))).thenReturn(publicApprovedBlog);

            // Act
            BlogResponse response = blogService.updateBlog(1L, request, 2L);

            // Assert
            assertThat(response).isNotNull();
        }

        @Test
        @DisplayName("更新内容时应进行 XSS 消毒")
        void updateBlog_shouldSanitizeContent() {
            // Arrange
            UpdateRequest request = new UpdateRequest();
            request.setContent("<script>alert('xss')</script>新内容");

            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(userRepository.findById(1L)).thenReturn(Optional.of(normalUser));
            when(sensitiveWordService.prePublishCheck(any(), any(), any()))
                    .thenReturn(new SensitiveWordFilter.CheckResult(true, List.of()));
            when(blogRepository.save(any(Blog.class))).thenReturn(publicApprovedBlog);

            // Act
            blogService.updateBlog(1L, request, 1L);

            // Assert
            verify(blogRepository).save(argThat(blog -> !blog.getContent().contains("<script>")));
        }
    }

    // ========== 博客删除测试 ==========

    @Nested
    @DisplayName("博客删除权限测试")
    class DeleteBlogTests {

        @Test
        @DisplayName("作者可以删除自己的博客")
        void deleteBlog_author_canDelete() {
            // Arrange
            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));

            // Act
            blogService.deleteBlog(1L, 1L);

            // Assert
            verify(blogRepository).delete(publicApprovedBlog);
        }

        @Test
        @DisplayName("非作者非管理员无法删除博客")
        void deleteBlog_otherUser_cannotDelete() {
            // Arrange
            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(userRepository.findById(3L)).thenReturn(Optional.of(
                    User.builder().id(3L).isAdmin(false).build()));

            // Act & Assert
            assertThatThrownBy(() -> blogService.deleteBlog(1L, 3L))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        @DisplayName("管理员可以删除任何博客")
        void deleteBlog_admin_canDeleteAnyBlog() {
            // Arrange
            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));

            // Act
            blogService.deleteBlog(1L, 2L);

            // Assert
            verify(blogRepository).delete(publicApprovedBlog);
        }
    }

    // ========== 点赞功能测试 ==========

    @Nested
    @DisplayName("点赞功能测试")
    class LikeTests {

        @Test
        @DisplayName("用户点赞博客 - 应添加到点赞列表")
        void toggleLike_like_shouldAddToList() {
            // Arrange
            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(blogRepository.save(any(Blog.class))).thenReturn(publicApprovedBlog);

            // Act
            blogService.toggleLike(1L, 1L);

            // Assert
            verify(blogRepository).save(argThat(blog -> blog.getLikes().contains(1L)));
        }

        @Test
        @DisplayName("用户取消点赞 - 应从点赞列表移除")
        void toggleLike_unlike_shouldRemoveFromList() {
            // Arrange
            publicApprovedBlog.getLikes().add(1L);
            when(blogRepository.findById(1L)).thenReturn(Optional.of(publicApprovedBlog));
            when(blogRepository.save(any(Blog.class))).thenReturn(publicApprovedBlog);

            // Act
            blogService.toggleLike(1L, 1L);

            // Assert
            verify(blogRepository).save(argThat(blog -> !blog.getLikes().contains(1L)));
        }
    }
}
