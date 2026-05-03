/**
 * 文章分享功能
 */

// 分享到微博
function shareToWeibo(title, url) {
    const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// 分享到 QQ 空间
function shareToQQ(title, url, desc) {
    const shareUrl = `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// 分享到 Twitter
function shareToTwitter(title, url) {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// 分享到 Facebook
function shareToFacebook(url) {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// 复制链接
function copyLink(url) {
    if (navigator.clipboard && window.isSecureContext) {
        // 现代浏览器
        navigator.clipboard.writeText(url).then(() => {
            showTooltip('链接已复制到剪贴板！');
        }).catch(err => {
            fallbackCopyLink(url);
        });
    } else {
        // 降级方案
        fallbackCopyLink(url);
    }
}

// 降级复制方案
function fallbackCopyLink(url) {
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showTooltip('链接已复制到剪贴板！');
    } catch (err) {
        showTooltip('复制失败，请手动复制链接');
    }

    document.body.removeChild(textArea);
}

// 显示提示
function showTooltip(message) {
    const tooltip = document.getElementById('shareTooltip');
    if (tooltip) {
        tooltip.textContent = message;
        tooltip.classList.add('show');
        setTimeout(() => {
            tooltip.classList.remove('show');
        }, 2000);
    }
}

// 生成微信二维码
function showWechatQRCode(url) {
    const modal = document.getElementById('wechatQRModal');
    const canvas = document.getElementById('wechatQRCanvas');

    if (modal && canvas && typeof QRCode !== 'undefined') {
        // 清除旧的二维码
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 生成新的二维码
        QRCode.toCanvas(canvas, url, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, function (error) {
            if (error) {
                console.error('二维码生成失败:', error);
                showTooltip('二维码生成失败');
            } else {
                modal.classList.add('show');
            }
        });
    } else {
        showTooltip('微信分享功能暂不可用');
    }
}

// 关闭微信二维码弹窗
function closeWechatQRModal() {
    const modal = document.getElementById('wechatQRModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 点击遮罩关闭弹窗
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('wechatQRModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeWechatQRModal();
            }
        });
    }
});
