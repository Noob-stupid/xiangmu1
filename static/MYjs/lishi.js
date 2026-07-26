// zhuyelishi.js - 历史浏览页面

const lishi = document.getElementById('lishi');
if (lishi) {
    lishi.style.backgroundColor = "rgba(11,123,101,0.5)";
    lishi.style.border = "1.5px solid gray";
}

let currentUserId = null;

// ==================== 获取当前用户 ====================
async function loadCurrentUser() {
    try {
        const response = await fetch('/api/getuserinfor');
        const data = await response.json();
        if (data && data.id) {
            currentUserId = data.id;
            return data;
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }
    return null;
}

// ==================== 创建视频卡片 ====================
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.style.cursor = 'pointer';
    
    const coverUrl = video.cover_path || video.cover || '/static/images/default-cover.jpg';
    const title = video.zuopin_name || video.title || '未知标题';
    const author = video.author_name || video.author || video.username || '未知作者';
    const views = formatViews(video.view_count || video.views || 0);
    
    card.innerHTML = `
        <img class="video-cover" src="${coverUrl}" alt="${escapeHtml(title)}" 
             onerror="this.src='/static/images/default-cover.jpg'">
        <div class="video-info">
            <div class="video-title">${escapeHtml(title)}</div>
            <div class="video-meta">
                <span>${escapeHtml(author)}</span>
                <span>${views}播放</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        const vid = video.video_id || video.id;
        window.location.href = `/video?id=${vid}`;
    });
    
    return card;
}

// ==================== 删除历史记录 ====================
async function deleteHistory(videoId, cardElement) {
    if (!confirm('确定删除这条浏览记录吗？')) return;
    
    try {
        const response = await fetch('/api/history/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId })
        });
        const data = await response.json();
        
        if (data.success) {
            cardElement.remove();
            const container = document.getElementById('video-container');
            if (container && container.children.length === 0) {
                container.innerHTML = '<div class="empty-tip">暂无浏览历史</div>';
            }
        } else {
            alert(data.error || '删除失败');
        }
    } catch (error) {
        console.error('删除历史失败:', error);
        alert('网络错误，请重试');
    }
}

// ==================== 清空所有历史 ====================
async function clearAllHistory() {
    if (!confirm('确定清空所有浏览历史吗？')) return;
    
    try {
        const response = await fetch('/api/history/clear', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            const container = document.getElementById('video-container');
            container.innerHTML = '<div class="empty-tip">暂无浏览历史</div>';
        } else {
            alert(data.error || '清空失败');
        }
    } catch (error) {
        console.error('清空历史失败:', error);
        alert('网络错误，请重试');
    }
}

// ==================== 工具函数 ====================
function formatViews(views) {
    if (!views) return '0';
    if (views >= 10000) {
        return (views / 10000).toFixed(1) + 'w';
    }
    return views.toString();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== 加载浏览历史 ====================
async function loadHistoryVideos() {
    const container = document.getElementById('video-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-tip">加载中...</div>';
    
    if (!currentUserId) {
        container.innerHTML = '<div class="empty-tip">请先登录</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/user/history-videos/${currentUserId}`);
        const data = await response.json();
        
        container.innerHTML = '';
        
        if (data.success && data.lishivideo && data.lishivideo.length > 0) {
            data.lishivideo.forEach(video => {
                const card = createVideoCard(video);
                
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'history-delete-btn';
                deleteBtn.innerHTML = '✕';
                deleteBtn.title = '删除记录';
                deleteBtn.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 24px;
                    height: 24px;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    opacity: 0;
                    transition: opacity 0.2s;
                `;
                
                card.style.position = 'relative';
                card.addEventListener('mouseenter', () => deleteBtn.style.opacity = '1');
                card.addEventListener('mouseleave', () => deleteBtn.style.opacity = '0');
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteHistory(video.video_id || video.id, card);
                });
                
                card.appendChild(deleteBtn);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<div class="empty-tip">暂无浏览历史，快去首页看看吧~</div>';
        }
        
    } catch (error) {
        console.error('加载浏览历史失败:', error);
        container.innerHTML = '<div class="empty-tip">加载失败，请刷新重试</div>';
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadHistoryVideos();
    
    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllHistory);
    }
});