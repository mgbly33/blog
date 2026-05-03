// 将 filterSensitiveWords 迁移为 TS，方便 Blog 模型调用
const SENSITIVE_WORDS: string[] = ['badword', 'offensive', 'spam', 'hate'];

const filterSensitiveWords = (text: string | undefined | null): string => {
    if (!text) return text || '';
    let filteredText = text;
    SENSITIVE_WORDS.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
};

export default filterSensitiveWords;
