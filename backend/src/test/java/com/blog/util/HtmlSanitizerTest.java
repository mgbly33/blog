package com.blog.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * HtmlSanitizer 单元测试
 * 验证 XSS 消毒功能的正确性和安全性
 */
class HtmlSanitizerTest {

    private HtmlSanitizer htmlSanitizer;

    @BeforeEach
    void setUp() {
        htmlSanitizer = new HtmlSanitizer();
    }

    // ========== 博客内容消毒测试 ==========

    @Nested
    @DisplayName("博客内容消毒测试")
    class BlogContentSanitizationTests {

        @Test
        @DisplayName("移除 script 标签")
        void sanitizeBlogContent_shouldRemoveScriptTags() {
            // Arrange
            String maliciousContent = "<p>正常内容</p><script>alert('xss')</script><p>更多内容</p>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("<script>");
            assertThat(result).doesNotContain("</script>");
            assertThat(result).doesNotContain("alert");
            assertThat(result).contains("正常内容");
            assertThat(result).contains("更多内容");
        }

        @Test
        @DisplayName("移除 onclick 等事件属性")
        void sanitizeBlogContent_shouldRemoveEventHandlers() {
            // Arrange
            String maliciousContent = "<button onclick=\"alert('xss')\">点击</button>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("onclick");
            assertThat(result).doesNotContain("alert");
        }

        @Test
        @DisplayName("移除 javascript: 协议链接")
        void sanitizeBlogContent_shouldRemoveJavascriptProtocol() {
            // Arrange
            String maliciousContent = "<a href=\"javascript:alert('xss')\">恶意链接</a>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("javascript:");
        }

        @Test
        @DisplayName("移除 iframe 标签")
        void sanitizeBlogContent_shouldRemoveIframeTags() {
            // Arrange
            String maliciousContent = "<p>正常</p><iframe src=\"evil.com\"></iframe>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("<iframe");
            assertThat(result).doesNotContain("</iframe>");
        }

        @Test
        @DisplayName("保留合法的 HTML 标签")
        void sanitizeBlogContent_shouldPreserveValidTags() {
            // Arrange
            String validContent = "<h1>标题</h1><p>段落</p><strong>粗体</strong><em>斜体</em><ul><li>列表</li></ul>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(validContent);

            // Assert
            assertThat(result).contains("<h1>");
            assertThat(result).contains("<p>");
            assertThat(result).contains("<strong>");
            assertThat(result).contains("<em>");
            assertThat(result).contains("<ul>");
            assertThat(result).contains("<li>");
        }

        @Test
        @DisplayName("保留合法的链接")
        void sanitizeBlogContent_shouldPreserveValidLinks() {
            // Arrange
            String validContent = "<a href=\"https://example.com\">安全链接</a>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(validContent);

            // Assert
            assertThat(result).contains("https://example.com");
            assertThat(result).contains("安全链接");
        }

        @Test
        @DisplayName("保留合法的图片")
        void sanitizeBlogContent_shouldPreserveValidImages() {
            // Arrange
            String validContent = "<img src=\"https://example.com/image.jpg\" alt=\"图片\">";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(validContent);

            // Assert
            assertThat(result).contains("img");
            assertThat(result).contains("https://example.com/image.jpg");
        }

        @Test
        @DisplayName("保留代码块")
        void sanitizeBlogContent_shouldPreserveCodeBlocks() {
            // Arrange
            String validContent = "<pre><code>function test() { return 1; }</code></pre>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(validContent);

            // Assert
            assertThat(result).contains("<pre>");
            assertThat(result).contains("<code>");
        }

        @Test
        @DisplayName("处理 null 和空字符串")
        void sanitizeBlogContent_shouldHandleNullAndEmpty() {
            // Act & Assert
            assertThat(htmlSanitizer.sanitizeBlogContent(null)).isEqualTo("");
            assertThat(htmlSanitizer.sanitizeBlogContent("")).isEqualTo("");
            assertThat(htmlSanitizer.sanitizeBlogContent("   ")).isEqualTo("");
        }

        @Test
        @DisplayName("移除 onload 图片事件")
        void sanitizeBlogContent_shouldRemoveImgOnload() {
            // Arrange
            String maliciousContent = "<img src=\"x\" onerror=\"alert('xss')\">";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("onerror");
            assertThat(result).doesNotContain("alert");
        }
    }

    // ========== 评论内容消毒测试 ==========

    @Nested
    @DisplayName("评论内容消毒测试")
    class CommentSanitizationTests {

        @Test
        @DisplayName("评论消毒比博客更严格")
        void sanitizeComment_shouldBeMoreRestrictive() {
            // Arrange - 评论不应该允许大量 HTML 标签
            String content = "<h1>标题</h1><script>bad</script><p>评论内容</p>";

            // Act
            String result = htmlSanitizer.sanitizeComment(content);

            // Assert
            assertThat(result).doesNotContain("<script>");
            assertThat(result).doesNotContain("<h1>"); // 评论不需要标题标签
        }

        @Test
        @DisplayName("评论应移除所有危险内容")
        void sanitizeComment_shouldRemoveDangerousContent() {
            // Arrange
            String maliciousComment = "<script>alert('xss')</script>正常评论<img onerror='bad'>";

            // Act
            String result = htmlSanitizer.sanitizeComment(maliciousComment);

            // Assert
            assertThat(result).doesNotContain("<script>");
            assertThat(result).doesNotContain("onerror");
            assertThat(result).contains("正常评论");
        }

        @Test
        @DisplayName("处理 null 和空字符串")
        void sanitizeComment_shouldHandleNullAndEmpty() {
            // Act & Assert
            assertThat(htmlSanitizer.sanitizeComment(null)).isEqualTo("");
            assertThat(htmlSanitizer.sanitizeComment("")).isEqualTo("");
        }
    }

    // ========== 完全移除 HTML 测试 ==========

    @Nested
    @DisplayName("HTML 完全移除测试")
    class StripHtmlTests {

        @Test
        @DisplayName("移除所有 HTML 标签只保留文本")
        void stripHtml_shouldRemoveAllTags() {
            // Arrange
            String htmlContent = "<h1>标题</h1><p>段落<strong>粗体</strong></p>";

            // Act
            String result = htmlSanitizer.stripHtml(htmlContent);

            // Assert
            assertThat(result).doesNotContain("<");
            assertThat(result).doesNotContain(">");
            assertThat(result).contains("标题");
            assertThat(result).contains("段落");
            assertThat(result).contains("粗体");
        }

        @Test
        @DisplayName("处理 null 和空字符串")
        void stripHtml_shouldHandleNullAndEmpty() {
            // Act & Assert
            assertThat(htmlSanitizer.stripHtml(null)).isEqualTo("");
            assertThat(htmlSanitizer.stripHtml("")).isEqualTo("");
        }
    }

    // ========== 复杂攻击测试 ==========

    @Nested
    @DisplayName("复杂 XSS 攻击防护测试")
    class AdvancedXssProtectionTests {

        @Test
        @DisplayName("防护 SVG XSS 攻击")
        void sanitizeBlogContent_shouldProtectAgainstSvgXss() {
            // Arrange
            String maliciousContent = "<svg onload=\"alert('xss')\"><circle r=\"10\"/></svg>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("onload");
            assertThat(result).doesNotContain("alert");
        }

        @Test
        @DisplayName("防护 data: 协议攻击")
        void sanitizeBlogContent_shouldProtectAgainstDataProtocol() {
            // Arrange
            String maliciousContent = "<a href=\"data:text/html,<script>alert('xss')</script>\">点击</a>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("data:");
        }

        @Test
        @DisplayName("防护 CSS 表达式攻击")
        void sanitizeBlogContent_shouldProtectAgainstCssExpression() {
            // Arrange
            String maliciousContent = "<div style=\"background:url(javascript:alert('xss'))\">内容</div>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("javascript:");
        }

        @Test
        @DisplayName("防护编码绕过攻击")
        void sanitizeBlogContent_shouldProtectAgainstEncodingBypass() {
            // Arrange - 十六进制编码的 javascript
            String maliciousContent = "<a href=\"&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;:\">点击</a>";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert - 应该移除或转义危险链接
            assertThat(result).doesNotContain("javascript");
        }

        @Test
        @DisplayName("防护 meta 标签注入")
        void sanitizeBlogContent_shouldRemoveMetaTags() {
            // Arrange
            String maliciousContent = "<meta http-equiv=\"refresh\" content=\"0;url=evil.com\">";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("<meta");
        }

        @Test
        @DisplayName("防护 base 标签注入")
        void sanitizeBlogContent_shouldRemoveBaseTags() {
            // Arrange
            String maliciousContent = "<base href=\"https://evil.com/\">";

            // Act
            String result = htmlSanitizer.sanitizeBlogContent(maliciousContent);

            // Assert
            assertThat(result).doesNotContain("<base");
        }
    }
}
