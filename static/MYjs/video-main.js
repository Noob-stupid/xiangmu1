// video-main.js - 完整版

// ==================== URL 参数解析 ====================
function getVideoIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// ==================== 切换视频 ====================
async function switchVideo(videoId) {
    window.isSubmittingComment = false;
    const targetVideo = videoList.find(v => v.id === videoId);
    if (!targetVideo) return;
    
    currentVideo = targetVideo;
    // 记录浏览历史
    if (currentUserId) {
        fetch('/api/history/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId })
        }).catch(err => console.error('记录历史失败:', err));
    }
    // 更新视频播放器
    videoSource.src = targetVideo.videoUrl;
    mainVideo.poster = targetVideo.poster || '/static/images/default-cover.jpg';
    mainVideo.load();
    mainVideo.play().catch(e => console.log("自动播放受限"));
    
    // 更新作者信息
    updateAuthorUI(targetVideo);
    // 绑定播放量记录
    bindVideoViewCount(videoId);
    // 加载点赞数
    await loadLikeCount(videoId);
    await updateLikeButton(videoId);
    
    // 更新收藏按钮状态
    await updateFavButton();
    // 加载留言板
    await initComments(videoId);
    
    // 更新右侧列表高亮
    renderVideoList();
}

// ==================== 更新作者UI ====================
function updateAuthorUI(video) {
    const authorNameEl = document.getElementById('authorName');
    const authorAvatarEl = document.getElementById('authorAvatar');
    
    // 字段名是 author，不是 author_name
    const authorName = video.author || video.author_name || video.username || '未知作者';
    
    if (authorNameEl) {
        authorNameEl.textContent = authorName;
    }
    if (authorAvatarEl) {
        authorAvatarEl.textContent = authorName.charAt(0).toUpperCase();
    }
    
    // 作者ID - 用 user_id 或 id
    const authorId = video.user_id;
    const followBtn = document.getElementById('followAuthorBtn');
    
    if (followBtn && authorId) {
        followBtn.dataset.authorId = authorId;
        
        if (currentUserId && currentUserId == authorId) {
            followBtn.style.display = 'none';
        } else {
            followBtn.style.display = 'block';
            checkFollowStatus(authorId);
        }
    }
}

// ==================== 检查关注状态 ====================
async function checkFollowStatus(authorId) {
    if (!authorId) {
        console.warn('authorId 为空，跳过检查关注状态');
        return;
    }
    try {
        const response = await fetch(`/api/follow/status/${authorId}`);
        const data = await response.json();
        
        const followBtn = document.getElementById('followAuthorBtn');
        if (followBtn) {
            if (data.following) {
                followBtn.textContent = '✓ 已关注';
                followBtn.style.background = '#f5f5f5';
                followBtn.style.color = '#666';
            } else {
                followBtn.textContent = '+ 关注';
                followBtn.style.background = '#00a1d6';
                followBtn.style.color = 'white';
            }
        }
    } catch (error) {
        console.error('检查关注状态失败:', error);
    }
}

// ==================== 绑定关注按钮事件 ====================
function bindFollowButton() {
    const followBtn = document.getElementById('followAuthorBtn');
    if (!followBtn) return;
    
    followBtn.addEventListener('click', async () => {
        const authorId = followBtn.dataset.authorId;
        if (!authorId) return;
        
        try {
            const response = await fetch(`/api/follow/${authorId}`, {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                if (data.action === 'followed') {
                    followBtn.textContent = '✓ 已关注';
                    followBtn.style.background = '#f5f5f5';
                    followBtn.style.color = '#666';
                } else {
                    followBtn.textContent = '+ 关注';
                    followBtn.style.background = '#00a1d6';
                    followBtn.style.color = 'white';
                }
            } else {
                alert(data.error || '操作失败');
            }
        } catch (error) {
            console.error('关注操作失败:', error);
        }
    });
}

// ============= 浏览量功能 =============

let currentVideoId = null;
let videoViewRecorded = false;
let viewRecordTimer = null;

// 获取页面元素
const progressfill = document.getElementById('progressfill');
const videoelement = document.getElementById('mainVideo') || document.getElementById('videoelement');

// 重置进度条
if (progressfill) {
    progressfill.style.width = '0%';
}

// ============= 视频播放量记录 =============
function bindVideoViewCount(videoId) {
    // 重置状态
    videoViewRecorded = false;
    currentVideoId = videoId;
    
    if (viewRecordTimer) {
        clearTimeout(viewRecordTimer);
    }
    
    if (!videoelement) return;
    
    // 方法1：播放超过3秒记录
    const timeUpdateHandler = function() {
        if (!videoViewRecorded && videoelement.currentTime >= 3) {
            recordVideoView(videoId);
            videoelement.removeEventListener('timeupdate', timeUpdateHandler);
            videoelement.removeEventListener('timeupdate', progressHandler);
        }
    };
    
    // 方法2：播放超过50%记录
    const progressHandler = function() {
        if (!videoViewRecorded && videoelement.duration > 0) {
            const percent = (videoelement.currentTime / videoelement.duration) * 100;
            if (progressfill) {
                progressfill.style.width = percent + '%';
            }
            if (percent >= 50) {
                recordVideoView(videoId);
                videoelement.removeEventListener('timeupdate', timeUpdateHandler);
                videoelement.removeEventListener('timeupdate', progressHandler);
            }
        }
    };
    
    // 绑定事件
    videoelement.addEventListener('timeupdate', timeUpdateHandler);
    videoelement.addEventListener('timeupdate', progressHandler);
    
    // 5分钟后强制记录（防止一直看但不满足条件）
    viewRecordTimer = setTimeout(() => {
        if (!videoViewRecorded) {
            recordVideoView(videoId);
        }
        videoelement.removeEventListener('timeupdate', timeUpdateHandler);
        videoelement.removeEventListener('timeupdate', progressHandler);
    }, 300000);
}

// 记录视频播放量
async function recordVideoView(videoId) {
    if (videoViewRecorded) return;
    videoViewRecorded = true;
    
    try {
        const response = await fetch(`/api/video/${videoId}/view`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ 播放量已更新:', data.views);
            // 更新当前视频的播放量显示
            if (currentVideo) {
                currentVideo.view_count = data.views;
                currentVideo.views = formatViews(data.views);
            }
            // 刷新右侧列表
            if (typeof renderVideoList === 'function') {
                renderVideoList();
            }
        }
    } catch (error) {
        console.error('记录播放量失败:', error);
    }
}

// // ============= 文章阅读量记录 =============
// function recordArticleView(articleId) {
//     fetch('/api/article/view', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ id: articleId })
//     }).catch(err => console.error('记录阅读量失败:', err));
// }

// ============= 格式化播放量 =============
function formatViews(views) {
    if (!views) return '0';
    if (views >= 10000) {
        return (views / 10000).toFixed(1) + 'w';
    }
    return views.toString();
}
// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM 加载完成');
});

async function init() {
    const urlVideoId = getVideoIdFromUrl();
    await loadCurrentUser();
    await loadVideoList();
    await loadFavoriteFolders();
    
    let targetVideoId = null;
    
    if (urlVideoId && videoList.length > 0) {
        const targetVideo = videoList.find(v => v.id == urlVideoId);
        if (targetVideo) {
            targetVideoId = targetVideo.id;
            console.log('✅ 播放URL指定的视频:', targetVideoId, targetVideo.title);
        }
    }
    
    if (!targetVideoId && videoList.length > 0) {
        targetVideoId = videoList[0].id;
        console.log('📌 播放第一个视频:', targetVideoId);
    }
    
    if (targetVideoId) {
        await switchVideo(targetVideoId);
    }
    bindEvents();
    bindFollowButton();
}

// 启动
init();