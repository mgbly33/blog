package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.DraftDto.DraftListItem;
import com.blog.dto.DraftDto.DraftResponse;
import com.blog.dto.DraftDto.SaveRequest;
import com.blog.dto.DraftDto.VersionResponse;
import com.blog.dto.PageDto;
import com.blog.security.UserPrincipal;
import com.blog.service.DraftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drafts")
@RequiredArgsConstructor
@Tag(name = "Draft", description = "草稿管理接口")
public class DraftController {

    private final DraftService draftService;

    @GetMapping
    @Operation(summary = "获取用户草稿列表")
    public ResponseEntity<ApiResponse<PageDto<DraftListItem>>> getUserDrafts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PageDto<DraftListItem> drafts = draftService.getUserDrafts(userPrincipal.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(drafts));
    }

    @GetMapping("/{id}")
    @Operation(summary = "根据ID获取草稿")
    public ResponseEntity<ApiResponse<DraftResponse>> getDraftById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DraftResponse draft = draftService.getDraftById(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(draft));
    }

    @GetMapping("/blog/{blogId}")
    @Operation(summary = "根据博客ID获取草稿")
    public ResponseEntity<ApiResponse<DraftResponse>> getDraftByBlogId(
            @PathVariable Long blogId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DraftResponse draft = draftService.getDraftByBlogId(blogId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(draft));
    }

    @PostMapping
    @Operation(summary = "保存新草稿")
    public ResponseEntity<ApiResponse<DraftResponse>> saveDraft(
            @Valid @RequestBody SaveRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DraftResponse draft = draftService.saveDraft(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("草稿保存成功", draft));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新草稿")
    public ResponseEntity<ApiResponse<DraftResponse>> updateDraft(
            @PathVariable Long id,
            @Valid @RequestBody SaveRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DraftResponse draft = draftService.updateDraft(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("草稿更新成功", draft));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除草稿")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        draftService.deleteDraft(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("草稿删除成功", null));
    }

    @GetMapping("/{id}/versions")
    @Operation(summary = "获取草稿版本历史")
    public ResponseEntity<ApiResponse<List<VersionResponse>>> getVersionHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<VersionResponse> versions = draftService.getVersionHistory(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(versions));
    }

    @GetMapping("/{id}/versions/{version}")
    @Operation(summary = "获取指定版本的草稿")
    public ResponseEntity<ApiResponse<VersionResponse>> getVersion(
            @PathVariable Long id,
            @PathVariable int version,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        VersionResponse versionResponse = draftService.getVersion(id, version, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(versionResponse));
    }

    @PostMapping("/{id}/versions/{version}/restore")
    @Operation(summary = "恢复到指定版本")
    public ResponseEntity<ApiResponse<DraftResponse>> restoreVersion(
            @PathVariable Long id,
            @PathVariable int version,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DraftResponse draft = draftService.restoreVersion(id, version, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("版本恢复成功", draft));
    }
}
