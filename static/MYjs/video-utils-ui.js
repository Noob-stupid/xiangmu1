// ==================== 视频列表渲染 ====================

function renderVideoList() {
    if (!moreContainer) return;
    
    if (!videoList || videoList.length === 0) {
        moreContainer.innerHTML = '<div class="empty-comments">暂无视频作品</div>';
        return;
    }
    
    let cardsHtml = '';
    videoList.forEach(video => {
        const isActive = currentVideo && video.id === currentVideo.id ? 'active' : '';
        // const titleWithoutExt = video.title.replace(/\.(mp4|mov)$/i, '');
        // const coverUrl = `/uploads/${titleWithoutExt}/vitalframe.jpg`;
        let coverUrl = video.poster || '/static/images/default-cover.jpg';
        
        cardsHtml += `
            <div class="side-video-card ${isActive}" data-video-id="${video.id}">
                <div class="side-thumb">
                    <img src="${coverUrl}" alt="${video.title}" width="120" height="68" 
                         style="object-fit: cover;" 
                         onerror="this.onerror=null;this.src='/static/images/default-cover.jpg'">
                </div>
                <div class="side-info">
                    <div class="side-title">${escapeHtml(video.title)}</div>
                    <div class="side-meta"><span>${video.views}播放</span></div>
                </div>
            </div>
        `;
    });
    moreContainer.innerHTML = cardsHtml;
    
    // 绑定点击事件
    document.querySelectorAll('.side-video-card').forEach(card => {
        card.addEventListener('click', () => {
            const vid = parseInt(card.getAttribute('data-video-id'));
            if (vid) switchVideo(vid);
        });
    });
}

// ==================== 作者信息渲染 ====================

function updateAuthorUI(video) {
    if (authorNameEl) {
        authorNameEl.innerText = video.author || '未知作者';
    }
    if (authorAvatarEl && video.author) {
        authorAvatarEl.innerText = video.author.charAt(0).toUpperCase();
    }
}


// ==================== 格式化工具 ====================

function formatViews(views) {
    if (views >= 10000) {
        return (views / 10000).toFixed(1) + 'w';
    }
    return views.toString();
}

function formatTime(isoString) {
    if (!isoString) return "刚刚";
    
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 10) return "刚刚";
    if (diffMin < 1) return `${diffSec}秒前`;
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    str = String(str); 
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== 事件绑定 ====================

function bindEvents() {
    // ----- 留言板事件 -----
    const publishBtn = document.getElementById('publishBtn');
    const contentInput = document.getElementById('commentContent');
    const charCountSpan = document.getElementById('charCount');
    
    // 字数统计
    if (contentInput && charCountSpan) {
        contentInput.addEventListener('input', function() {
            const len = this.value.length;
            charCountSpan.textContent = len;
            if (len > 600) {
                charCountSpan.parentElement.classList.add('warning');
            } else {
                charCountSpan.parentElement.classList.remove('warning');
            }
        });
    }
    // Ctrl+Enter 快捷发布
    if (contentInput) {
        contentInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (publishBtn) publishBtn.click();
            }
        });
    }
    
    // ----- 收藏夹下拉框事件 -----
    const folderSelect = document.getElementById('folderSelect');
    if (folderSelect) {
        folderSelect.addEventListener('change', handleFolderChange);
    }
    
    // ----- 点赞按钮事件 -----
    if (likeBtn) {
        likeBtn.addEventListener('click', () => {
            if (currentVideo) toggleLike(currentVideo.id);
        });
    }
    
    // ----- 收藏按钮事件 -----
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            if (currentVideo) toggleFavorite(currentVideo.id);
        });
    }
}