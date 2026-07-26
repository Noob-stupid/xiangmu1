// zhuyedianzan.js - 点赞页面

const dianzan = document.getElementById('dianzan');
if (dianzan) {
    dianzan.style.backgroundColor = "pink";
    dianzan.style.border = "1.5px solid gray";
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
        <div class="video-cover-wrapper">
            <img class="video-cover" src="${coverUrl}" alt="${escapeHtml(title)}" 
                 onerror="this.src='/static/images/default-cover.jpg'">
        </div>
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
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== 加载点赞视频 ====================
async function loadLikedVideos() {
    const container = document.getElementById('video-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-tip">加载中...</div>';
    
    if (!currentUserId) {
        container.innerHTML = '<div class="empty-tip">请先登录</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/user/liked-videos/${currentUserId}`);
        const data = await response.json();
        
        container.innerHTML = '';
        
        if (data.success && data.likevideo && data.likevideo.length > 0) {
            data.likevideo.forEach(video => {
                container.appendChild(createVideoCard(video));
            });
        } else {
            container.innerHTML = '<div class="empty-tip">暂无点赞视频，快去首页看看吧~</div>';
        }
        
    } catch (error) {
        console.error('加载点赞视频失败:', error);
        container.innerHTML = '<div class="empty-tip">加载失败，请刷新重试</div>';
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadLikedVideos();
});