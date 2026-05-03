package com.blog.task;

import com.blog.entity.Blog;
import com.blog.repository.BlogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledPostTask {

    private final BlogRepository blogRepository;

    @Scheduled(cron = "0 */5 * * * *") // 每5分钟执行一次
    @Transactional
    public void processScheduledPosts() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Starting scheduled post processing at {}", now);

        // 1. Publish定时文章
        List<Blog> postsToPublish = blogRepository.findByStatusAndPublishAtBefore(
                Blog.Status.SCHEDULED, now);

        if (!postsToPublish.isEmpty()) {
            for (Blog post : postsToPublish) {
                post.setStatus(Blog.Status.APPROVED);
                // 可以选择更新 createdAt 为Publish时间，或者保持原样
                log.info("Published post: id={}, title={}", post.getId(), post.getTitle());
            }
            blogRepository.saveAll(postsToPublish);
            log.info("Processed {} posts for publishing.", postsToPublish.size());
        }

        // 2. 下线定时文章
        List<Blog> postsToUnpublish = blogRepository.findByStatusAndUnpublishAtBefore(
                Blog.Status.APPROVED, now);

        if (!postsToUnpublish.isEmpty()) {
            for (Blog post : postsToUnpublish) {
                post.setStatus(Blog.Status.ARCHIVED);
                log.info("Unpublished (Archived) post: id={}, title={}", post.getId(), post.getTitle());
            }
            blogRepository.saveAll(postsToUnpublish);
            log.info("Processed {} posts for unpublishing.", postsToUnpublish.size());
        }

        log.info("Finished scheduled post processing.");
    }
}
