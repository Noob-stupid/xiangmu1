
let videoList = [];              // 从后端获取的视频列表
let currentVideo = null;         // 当前播放的视频
let currentUserId = null;        // 当前登录用户ID
let currentLikeStatus = false;   // 当前视频是否已点赞

// ==================== 收藏夹状态变量 ====================
let favoriteFolders = ['默认收藏夹'];
let currentFolder = '默认收藏夹';

// ==================== DOM 元素 ====================
// 视频播放器
const mainVideo = document.getElementById('mainVideo');
const videoSource = document.getElementById('videoSource');

// 作者信息
const authorNameEl = document.getElementById('authorName');
const authorAvatarEl = document.getElementById('authorAvatar');

// 右侧列表
const moreContainer = document.getElementById('moreVideoList');

// 交互按钮
const likeBtn = document.getElementById('likeBtn');
const likeCountSpan = document.getElementById('likeCount');
const favBtn = document.getElementById('favBtn');

// 获取视频列表
async function loadVideoList() {
    try {
        const response = await fetch('/api/videos');
        const data = await response.json();
        
        if (data.video && data.video.length > 0) {
            videoList = data.video.map(v => ({
                id: v.id,
                title: v.zuopin_name,
                author: v.author_name || '未知作者',
                views: formatViews(v.view_count || 0),
                user_id: v.user_id,
                videoUrl: v.zuopin_url,
                poster: v.cover_path || ''
            }));
        }
        
        // if (videoList.length > 0) {
        //     await switchVideo(videoList[0].id);
        // } else {
        //     moreContainer.innerHTML = '<div class="empty-comments">暂无视频作品</div>';
        // }
        if (videoList.length === 0) {
            moreContainer.innerHTML = '<div class="empty-comments">暂无视频作品</div>';
        }
    } catch (error) {
        console.error('加载视频列表失败:', error);
        moreContainer.innerHTML = '<div class="empty-comments">加载失败，请刷新重试</div>';
    }
}
// 获取单个视频详情
async function loadVideoDetail(videoId) {
    try {
        const response = await fetch(`/api/video/${videoId}`);
        const data = await response.json();
        if (data.zuopin) {
            return data.zuopin;
        }
        return null;
    } catch (error) {
        console.error('加载视频详情失败:', error);
        return null;
    }
}
// ==================== 点赞相关 API ====================
// 检查当前用户是否已点赞
async function checkLikeStatus(videoId) {
    if (!videoId) return false;
    
    try {
        const response = await fetch(`/api/dianzan/status/${videoId}`);
        const data = await response.json();
        return data.success && data.liked;
    } catch (error) {
        console.error('检查点赞状态失败:', error);
        return false;
    }
}

// 更新点赞按钮 UI
async function updateLikeButton(videoId) {
    if (!likeBtn) return;
    
    const isLiked = await checkLikeStatus(videoId);
    currentLikeStatus = isLiked;
    
    if (isLiked) {
        likeBtn.innerHTML = '❤️ 已点赞';
        likeBtn.style.color = 'rgb(241, 63, 95)';
    } else {
        likeBtn.innerHTML = '👍 点赞';
        likeBtn.style.color = '';
    }
}
// 获取点赞数
async function loadLikeCount(videoId) {
    try {
        const response = await fetch(`/api/dianzan/count/${videoId}`);
        const data = await response.json();
        if (data.success) {
            likeCountSpan.textContent = data.count;
        }
    } catch (error) {
        console.error('获取点赞数失败:', error);
    }
}

// 点赞/取消点赞
async function toggleLike(videoId) {
    try {
        const response = await fetch(`/api/dianzan/${videoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            // 直接调用 updateLikeButton 刷新状态
            await updateLikeButton(videoId);
            // 刷新点赞数
            await loadLikeCount(videoId);
        } else {
            alert(data.error || '操作失败');
            }
        }catch (error) {
        console.error('点赞操作失败:', error);
        alert('网络错误，请稍后重试');
    }
}

// ==================== 收藏相关 API ====================

// 收藏/取消收藏
async function toggleFavorite(videoId) {
    if (!favBtn) return;
    
    try {
        const response = await fetch(`/api/shoucang/${videoId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sc_name: currentFolder })
        });
        const data = await response.json();
        
        if (data.success) {
            await updateFavButton();
            alert(data.message);
        } else {
            alert(data.error || '操作失败');
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        alert('网络错误，请稍后重试');
    }
}
