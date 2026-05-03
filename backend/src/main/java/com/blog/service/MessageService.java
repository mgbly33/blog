package com.blog.service;

import com.blog.dto.ApiResponse;
import com.blog.dto.BlogDto.AuthorInfo;
import com.blog.entity.Message;
import com.blog.entity.User;
import com.blog.exception.ResourceNotFoundException;
import com.blog.repository.MessageRepository;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    /**
     * 发送私信
     */
    @Transactional
    public Map<String, Object> sendMessage(Long senderId, Long receiverId, String content) {
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("不能给自己发消息");
        }
        userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("收信人不存在"));

        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .content(content)
                .type(Message.MessageType.TEXT)
                .build();

        Message saved = messageRepository.save(message);
        return toMessageMap(saved);
    }

    /**
     * 获取会话列表（联系人列表 + 最后一条消息预览）
     */
    public List<Map<String, Object>> getConversations(Long userId) {
        List<Long> partnerIds = messageRepository.findConversationPartnerIds(userId);
        if (partnerIds.isEmpty())
            return List.of();

        Map<Long, User> userMap = userRepository.findAllById(partnerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<Map<String, Object>> conversations = new ArrayList<>();
        for (Long partnerId : partnerIds) {
            User partner = userMap.get(partnerId);
            if (partner == null)
                continue;

            // 获取最后一条消息
            Page<Message> lastMessages = messageRepository.findLatestConversationMessage(
                    userId, partnerId, PageRequest.of(0, 1));

            Map<String, Object> conv = new LinkedHashMap<>();
            conv.put("partnerId", String.valueOf(partnerId));
            conv.put("partner", AuthorInfo.builder()
                    .id(partner.getId())
                    .username(partner.getUsername())
                    .avatar(partner.getAvatar())
                    .build());

            if (!lastMessages.isEmpty()) {
                Message last = lastMessages.getContent().get(0);
                conv.put("lastMessage", last.getContent().length() > 50 ? last.getContent().substring(0, 50) + "..."
                        : last.getContent());
                conv.put("lastMessageAt", last.getCreatedAt());
                conv.put("isLastFromMe", last.getSenderId().equals(userId));
            }

            // 按会话维度统计未读消息数（来自 partner 的未读消息）
            long unread = messageRepository.countBySenderIdAndReceiverIdAndIsReadFalse(partnerId, userId);
            conv.put("unreadCount", unread);

            conversations.add(conv);
        }

        return conversations;
    }

    /**
     * 获取与某人的对话详情
     */
    @Transactional
    public Map<String, Object> getConversation(Long userId, Long partnerId, int page, int size) {
        // 标记该对话为已读
        messageRepository.markConversationAsRead(partnerId, userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository.findConversation(userId, partnerId, pageable);

        List<Map<String, Object>> items = messages.getContent().stream()
                .map(this::toMessageMap)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", items);
        result.put("page", messages.getNumber());
        result.put("size", messages.getSize());
        result.put("totalElements", messages.getTotalElements());
        result.put("totalPages", messages.getTotalPages());
        return result;
    }

    /**
     * 获取未读消息数
     */
    public long getUnreadCount(Long userId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    private Map<String, Object> toMessageMap(Message msg) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", String.valueOf(msg.getId()));
        map.put("senderId", String.valueOf(msg.getSenderId()));
        map.put("receiverId", String.valueOf(msg.getReceiverId()));
        map.put("content", msg.getContent());
        map.put("type", msg.getType());
        map.put("isRead", msg.getIsRead());
        map.put("createdAt", msg.getCreatedAt());
        return map;
    }
}
