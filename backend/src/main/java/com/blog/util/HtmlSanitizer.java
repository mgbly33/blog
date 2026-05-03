package com.blog.util;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.stereotype.Component;

/**
 * HTML消毒工具类，防止存储型XSS攻击。
 * 使用OWASP Java HTML Sanitizer库安全地过滤用户输入的HTML内容。
 */
@Component
public class HtmlSanitizer {

    /**
     * 博客内容策略：允许常见的HTMLTags和样式，但禁止脚本和危险属性
     */
    private static final PolicyFactory BLOG_CONTENT_POLICY = new HtmlPolicyBuilder()
            // 允许基本文本格式Tags
            .allowElements("p", "br", "div", "span")
            .allowElements("b", "strong", "i", "em", "u", "s", "strike", "del")
            .allowElements("sub", "sup", "small", "mark")

            // 允许标题Tags
            .allowElements("h1", "h2", "h3", "h4", "h5", "h6")

            // 允许列表Tags
            .allowElements("ul", "ol", "li")

            // 允许代码和预格式化Tags
            .allowElements("pre", "code", "kbd", "samp", "var")

            // 允许引用Tags
            .allowElements("blockquote", "q", "cite")

            // 允许表格Tags
            .allowElements("table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption")

            // 允许链接，但限制协议
            .allowElements("a")
            .allowUrlProtocols("http", "https", "mailto")
            .allowAttributes("href").onElements("a")
            .allowAttributes("title").onElements("a")
            .allowAttributes("target").onElements("a")
            .requireRelNofollowOnLinks()

            // 允许图片，但限制协议
            .allowElements("img")
            .allowUrlProtocols("http", "https")
            .allowAttributes("src", "alt", "title", "width", "height").onElements("img")

            // 允许某些常用样式类（用于代码高亮等）
            .allowAttributes("class").globally()

            // 允许data属性用于某些组件
            .allowAttributes("data-lang", "data-line").onElements("pre", "code")

            // 允许id属性用于锚点
            .allowAttributes("id").globally()

            .toFactory();

    /**
     * 评论内容策略：更严格，只允许基本格式
     */
    private static final PolicyFactory COMMENT_POLICY = new HtmlPolicyBuilder()
            // 只允许基本文本格式
            .allowElements("p", "br")
            .allowElements("b", "strong", "i", "em", "u")
            .allowElements("code")

            // 允许链接但更严格
            .allowElements("a")
            .allowUrlProtocols("http", "https")
            .allowAttributes("href").onElements("a")
            .requireRelNofollowOnLinks()

            .toFactory();

    /**
     * 纯文本策略：删除所有HTMLTags
     */
    private static final PolicyFactory PLAIN_TEXT_POLICY = new HtmlPolicyBuilder()
            .toFactory();

    /**
     * 消毒博客内容HTML
     * 
     * @param html 原始HTML内容
     * @return 安全的HTML内容
     */
    public String sanitizeBlogContent(String html) {
        if (html == null) {
            return "";
        }
        if (html.trim().isEmpty()) {
            return "";
        }
        return BLOG_CONTENT_POLICY.sanitize(html);
    }

    /**
     * 消毒评论内容HTML
     *
     * @param html 原始HTML内容
     * @return 安全的HTML内容
     */
    public String sanitizeComment(String html) {
        if (html == null) {
            return "";
        }
        if (html.trim().isEmpty()) {
            return "";
        }
        return COMMENT_POLICY.sanitize(html);
    }

    /**
     * 移除所有HTMLTags，只保留纯文本
     *
     * @param html 原始HTML内容
     * @return 纯文本内容
     */
    public String stripHtml(String html) {
        if (html == null) {
            return "";
        }
        if (html.trim().isEmpty()) {
            return "";
        }
        return PLAIN_TEXT_POLICY.sanitize(html);
    }
}
