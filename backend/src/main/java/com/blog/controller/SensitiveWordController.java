package com.blog.controller;

import com.blog.dto.PageDto;
import com.blog.entity.SensitiveWord;
import com.blog.service.SensitiveWordService;
import com.blog.util.SensitiveWordFilter;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/sensitive-words")
@RequiredArgsConstructor
public class SensitiveWordController {

    private final SensitiveWordService sensitiveWordService;

    /**
     * 获取敏感词列表（分页）
     */
    @GetMapping
    public ResponseEntity<?> getWords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category
    ) {
        var wordPage = sensitiveWordService.getWords(page, size, category);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                        "content", wordPage.getContent(),
                        "totalElements", wordPage.getTotalElements(),
                        "totalPages", wordPage.getTotalPages(),
                        "first", wordPage.isFirst(),
                        "last", wordPage.isLast()
                )
        ));
    }

    /**
     * 添加敏感词
     */
    @PostMapping
    public ResponseEntity<?> addWord(@RequestBody AddWordRequest request) {
        try {
            SensitiveWord word = sensitiveWordService.addWord(
                    request.word, request.level, request.category
            );
            return ResponseEntity.ok(Map.of("success", true, "data", word, "message", "添加成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * 批量添加敏感词
     */
    @PostMapping("/batch")
    public ResponseEntity<?> batchAddWords(@RequestBody BatchAddRequest request) {
        int count = sensitiveWordService.batchAddWords(
                request.words, request.level, request.category
        );
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", String.format("成功添加 %d 个敏感词", count),
                "data", count
        ));
    }

    /**
     * 更新敏感词
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateWord(@PathVariable Long id, @RequestBody UpdateWordRequest request) {
        try {
            SensitiveWord word = sensitiveWordService.updateWord(
                    id, request.word, request.level, request.category
            );
            return ResponseEntity.ok(Map.of("success", true, "data", word, "message", "更新成功"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * 删除敏感词
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWord(@PathVariable Long id) {
        sensitiveWordService.deleteWord(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "删除成功"));
    }

    /**
     * 文本检测（管理员调试用）
     */
    @PostMapping("/check")
    public ResponseEntity<?> checkText(@RequestBody CheckRequest request) {
        SensitiveWordFilter.CheckResult result = sensitiveWordService.checkContent(request.text);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                        "passed", result.passed,
                        "matchCount", result.matches.size(),
                        "matches", result.matches.stream().map(m ->
                                Map.of("word", m.word, "level", m.level.name(), "startIndex", m.startIndex)
                        ).toList(),
                        "highestLevel", result.highestLevel != null ? result.highestLevel.name() : null
                )
        ));
    }

    /**
     * 重新加载过滤器
     */
    @PostMapping("/reload")
    public ResponseEntity<?> reloadFilter() {
        sensitiveWordService.reloadFilter();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "过滤器已重新加载",
                "data", Map.of("wordCount", sensitiveWordService.getFilterSize())
        ));
    }

    @Data
    static class AddWordRequest {
        String word;
        SensitiveWord.Level level;
        String category;
    }

    @Data
    static class BatchAddRequest {
        List<String> words;
        SensitiveWord.Level level;
        String category;
    }

    @Data
    static class UpdateWordRequest {
        String word;
        SensitiveWord.Level level;
        String category;
    }

    @Data
    static class CheckRequest {
        String text;
    }
}
