package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.dto.PageDto;
import com.blog.dto.SeriesDto;
import com.blog.security.UserPrincipal;
import com.blog.service.SeriesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/series")
@RequiredArgsConstructor
public class SeriesController {

    private final SeriesService seriesService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SeriesDto.Response>> createSeries(
            @Valid @RequestBody SeriesDto.CreateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(seriesService.createSeries(request, currentUser.getId())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SeriesDto.Response>> updateSeries(
            @PathVariable Long id,
            @Valid @RequestBody SeriesDto.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(seriesService.updateSeries(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSeries(
            @PathVariable Long id) {
        seriesService.deleteSeries(id);
        return ResponseEntity.ok(ApiResponse.success("\u4e13\u680f\u5220\u9664\u6210\u529f", null));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageDto<SeriesDto.Response>>> getSeriesList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(seriesService.getSeriesList(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SeriesDto.Response>> getSeriesById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(seriesService.getSeriesById(id)));
    }
}
