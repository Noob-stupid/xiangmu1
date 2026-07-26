let fullVideoLibrary = []; 
let loadedCount = 0;
const PAGE_SIZE = 6;
const videoGrid = document.getElementById('videoGrid');
const gengduoBtn = document.getElementById('gengduoBtn');

// HTML转义（防XSS）
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// 格式化数字
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return String(num);
}

// 跳转到视频播放页
function goPlay(videoId) {
    window.location.href = `/video?id=${videoId}`;
}

// 创建视频卡片HTML
function createCardHtml(v) {
    const coverPath = v.cover_path || '/static/images/default-cover.jpg';
    const title = v.zuopin_name || '未知标题';
    const author = v.author_name || v.username || '未知作者';
    const views = v.view_count || 0;
    
    return `
    <div class="cover-box">
        <img class="video-cover" src="${coverPath}" alt="${escapeHtml(title)}" loading="lazy">
    </div>
    <div class="video-info">
        <div class="video-title">${escapeHtml(title)}</div>
        <div class="video-author">${escapeHtml(author)}</div>
        <div class="video-data">${formatNumber(views)} 次观看</div>
    </div>`;
}

// 渲染视频卡片
function renderMoreVideos() {
    if (fullVideoLibrary.length === 0) {
        videoGrid.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;">暂无视频</p>';
        gengduoBtn.innerText = "暂无视频";
        gengduoBtn.disabled = true;
        return;
    }
    
    const end = Math.min(loadedCount + PAGE_SIZE, fullVideoLibrary.length);
    for (let i = loadedCount; i < end; i++) {
        const v = fullVideoLibrary[i];
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = createCardHtml(v);
        card.onclick = () => goPlay(v.id);
        videoGrid.appendChild(card);
    }

    loadedCount = end;
    updateBtn();
}

// 更新加载更多按钮状态
function updateBtn() {
    if (loadedCount >= fullVideoLibrary.length) {
        gengduoBtn.innerText = "已经到底啦";
        gengduoBtn.disabled = true;
    } else {
        gengduoBtn.innerText = `加载更多 (${fullVideoLibrary.length - loadedCount}个)`;
        gengduoBtn.disabled = false;
    }
}

// 重置并重新渲染
function resetAndRender(videos) {
    videoGrid.innerHTML = '';
    loadedCount = 0;
    fullVideoLibrary = videos;
    renderMoreVideos();
}

// 从后端API加载视频列表
async function loadVideoListFromAPI() {
    try {
        gengduoBtn.innerText = "加载中...";
        const res = await fetch('/api/videos');
        if (!res.ok) throw new Error('网络请求失败');
        const data = await res.json();
        
        if (data.video && Array.isArray(data.video)) {
            // 按浏览量排序
            const sorted = [...data.video].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
            resetAndRender(sorted);
        } else {
            fullVideoLibrary = [];
            videoGrid.innerHTML = '<p style="text-align:center;padding:40px;color:#fff;">暂无视频</p>';
            updateBtn();
        }
    } catch (err) {
        console.error('加载视频失败:', err);
        videoGrid.innerHTML = '<p style="color:red;text-align:center;padding:40px;">加载失败，请重试</p>';
        gengduoBtn.innerText = "加载失败，点击重试";
        gengduoBtn.disabled = false;
    }
}

// 初始化
loadVideoListFromAPI();
gengduoBtn.addEventListener('click', () => {
    if (gengduoBtn.innerText.includes('失败')) {
        loadVideoListFromAPI();
    } else {
        renderMoreVideos();
    }
});