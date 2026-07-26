let fullVideoLibrary = [];
let carouselVideos = [];
let topVideos = [];
let loadedCount = 0;
const PAGE_SIZE = 6;

// 根据页面判断当前分类
const path = window.location.pathname;
let currentCategory = 'all';
if (path.includes('shipin1')) currentCategory = 'schoolife';
else if (path.includes('shipin2')) currentCategory = 'youth';
else if (path.includes('shipin3')) currentCategory = 'literature';
else if (path.includes('shipin4')) currentCategory = 'sportsmeet';
else if (path.includes('shipin5')) currentCategory = 'schoolfestival';

const videoGrid = document.getElementById('videoGrid');
const gengduoBtn = document.getElementById('gengduoBtn');
const topTwoVideos = document.getElementById('topTwoVideos');
const lunkuangtu = document.getElementById('lunkuangtu');

let currentIndex = 0;
let autoInterval = null;

// 子标签映射（用于后端过滤）
const subTagsMap = {
    'schoolife': ['教室', '宿舍', '食堂', '图书馆', '社团活动', '日常点滴'],
    'youth': ['青春', '成长', '梦想', '友谊', '恋爱', '奋斗'],
    'literature': ['歌唱', '舞蹈', '话剧', '乐器演奏', '朗诵', '文艺汇演'],
    'sportsmeet': ['跑步', '篮球', '足球', '羽毛球', '健身', '运动会'],
    'schoolfestival': ['校庆', '元旦', '五四', '中秋', '国庆', '毕业季']
};

// ========== 轮播图逻辑 ==========
function initCarousel() {
    const itemsList = document.querySelectorAll('.items');
    const leftBtn = document.querySelector('.left');
    const rightBtn = document.querySelector('.right');
    if (!itemsList.length || !leftBtn || !rightBtn) return;
    const totalSlides = itemsList.length;

    function goToSlide(newIndex) {
        itemsList.forEach(item => item.classList.remove('active'));
        newIndex = (newIndex + totalSlides) % totalSlides;
        currentIndex = newIndex;
        itemsList[currentIndex].classList.add('active');
        updateDots();
    }

    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }

    function startAutoPlay() {
        if (autoInterval) clearInterval(autoInterval);
        autoInterval = setInterval(nextSlide, 3500);
    }

    function stopAutoPlay() {
        if (autoInterval) clearInterval(autoInterval);
    }

    leftBtn.addEventListener('click', () => {
        prevSlide(); stopAutoPlay(); startAutoPlay();
    });
    rightBtn.addEventListener('click', () => {
        nextSlide(); stopAutoPlay(); startAutoPlay();
    });

    const dotsContainer = document.getElementById('carouselDots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    const dots = [];

    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToSlide(i); stopAutoPlay(); startAutoPlay();
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
    }

    function updateDots() {
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    goToSlide(0);
    startAutoPlay();
    lunkuangtu.addEventListener('mouseenter', stopAutoPlay);
    lunkuangtu.addEventListener('mouseleave', startAutoPlay);
}

// ========== 工具函数 ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function formatNumber(num) {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
}

function goPlay(videoId) {
    window.location.href = `/video?id=${videoId}`;
}

// ========== 过滤视频 ==========
function filterVideosByCategory(videos) {
    if (currentCategory === 'all') return videos;
    
    const targetTags = subTagsMap[currentCategory] || [];
    return videos.filter(v => {
        if (!v.tags) return false;
        const videoTags = v.tags.split(',').map(t => t.trim());
        return videoTags.some(t => targetTags.includes(t));
    });
}

// ========== 渲染 ==========
function renderTopTwoVideos() {
    if (!topTwoVideos || topVideos.length < 2) return;
    topTwoVideos.innerHTML = `
        <div class="video-card" onclick="goPlay(${topVideos[0].id})">
            <div class="cover-box">
                <img class="video-cover" src="${topVideos[0].cover_path || '/static/images/default-cover.jpg'}">
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(topVideos[0].zuopin_name)}</div>
                <div class="video-author">${escapeHtml(topVideos[0].author_name || topVideos[0].username)}</div>
                <div class="video-data">${formatNumber(topVideos[0].view_count || 0)} 次观看</div>
            </div>
        </div>
        <div class="video-card" onclick="goPlay(${topVideos[1].id})">
            <div class="cover-box">
                <img class="video-cover" src="${topVideos[1].cover_path || '/static/images/default-cover.jpg'}">
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(topVideos[1].zuopin_name)}</div>
                <div class="video-author">${escapeHtml(topVideos[1].author_name || topVideos[1].username)}</div>
                <div class="video-data">${formatNumber(topVideos[1].view_count || 0)} 次观看</div>
            </div>
        </div>
    `;
}

function renderCarouselImages() {
    if (!lunkuangtu || carouselVideos.length === 0) return;
    let html = '';
    carouselVideos.forEach((v, i) => {
        const activeCls = i === 0 ? 'active' : '';
        html += `<div class="items ${activeCls}" style="background-image:url('${v.cover_path || '/static/images/default-cover.jpg'}')" onclick="goPlay(${v.id})"></div>`;
    });
    html += `<button class="left">❮</button><button class="right">❯</button><div class="carousel-dots" id="carouselDots"></div>`;
    lunkuangtu.innerHTML = html;
    initCarousel();
}

function createCardHtml(v) {
    return `
        <div class="cover-box">
            <img class="video-cover" src="${v.cover_path || '/static/images/default-cover.jpg'}" loading="lazy">
        </div>
        <div class="video-info">
            <div class="video-title">${escapeHtml(v.zuopin_name)}</div>
            <div class="video-author">${escapeHtml(v.author_name || v.username)}</div>
            <div class="video-data">${formatNumber(v.view_count || 0)} 次观看</div>
        </div>
    `;
}

function renderMoreVideos() {
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

function updateBtn() {
    if (loadedCount >= fullVideoLibrary.length) {
        gengduoBtn.innerText = "已经到底啦";
        gengduoBtn.disabled = true;
    } else {
        gengduoBtn.innerText = `加载更多 (还有${fullVideoLibrary.length - loadedCount}个)`;
        gengduoBtn.disabled = false;
    }
}

function resetAndRender() {
    videoGrid.innerHTML = '';
    loadedCount = 0;
    renderTopTwoVideos();
    renderCarouselImages();
    renderMoreVideos();
}

// ========== 加载数据 ==========
async function loadVideoDataFromAPI() {
    try {
        gengduoBtn.innerText = "加载中...";
        const res = await fetch('/api/videos');
        const data = await res.json();
        const allVideos = data.video || [];

        if (allVideos.length === 0) {
            videoGrid.innerHTML = "<p style='text-align:center;padding:40px;color:#fff;'>暂无视频</p>";
            gengduoBtn.innerText = "暂无视频";
            return;
        }

        // 按分类过滤
        const filteredVideos = filterVideosByCategory(allVideos);
        
        if (filteredVideos.length === 0) {
            videoGrid.innerHTML = "<p style='text-align:center;padding:40px;color:#fff;'>该分类暂无视频</p>";
            gengduoBtn.innerText = "暂无视频";
            return;
        }

        const sorted = [...filteredVideos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        topVideos = sorted.slice(0, 2);
        carouselVideos = sorted.slice(0, 5);
        fullVideoLibrary = sorted.slice(2);
        resetAndRender();
    } catch (e) {
        videoGrid.innerHTML = "<p style='color:red;text-align:center'>加载失败</p>";
        gengduoBtn.innerText = "加载失败，点击重试";
    }
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
    loadVideoDataFromAPI();
    gengduoBtn.addEventListener('click', () => {
        if (gengduoBtn.innerText.includes('失败')) loadVideoDataFromAPI();
        else renderMoreVideos();
    });
});