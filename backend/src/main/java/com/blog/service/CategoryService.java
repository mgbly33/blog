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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final BlogRepository blogRepository;

    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAllByOrderByOrderAsc();
        return categories.stream()
                .map(this::toCategoryResponse)
                .collect(Collectors.toList());
    }

    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("分类不存在"));
        return toCategoryResponse(category);
    }

    public CategoryResponse getCategoryByName(String name) {
        Category category = categoryRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("分类不存在"));
        return toCategoryResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CreateRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("该分类名称已存在");
        }

        Category category = Category.builder()
                .name(request.getName())
                .order(request.getOrder() != null ? request.getOrder() : 0)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return toCategoryResponse(savedCategory);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("分类不存在"));

        if (request.getName() != null && !request.getName().equals(category.getName())) {
            if (categoryRepository.existsByName(request.getName())) {
                throw new DuplicateResourceException("该分类名称已存在");
            }
            category.setName(request.getName());
        }

        if (request.getOrder() != null) {
            category.setOrder(request.getOrder());
        }

        Category updatedCategory = categoryRepository.save(category);
        return toCategoryResponse(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("分类不存在");
        }
        categoryRepository.deleteById(id);
    }

    private CategoryResponse toCategoryResponse(Category category) {
        // 只统计公开已审核的博客数量（使用 size=1 仅触发 COUNT 与单行查询，避免全表加载）
        long blogCount = blogRepository.findByCategoryIdAndStatusAndVisibility(
                category.getId(), Blog.Status.APPROVED, Blog.Visibility.PUBLIC,
                org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();

        return CategoryResponse.builder()
                .id(category.getId().toString())
                .name(category.getName())
                .order(category.getOrder())
                .blogCount(blogCount)
                .createdAt(category.getCreatedAt())
                .build();
    }
}
