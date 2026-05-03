/**
 * VersionHistoryManager - 版本历史管理器
 * 负责版本列表加载、预览和恢复
 */

class VersionHistoryManager {
    constructor(options) {
        this.draftId = options.draftId;
        this.offcanvasEl = options.offcanvasEl || '#versionHistoryPanel';
        this.listContainer = options.listContainer || '#versionList';
        this.onRestore = options.onRestore || function() {};

        this.versions = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.isLoading = false;
        this.offcanvas = null;

        this.init();
    }

    init() {
        // 初始化 Bootstrap Offcanvas
        const offcanvasElement = document.querySelector(this.offcanvasEl);
        if (offcanvasElement) {
            this.offcanvas = new bootstrap.Offcanvas(offcanvasElement);

            // 监听打开事件
            offcanvasElement.addEventListener('show.bs.offcanvas', () => {
                if (this.draftId) {
                    this.loadVersions(true);
                }
            });
        }
    }

    setDraftId(draftId) {
        this.draftId = draftId;
        this.versions = [];
        this.currentPage = 1;
        this.hasMore = true;
    }

    open() {
        if (this.offcanvas) {
            this.offcanvas.show();
        }
    }

    close() {
        if (this.offcanvas) {
            this.offcanvas.hide();
        }
    }

    async loadVersions(reset = false) {
        if (this.isLoading || (!this.hasMore && !reset)) return;
        if (!this.draftId) {
            this.showEmpty('请先保存草稿');
            return;
        }

        if (reset) {
            this.versions = [];
            this.currentPage = 1;
            this.hasMore = true;
        }

        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch(`/drafts/api/${this.draftId}/versions?page=${this.currentPage}&limit=10`);
            const result = await response.json();

            if (result.success) {
                this.versions = [...this.versions, ...result.versions];
                this.hasMore = result.hasMore;
                this.currentPage++;
                this.renderVersions();
            } else {
                throw new Error(result.message || '加载失败');
            }

        } catch (error) {
            console.error('Failed to load versions:', error);
            this.showError('加载版本失败');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    renderVersions() {
        const container = document.querySelector(this.listContainer);
        if (!container) return;

        container.innerHTML = '';

        if (this.versions.length === 0) {
            this.showEmpty('暂无历史版本');
            return;
        }

        this.versions.forEach((version, index) => {
            const isCurrent = index === 0;
            const html = this.renderVersionItem(version, isCurrent);
            container.insertAdjacentHTML('beforeend', html);
        });

        // 更新统计
        const totalEl = document.getElementById('totalVersions');
        if (totalEl) {
            totalEl.textContent = this.versions.length;
        }

        // 显示/隐藏加载更多
        const loadMoreEl = document.getElementById('loadMoreVersions');
        if (loadMoreEl) {
            loadMoreEl.style.display = this.hasMore ? 'block' : 'none';
        }

        // 隐藏空状态
        const emptyEl = document.getElementById('noVersions');
        if (emptyEl) {
            emptyEl.style.display = 'none';
        }
    }

    renderVersionItem(version, isCurrent) {
        const changeTypeMap = {
            'auto': { text: '自动保存', class: 'bg-secondary' },
            'manual': { text: '手动保存', class: 'bg-success' },
            'restore': { text: '版本恢复', class: 'bg-warning' }
        };

        const changeType = changeTypeMap[version.changeType] || changeTypeMap.auto;

        return `
            <div class="version-item p-3 border-bottom ${isCurrent ? 'version-current' : ''}"
                 data-version-id="${version._id}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="version-number fw-bold">
                            v${version.versionNumber}
                            ${isCurrent ? '<span class="badge bg-primary ms-2">当前</span>' : ''}
                        </span>
                        <div class="version-time text-muted small mt-1">
                            <i class="fa-regular fa-clock me-1"></i>
                            ${this.formatTimeAgo(version.createdAt)}
                        </div>
                    </div>
                    <span class="badge ${changeType.class}">${changeType.text}</span>
                </div>

                <p class="version-summary text-muted small mb-2">
                    ${this.truncate(version.title, 30)} - ${version.wordCount || 0} 字
                </p>

                <div class="version-actions d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm flex-grow-1"
                            onclick="versionHistoryManager.preview('${version._id}')">
                        <i class="fa-solid fa-eye me-1"></i> 预览
                    </button>
                    ${!isCurrent ? `
                        <button class="btn btn-outline-success btn-sm flex-grow-1"
                                onclick="versionHistoryManager.restore('${version._id}', ${version.versionNumber})">
                            <i class="fa-solid fa-rotate-left me-1"></i> 恢复
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async preview(versionId) {
        try {
            const response = await fetch(`/drafts/api/versions/${versionId}`);
            const result = await response.json();

            if (result.success) {
                const version = result.version;

                // 更新预览模态框
                document.getElementById('previewVersionNum').textContent = version.versionNumber;
                document.getElementById('previewTitle').textContent = version.title;

                // 渲染 Markdown
                const previewBody = document.getElementById('previewBody');
                if (previewBody && window.marked) {
                    previewBody.innerHTML = marked.parse(version.content);
                } else if (previewBody) {
                    previewBody.textContent = version.content;
                }

                // 设置恢复按钮
                const restoreBtn = document.getElementById('btnRestoreVersion');
                if (restoreBtn) {
                    restoreBtn.onclick = () => this.restore(versionId, version.versionNumber);
                }

                // 显示模态框
                const modal = new bootstrap.Modal('#versionPreviewModal');
                modal.show();

            } else {
                throw new Error(result.message || '加载失败');
            }

        } catch (error) {
            console.error('Failed to preview version:', error);
            alert('加载版本详情失败');
        }
    }

    async restore(versionId, versionNumber) {
        if (!confirm(`确定要恢复到版本 v${versionNumber} 吗？当前内容将被替换。`)) {
            return;
        }

        try {
            const response = await fetch(`/drafts/api/${this.draftId}/versions/${versionId}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                // 回调通知编辑器更新
                this.onRestore(result.draft);

                // 关闭面板和模态框
                bootstrap.Modal.getInstance('#versionPreviewModal')?.hide();
                this.close();

                // 显示成功提示
                this.showToast(`已恢复到版本 v${versionNumber}`, 'success');

                // 重新加载版本列表
                this.loadVersions(true);

            } else {
                throw new Error(result.message || '恢复失败');
            }

        } catch (error) {
            console.error('Failed to restore version:', error);
            alert('恢复版本失败');
        }
    }

    showLoading() {
        const loadingEl = document.getElementById('versionLoading');
        if (loadingEl) {
            loadingEl.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('versionLoading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    showEmpty(message) {
        const emptyEl = document.getElementById('noVersions');
        if (emptyEl) {
            emptyEl.style.display = 'block';
            const textEl = emptyEl.querySelector('p');
            if (textEl) {
                textEl.textContent = message;
            }
        }
    }

    showError(message) {
        const container = document.querySelector(this.listContainer);
        if (container) {
            container.innerHTML = `
                <div class="text-center p-4 text-danger">
                    <i class="fa-solid fa-triangle-exclamation fa-2x mb-2"></i>
                    <p>${message}</p>
                    <button class="btn btn-outline-primary btn-sm" onclick="versionHistoryManager.loadVersions(true)">
                        重试
                    </button>
                </div>
            `;
        }
    }

    showToast(message, type = 'success') {
        // 简单的 toast 实现
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
            ${message}
        `;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10B981' : '#EF4444'};
            color: white;
            border-radius: 8px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return '刚刚';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
        return `${Math.floor(seconds / 86400)} 天前`;
    }

    truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 导出到全局
window.VersionHistoryManager = VersionHistoryManager;
