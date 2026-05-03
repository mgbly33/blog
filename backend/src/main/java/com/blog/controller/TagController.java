package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.TagDto.CreateRequest;
import com.blog.dto.TagDto.TagResponse;
import com.blog.dto.TagDto.UpdateRequest;
import com.blog.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
@Tag(name = "标签", description = "标签管理接口")
public class TagController {

    private final TagService tagService;

    @GetMapping
    @Operation(summary = "获取全部标签")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getAllTags() {
        List<TagResponse> tags = tagService.getAllTags();
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/hot")
    @Operation(summary = "获取热门标签")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getHotTags() {
        List<TagResponse> tags = tagService.getHotTags();
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/popular")
    @Operation(summary = "获取常用标签（按使用量前20）")
    public ResponseEntity<ApiResponse<List<TagResponse>>> getPopularTags() {
        List<TagResponse> tags = tagService.getPopularTags();
        return ResponseEntity.ok(ApiResponse.success(tags));
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取标签")
    public ResponseEntity<ApiResponse<TagResponse>> getTagById(@PathVariable Long id) {
        TagResponse tag = tagService.getTagById(id);
        return ResponseEntity.ok(ApiResponse.success(tag));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "根据名称获取标签")
    public ResponseEntity<ApiResponse<TagResponse>> getTagByName(@PathVariable String name) {
        TagResponse tag = tagService.getTagByName(name);
        return ResponseEntity.ok(ApiResponse.success(tag));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "创建标签（仅管理员）")
    public ResponseEntity<ApiResponse<TagResponse>> createTag(
            @Valid @RequestBody CreateRequest request) {
        TagResponse tag = tagService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("标签创建成功", tag));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "更新标签（仅管理员）")
    public ResponseEntity<ApiResponse<TagResponse>> updateTag(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRequest request) {
        TagResponse tag = tagService.updateTag(id, request);
        return ResponseEntity.ok(ApiResponse.success("标签更新成功", tag));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "删除标签（仅管理员）")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.ok(ApiResponse.success("标签删除成功", null));
    }
}
