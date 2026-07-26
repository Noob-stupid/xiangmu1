let fullVideoLibrary = [];
let carouselVideos = [];
let topVideos = [];
let loadedCount = 0;
const PAGE_SIZE = 6;

const videoGrid = document.getElementById('videoGrid');
const gengduoBtn = document.getElementById('gengduoBtn');
const topTwoVideos = document.getElementById('leftTwoVideos');
const lunkuangtu = document.getElementById('lunkuangtu');
const dingbu = document.getElementById('dingbu');

let currentIndex = 0;
let autoInterval = null;


function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
dingbu.addEventListener('click',(e) => {
    e.preventDefault();
    scrollToTop();
});
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

 
    itemsList.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToSlide(i); stopAutoPlay(); startAutoPlay();
        });
        dotsContainer.appendChild(dot);
        dots.push(dot);
    });

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


function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
}

function renderTopTwoVideos() {
    if (!topTwoVideos) return;

    // 如果没有视频数据（topVideos为空或长度不足2），显示占位表格
    if (!topVideos || topVideos.length < 2) {
        topTwoVideos.innerHTML = `
            <div class="placeholder-table-card">
                <div class="placeholder-text">当前暂无视频</div>
            </div>
            <div class="placeholder-table-card">
                <div class="placeholder-text">当前暂无视频</div>
            </div>
        `;
        return;
    }

    topTwoVideos.innerHTML = `
        <div class="video-card" onclick="goPlay(${topVideos[0].id})">
            <div class="cover-box">
                <img class="video-cover" src="${topVideos[0].cover_path}">
                <div class="video-time">${formatTime(topVideos[0].duration)}</div>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(topVideos[0].zuopin_name)}</div>
                <div class="video-author">${escapeHtml(topVideos[0].author_name)}</div>
                <div class="video-data">${formatNumber(topVideos[0].view_count || 0)} 次观看</div>
            </div>
        </div>
        <div class="video-card" onclick="goPlay(${topVideos[1].id})">
            <div class="cover-box">
                <img class="video-cover" src="${topVideos[1].cover_path}">
                <div class="video-time">${formatTime(topVideos[1].duration)}</div>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(topVideos[1].zuopin_name)}</div>
                <div class="video-author">${escapeHtml(topVideos[1].author_name)}</div>
                <div class="video-data">${formatNumber(topVideos[1].view_count || 0)} 次观看</div>
            </div>
        </div>
    `;
}

function renderCarouselImages() {
    if (!lunkuangtu) return;
    
    // 没有轮播数据时显示占位
    if (!carouselVideos || carouselVideos.length === 0) {
        lunkuangtu.innerHTML = `
            <div class="carousel-placeholder">
                <span>暂无精选作品</span>
            </div>
        `;
        return;
    }
    let html = '';
    carouselVideos.forEach((v, i) => {
        const activeCls = i === 0 ? 'active' : '';
        html += `
            <div class="items ${activeCls}" style="background-image:url('${v.cover_path}')" onclick="goPlay(${v.id})"></div>
        `;
    });
    html += `<button class="left">❮</button><button class="right">❯</button><div class="carousel-dots" id="carouselDots"></div>`;
    lunkuangtu.innerHTML = html;
    initCarousel();
}

function createCardHtml(v) {
    return `
        <div class="cover-box">
            <img class="video-cover" src="${v.cover_path}" loading="lazy">
            <div class="video-time">${formatTime(v.duration)}</div>
        </div>
        <div class="video-info">
            <div class="video-title">${escapeHtml(v.zuopin_name)}</div>
            <div class="video-author">${escapeHtml(v.author_name)}</div>
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
    if (!fullVideoLibrary || fullVideoLibrary.length === 0) {
        gengduoBtn.innerText = "暂无视频";
        gengduoBtn.disabled = true;
        return;
    }
    
    if (loadedCount >= fullVideoLibrary.length) {
        gengduoBtn.innerText = "已经到底啦";
        gengduoBtn.disabled = true;
    } else {
        gengduoBtn.innerText = `加载更多 (还有${fullVideoLibrary.length - loadedCount}个)`;
        gengduoBtn.disabled = false;
    }
}

function goPlay(videoId) {
   window.location.href = `/video?id=${videoId}`;
}

function resetAndRender() {
    videoGrid.innerHTML = '';
    loadedCount = 0;
    renderTopTwoVideos();
    renderCarouselImages();
    renderMoreVideos();
}

async function loadVideoDataFromAPI() {
    try {
        gengduoBtn.innerText = "加载中...";
        const res = await fetch('/api/videos');
        const data = await res.json();
        const allVideos = data.video || [];

      if (allVideos.length === 0) {
    topVideos = [];
    carouselVideos = [];
    fullVideoLibrary = [];
    videoGrid.innerHTML = '';
    loadedCount = 0;
    renderTopTwoVideos();  // 显示两个文字表格
    renderCarouselImages(); // 轮播显示占位
    renderMoreVideos();     // 视频网格显示空状态
    gengduoBtn.innerText = "暂无视频";
    gengduoBtn.disabled = true;
    return;
}

        const sorted = [...allVideos].sort((a,b)=>(b.view_count||0)-(a.view_count||0));
        topVideos = sorted.slice(0,2);
        carouselVideos = sorted.slice(0,5);
        fullVideoLibrary = sorted.slice(2);
        resetAndRender();
    } catch (e) {
        // 加载失败时也显示占位状态
        topVideos = [];
        carouselVideos = [];
        fullVideoLibrary = [];
        resetAndRender();
        gengduoBtn.innerText = "加载失败，点击重试";
        gengduoBtn.disabled = false;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadVideoDataFromAPI();
    gengduoBtn.addEventListener('click', () => {
        if (gengduoBtn.innerText.includes('失败')) {
            loadVideoDataFromAPI();
        } else if (!gengduoBtn.disabled) {
            renderMoreVideos();
        }
    });
});