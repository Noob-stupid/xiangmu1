const CURRENT_USER_ID = 1;

// ---------- 辅助函数 ----------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function goToshoucangPage(shoucangId) {
    window.location.href = `/zhuyeshoucang?id=${shoucangId}`;
}

function goToVideoPage(videoId) {
    window.location.href = `/video?id=${videoId}`;
}

function clearAndKeepButton(container) {
    const buttons = container.querySelectorAll('.buttonchakan, .buttonchakan2, .buttonchakan3');
    const buttonElements = Array.from(buttons);
    container.innerHTML = '';
    buttonElements.forEach(btn => container.appendChild(btn));
}

// 视频卡片生成（占位，根据你的实际样式修改）
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
        <img class="video-cover" src="${video.cover || ''}" alt="${video.title}">
        <div class="video-info">
            <div class="video-title">${escapeHtml(video.title)}</div>
        </div>
    `;
    card.addEventListener('click', () => goToVideoPage(video.id));
    return card;
}

// function createArticleCard(article) {
//     const card = document.createElement('div');
//     card.className = 'article-card';
//     card.style.cursor = 'pointer';
//     card.innerHTML = `
//         <div class="article-title">${escapeHtml(article.title)}</div>
//     `;
//     // 根据需要添加点击事件
//     return card;
// }

// ---------- 数据请求函数（与后端路由匹配） ----------

// 1. 收藏夹列表（后端暂无，先返回模拟数据）
async function fetchFavData() {
     try {
        const response = await fetch(`/api/user/${CURRENT_USER_ID}/favorites`);
        const data = await response.json();
        return data.favorites || [];
    }catch (error) {
        console.error('获取收藏夹失败:', error);
        return [];
    }
}

// 2. 点赞视频（匹配后端 /api/user/liked-videos/<user_id>）
async function fetchLikedVideos(userId) {
    try {
        const response = await fetch(`/api/user/liked-videos/${userId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        // 后端返回 { likevideo: {...} } 或直接是对象，做兼容处理
        if (Array.isArray(data)) return data;
        if (data.likevideo) return Array.isArray(data.likevideo) ? data.likevideo : [data.likevideo];
        if (data.videos) return data.videos;
        // 若后端直接返回单个视频对象，则包裹为数组
        return data.id ? [data] : [];
    } catch (error) {
        console.error('获取点赞视频失败:', error);
        return [];
    }
}

// 3. 浏览历史（匹配后端 /api/user/history-videos/<user_id>）
async function fetchlishiData() {
    try {
        const response = await fetch(`/api/user/history-videos/${CURRENT_USER_ID}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        // 兼容多种返回格式
        if (Array.isArray(data)) return data;
        if (data.lishivideo) return Array.isArray(data.lishivideo) ? data.lishivideo : [data.lishivideo];
        if (data.history) return data.history;
        return data.id ? [data] : [];
    } catch (error) {
        console.error('获取浏览历史失败:', error);
        return [];
    }
}

// ---------- 渲染函数（带防御处理） ----------

async function renderFavorites() {
    const container = document.getElementById('fav-container');
    if (!container) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerText = '加载收藏夹中...';
    container.insertBefore(loadingDiv, container.firstChild);

    try {
        const favData = await fetchFavData();
        loadingDiv.remove();

        if (!favData || favData.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.innerText = '暂无收藏夹';
            container.insertBefore(emptyDiv, container.firstChild);
            return;
        }

        favData.slice().reverse().forEach(item => {
            const card = document.createElement('div');
            card.className = 'fav-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <img class="fav-cover" src="${item.cover || ''}" alt="${item.title}">
                <div class="fav-info">
                    <div class="fav-title">${escapeHtml(item.title)}</div>
                    <div class="fav-meta">
                        <span>${item.count || 0}个视频</span>
                        <span>${item.privacy || '公开'}</span>
                    </div>
                </div>
            `;
            card.addEventListener('click', () => goToshoucangPage(item.id));
            container.insertBefore(card, container.firstChild);
        });
    } catch (error) {
        loadingDiv.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.innerText = '加载失败，请刷新重试';
        container.insertBefore(errorDiv, container.firstChild);
        console.error('加载收藏夹失败:', error);
    }
}

async function renderLikedVideos() {
    const container = document.getElementById('video-container');
    if (!container) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerText = '加载点赞视频中...';
    container.insertBefore(loadingDiv, container.firstChild);

    try {
        const videoList = await fetchLikedVideos(CURRENT_USER_ID);
        loadingDiv.remove();

        // 确保是数组
        const safeList = Array.isArray(videoList) ? videoList : [];
        if (safeList.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.innerText = '暂无点赞视频';
            container.insertBefore(emptyDiv, container.firstChild);
            return;
        }

        const displayList = safeList.slice(0, 5);
        displayList.slice().reverse().forEach(item => {
            const card = (item.type === 'video') ? createVideoCard(item) : createArticleCard(item);
            container.insertBefore(card, container.firstChild);
        });
    } catch (error) {
        loadingDiv.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.innerText = '加载失败，请刷新重试';
        container.insertBefore(errorDiv, container.firstChild);
        console.error('加载点赞视频失败:', error);
    }
}

async function renderHistory() {
    const container = document.getElementById('video-container2');
    if (!container) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerText = '加载浏览历史中...';
    container.insertBefore(loadingDiv, container.firstChild);

    try {
        const lishiData = await fetchlishiData();
        loadingDiv.remove();

        const safeList = Array.isArray(lishiData) ? lishiData : [];
        if (safeList.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty';
            emptyDiv.innerText = '暂无浏览历史';
            container.insertBefore(emptyDiv, container.firstChild);
            return;
        }

        const displayList = safeList.slice(0, 5);
        displayList.slice().reverse().forEach(item => {
            const card = (item.type === 'video') ? createVideoCard(item) : createArticleCard(item);
            container.insertBefore(card, container.firstChild);
        });
    } catch (error) {
        loadingDiv.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.innerText = '加载失败，请刷新重试';
        container.insertBefore(errorDiv, container.firstChild);
        console.error('加载浏览历史失败:', error);
    }
}

renderFavorites();
renderLikedVideos();
renderHistory();