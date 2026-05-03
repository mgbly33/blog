package com.blog.service;

import com.blog.dto.TagDto.CreateRequest;
import com.blog.dto.TagDto.TagResponse;
import com.blog.dto.TagDto.UpdateRequest;
import com.blog.entity.Tag;
import com.blog.exception.DuplicateResourceException;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TagService 单元测试
 */
@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    private Tag javaTag;
    private Tag springTag;

    @BeforeEach
    void setUp() {
        javaTag = Tag.builder()
                .id(1L)
                .name("Java")
                .description("Java programming")
                .color("#FF0000")
                .icon("java-icon")
                .count(10)
                .isHot(true)
                .createdAt(LocalDateTime.now())
                .build();

        springTag = Tag.builder()
                .id(2L)
                .name("Spring")
                .description("Spring framework")
                .color("#00FF00")
                .icon("spring-icon")
                .count(5)
                .isHot(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("查询标签测试")
    class QueryTests {
        @Test
        @DisplayName("获取所有标签")
        void getAllTags_shouldReturnList() {
            when(tagRepository.findAll()).thenReturn(List.of(javaTag, springTag));

            List<TagResponse> result = tagService.getAllTags();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getName()).isEqualTo("Java");
        }

        @Test
        @DisplayName("根据ID获取标签")
        void getTagById_shouldReturnTag() {
            when(tagRepository.findById(1L)).thenReturn(Optional.of(javaTag));

            TagResponse result = tagService.getTagById(1L);

            assertThat(result.getName()).isEqualTo("Java");
        }

        @Test
        @DisplayName("根据ID获取标签 - 未找到则抛出异常")
        void getTagById_notFound_shouldThrowException() {
            when(tagRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> tagService.getTagById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("创建标签测试")
    class CreateTests {
        @Test
        @DisplayName("成功创建标签")
        void createTag_success() {
            CreateRequest request = CreateRequest.builder()
                    .name("NewTag")
                    .build();

            when(tagRepository.existsByName("NewTag")).thenReturn(false);
            when(tagRepository.save(any(Tag.class))).thenReturn(Tag.builder()
                    .id(3L)
                    .name("NewTag")
                    .build());

            TagResponse result = tagService.createTag(request);

            assertThat(result.getName()).isEqualTo("NewTag");
            verify(tagRepository).save(any(Tag.class));
        }

        @Test
        @DisplayName("创建重复名称标签 - 抛出异常")
        void createTag_duplicateName_shouldThrowException() {
            CreateRequest request = CreateRequest.builder()
                    .name("Java")
                    .build();

            when(tagRepository.existsByName("Java")).thenReturn(true);

            assertThatThrownBy(() -> tagService.createTag(request))
                    .isInstanceOf(DuplicateResourceException.class);
        }
    }

    @Nested
    @DisplayName("更新标签测试")
    class UpdateTests {
        @Test
        @DisplayName("成功更新标签")
        void updateTag_success() {
            UpdateRequest request = UpdateRequest.builder()
                    .name("UpdatedJava")
                    .build();

            when(tagRepository.findById(1L)).thenReturn(Optional.of(javaTag));
            when(tagRepository.existsByName("UpdatedJava")).thenReturn(false);
            when(tagRepository.save(any(Tag.class))).thenReturn(javaTag);

            TagResponse result = tagService.updateTag(1L, request);

            assertThat(result.getId()).isEqualTo("1");
            verify(tagRepository).save(any(Tag.class));
        }
    }

    @Nested
    @DisplayName("删除标签测试")
    class DeleteTests {
        @Test
        @DisplayName("成功删除标签")
        void deleteTag_success() {
            when(tagRepository.existsById(1L)).thenReturn(true);

            tagService.deleteTag(1L);

            verify(tagRepository).deleteById(1L);
        }
    }

    @Nested
    @DisplayName("计数功能测试")
    class CountTests {
        @Test
        @DisplayName("增加计数")
        void incrementCount_success() {
            when(tagRepository.findById(1L)).thenReturn(Optional.of(javaTag));

            tagService.incrementCount(1L);

            assertThat(javaTag.getCount()).isEqualTo(11);
            verify(tagRepository).save(javaTag);
        }

        @Test
        @DisplayName("减少计数")
        void decrementCount_success() {
            when(tagRepository.findById(1L)).thenReturn(Optional.of(javaTag));

            tagService.decrementCount(1L);

            assertThat(javaTag.getCount()).isEqualTo(9);
            verify(tagRepository).save(javaTag);
        }
    }
}
