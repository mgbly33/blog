package com.blog.util;

import com.blog.entity.SensitiveWord;

import java.util.*;

/**
 * 基于 Aho-Corasick 自动机的敏感词过滤器。
 * 支持多模式匹配，高效检测文本中的敏感词。
 */
public class SensitiveWordFilter {

    private final TrieNode root = new TrieNode();
    private boolean built = false;

    // 存储词及其级别的映射
    private final Map<String, SensitiveWord.Level> wordLevelMap = new HashMap<>();

    public static class MatchResult {
        public final String word;
        public final int startIndex;
        public final SensitiveWord.Level level;

        public MatchResult(String word, int startIndex, SensitiveWord.Level level) {
            this.word = word;
            this.startIndex = startIndex;
            this.level = level;
        }

        @Override
        public String toString() {
            String levelText;
            if (level == SensitiveWord.Level.BLOCK) {
                levelText = "拦截";
            } else if (level == SensitiveWord.Level.REVIEW) {
                levelText = "审核";
            } else {
                levelText = "警告";
            }
            return String.format("\"%s\" 位置 %d（%s）", word, startIndex, levelText);
        }
    }

    /**
     * 检查结果
     */
    public static class CheckResult {
        public final boolean passed;
        public final List<MatchResult> matches;
        public final SensitiveWord.Level highestLevel;

        public CheckResult(boolean passed, List<MatchResult> matches) {
            this.passed = passed;
            this.matches = matches;
            this.highestLevel = matches.stream()
                    .map(m -> m.level)
                    .max(Comparator.comparingInt(l -> l == SensitiveWord.Level.BLOCK ? 2 :
                            l == SensitiveWord.Level.REVIEW ? 1 : 0))
                    .orElse(null);
        }
    }

    /**
     * 添加敏感词到字典树
     */
    public void addWord(String word, SensitiveWord.Level level) {
        if (word == null || word.isBlank()) return;

        String lowerWord = word.toLowerCase();
        wordLevelMap.put(lowerWord, level);

        TrieNode current = root;
        for (char c : lowerWord.toCharArray()) {
            current.children.putIfAbsent(c, new TrieNode());
            current = current.children.get(c);
        }
        current.isEnd = true;
        current.word = lowerWord;

        built = false; // 需要重新构建失败指针
    }

    /**
     * 构建 Aho-Corasick 的失败指针（BFS）
     */
    public void build() {
        Queue<TrieNode> queue = new LinkedList<>();

        // 根节点的所有子节点的失败指针指向根
        for (TrieNode child : root.children.values()) {
            child.fail = root;
            queue.add(child);
        }

        // BFS 构建失败指针
        while (!queue.isEmpty()) {
            TrieNode current = queue.poll();
            for (Map.Entry<Character, TrieNode> entry : current.children.entrySet()) {
                char c = entry.getKey();
                TrieNode child = entry.getValue();

                // 寻找失败指针
                TrieNode fail = current.fail;
                while (fail != null && !fail.children.containsKey(c)) {
                    fail = fail.fail;
                }
                child.fail = (fail == null) ? root : fail.children.get(c);

                // 合并输出：如果失败指针指向的节点也是结束节点
                if (child.fail.isEnd) {
                    child.isEnd = true;
                    if (child.word == null) {
                        child.word = child.fail.word;
                    }
                }

                queue.add(child);
            }
        }

        built = true;
    }

    /**
     * 搜索文本中的所有敏感词
     */
    public List<MatchResult> search(String text) {
        if (!built) build();
        if (text == null || text.isBlank()) return Collections.emptyList();

        String lowerText = text.toLowerCase();
        List<MatchResult> results = new ArrayList<>();
        TrieNode current = root;

        for (int i = 0; i < lowerText.length(); i++) {
            char c = lowerText.charAt(i);

            // 沿失败指针回退
            while (current != root && !current.children.containsKey(c)) {
                current = current.fail;
            }

            if (current.children.containsKey(c)) {
                current = current.children.get(c);
            }

            // 检查当前节点及其失败链上的所有匹配
            TrieNode temp = current;
            while (temp != root) {
                if (temp.isEnd && temp.word != null) {
                    SensitiveWord.Level level = wordLevelMap.getOrDefault(temp.word, SensitiveWord.Level.WARN);
                    int startIndex = i - temp.word.length() + 1;
                    results.add(new MatchResult(temp.word, startIndex, level));
                }
                temp = temp.fail;
            }
        }

        return results;
    }

    /**
     * 检查文本是否包含敏感词
     */
    public CheckResult check(String text) {
        List<MatchResult> matches = search(text);
        boolean passed = matches.isEmpty() ||
                matches.stream().noneMatch(m -> m.level == SensitiveWord.Level.BLOCK);
        return new CheckResult(passed, matches);
    }

    /**
     * 替换敏感词为星号
     */
    public String replace(String text) {
        if (!built) build();
        if (text == null || text.isBlank()) return text;

        List<MatchResult> matches = search(text);
        if (matches.isEmpty()) return text;

        char[] chars = text.toCharArray();
        for (MatchResult match : matches) {
            for (int i = match.startIndex; i < match.startIndex + match.word.length() && i < chars.length; i++) {
                chars[i] = '*';
            }
        }
        return new String(chars);
    }

    /**
     * 获取已加载的词数量
     */
    public int size() {
        return wordLevelMap.size();
    }

    private static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        TrieNode fail; // 失败指针
        boolean isEnd;
        String word;
    }
}
