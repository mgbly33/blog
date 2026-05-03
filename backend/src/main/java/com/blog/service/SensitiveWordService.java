package com.blog.service;

import com.blog.entity.SensitiveWord;
import com.blog.repository.SensitiveWordRepository;
import com.blog.util.SensitiveWordFilter;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SensitiveWordService {

    private final SensitiveWordRepository sensitiveWordRepository;
    private volatile SensitiveWordFilter filter;

    /**
     * 应用启动时初始化敏感词过滤器
     */
    @PostConstruct
    public void init() {
        reloadFilter();
    }

    /**
     * 重新加载敏感词到过滤器
     */
    public synchronized void reloadFilter() {
        SensitiveWordFilter newFilter = new SensitiveWordFilter();
        List<SensitiveWord> words = sensitiveWordRepository.findAll();
        for (SensitiveWord word : words) {
            newFilter.addWord(word.getWord(), word.getLevel());
        }
        newFilter.build();
        this.filter = newFilter;
        log.info("Sensitive word filter reloaded with {} words", words.size());
    }

    /**
     * 检查内容是否包含敏感词
     */
    public SensitiveWordFilter.CheckResult checkContent(String content) {
        return filter.check(content);
    }

    /**
     * 替换内容中的敏感词为星号
     */
    public String replaceContent(String content) {
        return filter.replace(content);
    }

    /**
     * 检查文本是否包含被阻止的敏感词（BLOCK 级别）
     */
    public boolean containsBlockedWord(String text) {
        SensitiveWordFilter.CheckResult result = filter.check(text);
        return !result.passed;
    }

    /**
     * Publish前检查（标题 + 内容 + 摘要）
     */
    public SensitiveWordFilter.CheckResult prePublishCheck(String title, String content, String summary) {
        // 合并检查所有文本
        StringBuilder fullText = new StringBuilder();
        if (title != null) fullText.append(title).append(" ");
        if (content != null) fullText.append(content).append(" ");
        if (summary != null) fullText.append(summary);

        return filter.check(fullText.toString());
    }

    // ============ Admin CRUD ============

    public Page<SensitiveWord> getWords(int page, int size, String category) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (category != null && !category.isBlank()) {
            return sensitiveWordRepository.findAll(pageable); // TODO: add category filter
        }
        return sensitiveWordRepository.findAll(pageable);
    }

    public List<SensitiveWord> getAllWords() {
        return sensitiveWordRepository.findAll();
    }

    @Transactional
    public SensitiveWord addWord(String word, SensitiveWord.Level level, String category) {
        if (sensitiveWordRepository.existsByWord(word)) {
            throw new IllegalArgumentException("该敏感词已存在");
        }

        SensitiveWord sw = SensitiveWord.builder()
                .word(word.trim())
                .level(level != null ? level : SensitiveWord.Level.BLOCK)
                .category(category)
                .build();

        SensitiveWord saved = sensitiveWordRepository.save(sw);
        reloadFilter(); // 重新加载过滤器
        return saved;
    }

    @Transactional
    public SensitiveWord updateWord(Long id, String word, SensitiveWord.Level level, String category) {
        SensitiveWord sw = sensitiveWordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("敏感词不存在"));

        if (word != null && !word.isBlank()) {
            // 检查是否与其他词冲突
            if (!sw.getWord().equals(word.trim()) && sensitiveWordRepository.existsByWord(word.trim())) {
                throw new IllegalArgumentException("该敏感词已存在");
            }
            sw.setWord(word.trim());
        }
        if (level != null) sw.setLevel(level);
        if (category != null) sw.setCategory(category);

        SensitiveWord saved = sensitiveWordRepository.save(sw);
        reloadFilter();
        return saved;
    }

    @Transactional
    public void deleteWord(Long id) {
        sensitiveWordRepository.deleteById(id);
        reloadFilter();
    }

    @Transactional
    public int batchAddWords(List<String> words, SensitiveWord.Level level, String category) {
        int count = 0;
        for (String word : words) {
            String trimmed = word.trim();
            if (!trimmed.isBlank() && !sensitiveWordRepository.existsByWord(trimmed)) {
                SensitiveWord sw = SensitiveWord.builder()
                        .word(trimmed)
                        .level(level != null ? level : SensitiveWord.Level.BLOCK)
                        .category(category)
                        .build();
                sensitiveWordRepository.save(sw);
                count++;
            }
        }
        if (count > 0) reloadFilter();
        return count;
    }

    public int getFilterSize() {
        return filter.size();
    }
}
