/**
 * AutosaveManager - 草稿自动保存管理器
 * 负责编辑器内容的自动保存、状态指示、离线队列管理
 */

class AutosaveManager {
    constructor(options) {
        this.editor = options.editor;          // EasyMDE 编辑器实例
        this.draftId = options.draftId || null;
        this.blogId = options.blogId || null;
        this.debounceDelay = options.debounceDelay || 3000;
        this.indicatorEl = options.indicatorEl || '#autosaveIndicator';
        this.onSaved = options.onSaved || function() {};
        this.onError = options.onError || function() {};

        this.debounceTimer = null;
        this.lastSavedContent = '';
        this.lastSavedTitle = '';
        this.isSaving = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.offlineQueue = [];
        this.isOnline = navigator.onLine;

        this.init();
    }

    init() {
        // 监听编辑器变化
        if (this.editor && this.editor.codemirror) {
            this.editor.codemirror.on('change', () => this.onContentChange());
        }

        // 监听标题变化
        const titleEl = document.getElementById('title');
        if (titleEl) {
            titleEl.addEventListener('input', () => this.onContentChange());
        }

        // 监听网络状态
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // 监听页面关闭
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));

        // 加载离线队列
        this.loadOfflineQueue();

        // 如果有网络，处理离线队列
        if (this.isOnline && this.offlineQueue.length > 0) {
            this.processOfflineQueue();
        }

        // 保存初始内容用于比较
        this.lastSavedContent = this.getContent();
        this.lastSavedTitle = this.getTitle();

        // 初始状态
        if (this.draftId) {
            this.setStatus('saved');
        }
    }

    onContentChange() {
        const currentContent = this.getContent();
        const currentTitle = this.getTitle();

        // 检查内容是否变化
        if (currentContent === this.lastSavedContent && currentTitle === this.lastSavedTitle) {
            return;
        }

        // 显示待保存状态
        this.setStatus('pending');

        // 清除之前的定时器
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // 设置新的防抖定时器
        this.debounceTimer = setTimeout(() => this.save(), this.debounceDelay);
    }

    async save(isManual = false) {
        if (this.isSaving) return;

        const content = this.getContent();
        const title = this.getTitle();

        // 检查是否有变化
        if (!isManual && content === this.lastSavedContent && title === this.lastSavedTitle) {
            this.setStatus('saved');
            return;
        }

        // 检查网络状态
        if (!this.isOnline) {
            this.queueOfflineSave();
            return;
        }

        this.isSaving = true;
        this.setStatus('saving');

        const data = this.collectFormData();

        try {
            const url = this.draftId ? `/drafts/api/${this.draftId}` : '/drafts/api';
            const method = this.draftId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.draftId = result.draft._id;
                this.lastSavedContent = content;
                this.lastSavedTitle = title;
                this.retryCount = 0;

                this.setStatus('saved', result.savedAt);
                this.onSaved(result);

                // 更新 URL（如果是新创建的草稿）
                if (result.isNew && window.history.replaceState) {
                    const newUrl = window.location.pathname + '?draft=' + this.draftId;
                    window.history.replaceState({}, '', newUrl);
                }
            } else {
                throw new Error(result.message || '保存失败');
            }

        } catch (error) {
            console.error('Autosave error:', error);
            this.handleSaveError(error);
        } finally {
            this.isSaving = false;
        }
    }

    handleSaveError(error) {
        if (!navigator.onLine) {
            this.handleOffline();
            this.queueOfflineSave();
            return;
        }

        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const retryDelay = Math.pow(2, this.retryCount) * 1000; // 指数退避
            this.setStatus('pending');
            setTimeout(() => this.save(), retryDelay);
        } else {
            this.setStatus('error');
            this.onError(error);
        }
    }

    collectFormData() {
        const form = document.querySelector('form');
        const titleEl = document.getElementById('title');
        const categoryEl = document.getElementById('category');
        const tagsEl = document.getElementById('tags');
        const visibilityEl = document.querySelector('input[name="visibility"]:checked');

        return {
            draftId: this.draftId,
            blogId: this.blogId,
            title: titleEl ? titleEl.value : '',
            content: this.getContent(),
            category: categoryEl ? categoryEl.value : '',
            tags: tagsEl ? tagsEl.value : '',
            visibility: visibilityEl ? visibilityEl.value : 'public'
        };
    }

    getContent() {
        return this.editor ? this.editor.value() : '';
    }

    getTitle() {
        const titleEl = document.getElementById('title');
        return titleEl ? titleEl.value : '';
    }

    // 状态管理
    setStatus(status, savedAt = null) {
        const indicator = document.querySelector(this.indicatorEl);
        if (!indicator) return;

        // 隐藏所有状态
        indicator.querySelectorAll('.save-status').forEach(el => {
            el.classList.add('d-none');
        });

        // 显示当前状态
        const statusEl = indicator.querySelector(`.save-status-${status}`);
        if (statusEl) {
            statusEl.classList.remove('d-none');
        }

        // 更新保存时间
        if (savedAt) {
            const timeEl = indicator.querySelector('#lastSavedTime');
            if (timeEl) {
                timeEl.textContent = this.formatTimeAgo(new Date(savedAt));
            }
        }
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return '刚刚';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
        return `${Math.floor(seconds / 86400)} 天前`;
    }

    // 离线队列管理
    handleOnline() {
        this.isOnline = true;
        if (this.offlineQueue.length > 0) {
            this.processOfflineQueue();
        } else {
            // 如果有未保存的更改，立即保存
            const currentContent = this.getContent();
            const currentTitle = this.getTitle();
            if (currentContent !== this.lastSavedContent || currentTitle !== this.lastSavedTitle) {
                this.save();
            }
        }
    }

    handleOffline() {
        this.isOnline = false;
        this.setStatus('offline');
    }

    queueOfflineSave() {
        const data = this.collectFormData();
        this.offlineQueue.push({
            data: data,
            timestamp: Date.now()
        });
        this.saveOfflineQueue();
        this.setStatus('offline');
    }

    saveOfflineQueue() {
        localStorage.setItem('draft_offline_queue', JSON.stringify(this.offlineQueue));
    }

    loadOfflineQueue() {
        const stored = localStorage.getItem('draft_offline_queue');
        if (stored) {
            try {
                this.offlineQueue = JSON.parse(stored);
            } catch (e) {
                this.offlineQueue = [];
            }
        }
    }

    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        this.setStatus('saving');

        // 只保存最新的离线数据
        const latestData = this.offlineQueue[this.offlineQueue.length - 1].data;

        try {
            const url = latestData.draftId ? `/drafts/api/${latestData.draftId}` : '/drafts/api';
            const method = latestData.draftId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(latestData)
            });

            const result = await response.json();

            if (result.success) {
                this.draftId = result.draft._id;
                this.offlineQueue = [];
                localStorage.removeItem('draft_offline_queue');
                this.setStatus('saved', result.savedAt);
                this.onSaved(result);
            }
        } catch (error) {
            console.error('Failed to sync offline queue:', error);
            this.setStatus('error');
        }
    }

    // 页面关闭提醒
    handleBeforeUnload(e) {
        const currentContent = this.getContent();
        const currentTitle = this.getTitle();

        if (currentContent !== this.lastSavedContent || currentTitle !== this.lastSavedTitle) {
            e.preventDefault();
            e.returnValue = '你有未保存的更改，确定要离开吗？';
            return e.returnValue;
        }
    }

    // 手动保存
    manualSave() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.save(true);
    }

    // 重试保存
    retrySave() {
        this.retryCount = 0;
        this.save(true);
    }

    // 获取草稿ID
    getDraftId() {
        return this.draftId;
    }
}

// 键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // Ctrl+S / Cmd+S: 手动保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (window.autosaveManager) {
            window.autosaveManager.manualSave();
        }
    }
});

// 导出到全局
window.AutosaveManager = AutosaveManager;
