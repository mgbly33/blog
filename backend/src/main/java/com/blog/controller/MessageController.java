package com.blog.controller;

import com.blog.dto.ApiResponse;
import com.blog.security.UserPrincipal;
import com.blog.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * 发送私信
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Long receiverId = Long.parseLong(body.get("receiverId"));
        String content = body.get("content");

        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("消息内容不能为空"));
        }

        Map<String, Object> message = messageService.sendMessage(currentUser.getId(), receiverId, content.trim());
        return ResponseEntity.ok(ApiResponse.success("发送成功", message));
    }

    /**
     * 获取会话列表
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getConversations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Map<String, Object>> conversations = messageService.getConversations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    /**
     * 获取与某人的对话详情
     */
    @GetMapping("/conversation/{partnerId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConversation(
            @PathVariable Long partnerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Map<String, Object> conversation = messageService.getConversation(currentUser.getId(), partnerId, page, size);
        return ResponseEntity.ok(ApiResponse.success(conversation));
    }

    /**
     * 获取未读消息数
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        long count = messageService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
