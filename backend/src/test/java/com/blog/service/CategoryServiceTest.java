package com.blog.service;

import com.blog.dto.CategoryDto.CategoryResponse;
import com.blog.dto.CategoryDto.CreateRequest;
import com.blog.dto.CategoryDto.UpdateRequest;
import com.blog.entity.Blog;
import com.blog.entity.Category;
import com.blog.exception.DuplicateResourceException;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.BlogRepository;
import com.blog.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * CategoryService 单元测试
 */
@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BlogRepository blogRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category techCategory;

    @BeforeEach
    void setUp() {
        techCategory = Category.builder()
                .id(1L)
                .name("Technology")
                .order(1)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("查询分类测试")
    class QueryTests {
        @Test
        @DisplayName("获取所有分类")
        void getAllCategories_shouldReturnList() {
            when(categoryRepository.findAllByOrderByOrderAsc()).thenReturn(List.of(techCategory));

            // Mock blog count
            Page<Blog> blogPage = new PageImpl<>(List.of());
            when(blogRepository.findByCategoryIdAndStatusAndVisibility(
                    anyLong(), eq(Blog.Status.APPROVED), eq(Blog.Visibility.PUBLIC), any(Pageable.class)))
                    .thenReturn(blogPage);

            List<CategoryResponse> result = categoryService.getAllCategories();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Technology");
        }

        @Test
        @DisplayName("根据ID获取分类")
        void getCategoryById_shouldReturnCategory() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(techCategory));

            Page<Blog> blogPage = new PageImpl<>(List.of());
            when(blogRepository.findByCategoryIdAndStatusAndVisibility(
                    anyLong(), eq(Blog.Status.APPROVED), eq(Blog.Visibility.PUBLIC), any(Pageable.class)))
                    .thenReturn(blogPage);

            CategoryResponse result = categoryService.getCategoryById(1L);

            assertThat(result.getName()).isEqualTo("Technology");
        }

        @Test
        @DisplayName("根据ID获取分类 - 未找到抛出异常")
        void getCategoryById_notFound_shouldThrowException() {
            when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.getCategoryById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("创建分类测试")
    class CreateTests {
        @Test
        @DisplayName("成功创建分类")
        void createCategory_success() {
            CreateRequest request = CreateRequest.builder()
                    .name("News")
                    .order(2)
                    .build();

            when(categoryRepository.existsByName("News")).thenReturn(false);
            when(categoryRepository.save(any(Category.class))).thenReturn(Category.builder()
                    .id(2L)
                    .name("News")
                    .order(2)
                    .build());

            Page<Blog> blogPage = new PageImpl<>(List.of());
            when(blogRepository.findByCategoryIdAndStatusAndVisibility(
                    anyLong(), eq(Blog.Status.APPROVED), eq(Blog.Visibility.PUBLIC), any(Pageable.class)))
                    .thenReturn(blogPage);

            CategoryResponse result = categoryService.createCategory(request);

            assertThat(result.getName()).isEqualTo("News");
            verify(categoryRepository).save(any(Category.class));
        }

        @Test
        @DisplayName("创建重复名称分类 - 抛出异常")
        void createCategory_duplicateName_shouldThrowException() {
            CreateRequest request = CreateRequest.builder()
                    .name("Technology")
                    .build();

            when(categoryRepository.existsByName("Technology")).thenReturn(true);

            assertThatThrownBy(() -> categoryService.createCategory(request))
                    .isInstanceOf(DuplicateResourceException.class);
        }
    }

    @Nested
    @DisplayName("更新分类测试")
    class UpdateTests {
        @Test
        @DisplayName("成功更新分类")
        void updateCategory_success() {
            UpdateRequest request = UpdateRequest.builder()
                    .name("Tech Updated")
                    .build();

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(techCategory));
            when(categoryRepository.existsByName("Tech Updated")).thenReturn(false);
            when(categoryRepository.save(any(Category.class))).thenReturn(techCategory);

            Page<Blog> blogPage = new PageImpl<>(List.of());
            when(blogRepository.findByCategoryIdAndStatusAndVisibility(
                    anyLong(), eq(Blog.Status.APPROVED), eq(Blog.Visibility.PUBLIC), any(Pageable.class)))
                    .thenReturn(blogPage);

            CategoryResponse result = categoryService.updateCategory(1L, request);

            assertThat(result.getId()).isEqualTo("1");
            verify(categoryRepository).save(any(Category.class));
        }
    }

    @Nested
    @DisplayName("删除分类测试")
    class DeleteTests {
        @Test
        @DisplayName("成功删除分类")
        void deleteCategory_success() {
            when(categoryRepository.existsById(1L)).thenReturn(true);

            categoryService.deleteCategory(1L);

            verify(categoryRepository).deleteById(1L);
        }
    }
}
