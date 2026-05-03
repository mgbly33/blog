package com.blog.controller;

import com.blog.entity.Blog;
import com.blog.entity.User;
import com.blog.repository.BlogRepository;
import com.blog.repository.UserRepository;
import com.rometools.rome.feed.atom.*;
import com.rometools.rome.feed.rss.Channel;
import com.rometools.rome.feed.rss.Description;
import com.rometools.rome.feed.rss.Guid;
import com.rometools.rome.feed.rss.Item;
import com.rometools.rome.io.SyndFeedOutput;
import com.rometools.rome.feed.synd.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/feed")
@RequiredArgsConstructor
public class FeedController {

    private final BlogRepository blogRepository;
    private final UserRepository userRepository;

    @Value("${app.feed.site-url:http://localhost:3000}")
    private String siteUrl;

    @Value("${app.feed.title:Modern Blog}")
    private String feedTitle;

    @Value("${app.feed.description:一个现代化的博客平台}")
    private String feedDescription;

    /**
     * RSS 2.0 Feed
     */
    @GetMapping(value = "/rss", produces = "application/rss+xml;charset=UTF-8")
    public ResponseEntity<String> rss() {
        try {
            SyndFeed feed = buildSyndFeed("rss_2.0");
            SyndFeedOutput output = new SyndFeedOutput();
            String xml = output.outputString(feed);
            return ResponseEntity.ok(xml);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("<error>生成RSS失败</error>");
        }
    }

    /**
     * Atom 1.0 Feed
     */
    @GetMapping(value = "/atom", produces = "application/atom+xml;charset=UTF-8")
    public ResponseEntity<String> atom() {
        try {
            SyndFeed feed = buildSyndFeed("atom_1.0");
            SyndFeedOutput output = new SyndFeedOutput();
            String xml = output.outputString(feed);
            return ResponseEntity.ok(xml);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("<error>生成Atom失败</error>");
        }
    }

    private SyndFeed buildSyndFeed(String feedType) {
        // 获取最新的20篇已审核公开文章
        var pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt"));
        var blogs = blogRepository.findByStatusAndVisibility(
                Blog.Status.APPROVED, Blog.Visibility.PUBLIC, pageable
        ).getContent();

        // 批量获取作者信息
        var authorIds = blogs.stream().map(Blog::getAuthorId).distinct().collect(Collectors.toList());
        Map<Long, User> authorMap = userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // 构建 SyndFeed
        SyndFeed feed = new SyndFeedImpl();
        feed.setFeedType(feedType);
        feed.setTitle(feedTitle);
        feed.setLink(siteUrl);
        feed.setDescription(feedDescription);
        feed.setLanguage("zh-CN");

        if (!blogs.isEmpty()) {
            feed.setPublishedDate(Date.from(
                    blogs.get(0).getCreatedAt().atZone(ZoneId.systemDefault()).toInstant()
            ));
        }

        List<SyndEntry> entries = blogs.stream().map(blog -> {
            SyndEntry entry = new SyndEntryImpl();
            entry.setTitle(blog.getTitle());
            entry.setLink(siteUrl + "/blog/" + blog.getId());
            entry.setUri(siteUrl + "/blog/" + blog.getId());
            entry.setPublishedDate(Date.from(
                    blog.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant()
            ));

            // 作者
            User author = authorMap.get(blog.getAuthorId());
            if (author != null) {
                entry.setAuthor(author.getUsername());
            }

            // 摘要
            SyndContent description = new SyndContentImpl();
            description.setType("text/plain");
            description.setValue(blog.getSummary() != null ? blog.getSummary() : "");
            entry.setDescription(description);

            // 全文内容（HTML）
            if (blog.getContent() != null) {
                SyndContent content = new SyndContentImpl();
                content.setType("text/html");
                content.setValue(blog.getContent());
                entry.setContents(List.of(content));
            }

            return entry;
        }).collect(Collectors.toList());

        feed.setEntries(entries);
        return feed;
    }
}
