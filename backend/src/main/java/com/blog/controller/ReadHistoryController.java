package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.ReadHistoryDto.UpdateProgressRequest;
import com.blog.entity.UserReadHistory;
import com.blog.security.UserPrincipal;
import com.blog.service.UserReadHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class ReadHistoryController {

    private final UserReadHistoryService historyService;

    @PostMapping("/{blogId}")
    public ResponseEntity<ApiResponse<Void>> updateProgress(
            @PathVariable Long blogId,
            @Valid @RequestBody(required = false) UpdateProgressRequest body,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (body == null) {
            throw new IllegalArgumentException("请求体不能为空");
        }

        historyService.updateProgress(currentUser.getId(), blogId, body.getProgress(), body.getScrollPosition());
        return ResponseEntity.ok(ApiResponse.success("进度已更新", null));
    }

    @GetMapping("/{blogId}")
    public ResponseEntity<ApiResponse<UserReadHistory>> getProgress(
            @PathVariable Long blogId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Optional<UserReadHistory> history = historyService.getProgress(currentUser.getId(), blogId);
        return ResponseEntity.ok(ApiResponse.success("获取阅读进度成功", history.orElse(null)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Map<String, Object> history = historyService.getUserHistory(currentUser.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("获取阅读历史成功", history));
    }

    @DeleteMapping("/{blogId}")
    public ResponseEntity<ApiResponse<Void>> deleteHistory(
            @PathVariable Long blogId,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        historyService.deleteHistory(currentUser.getId(), blogId);
        return ResponseEntity.ok(ApiResponse.success("记录已删除", null));
    }
}
