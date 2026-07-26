(function(){
    "use strict";
    const select1 = document.getElementById('flow1');
    const select2 = document.getElementById('flow2');
    const select3 = document.getElementById('flow3');
    const cards = document.querySelectorAll('.card-item');

    const carouselWrapper = document.getElementById('carouselWrapper');
    const lunkuangtu = document.getElementById('lunkuangtu');
    let dotsContainer = document.getElementById('carouselDots');

    let currentIndex = 0;
    let autoInterval = null;
    let totalSlides = 0;

    // 下拉菜单切换卡片
    function switchCard(val) {
        cards.forEach(card => {
            card.style.display = 'none';
            card.classList.remove('show');
        });
        if (val !== 'none') {
            const currentCard = document.getElementById(`card-${val}`);
            if (currentCard) {
                currentCard.style.display = 'block';
                setTimeout(() => {
                    currentCard.classList.add('show');
                }, 100);
            }
        }
    }

    // 轮播图
    async function fetchCarouselImages(type) {
        const API_BASE_URL = '/api/carousel';
        const response = await fetch(`${API_BASE_URL}?type=${type}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.images;
    }

    async function loadCarousel(type) {
    stopAutoPlay();
    try {
        const imgs = await fetchCarouselImages(type);
        totalSlides = imgs.length;
        currentIndex = 0;
        
        // 清空轮播图容器
        lunkuangtu.innerHTML = '';
        
        // 添加图片
        imgs.forEach(src => {
            const div = document.createElement('div');
            div.className = 'items';
            div.style.backgroundImage = `url(${src})`;
            lunkuangtu.appendChild(div);
        });
        
        // 添加 dots 容器
        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'carousel-dots';
        dotsDiv.id = 'carouselDots';
        lunkuangtu.appendChild(dotsDiv);
        
        // 更新全局 dotsContainer
        dotsContainer = document.getElementById('carouselDots');
        
        createDots();
        refreshSlide();
        startAutoPlay();
        
        carouselWrapper.style.display = 'block';
        lunkuangtu.style.zIndex = '100';
    } 
    catch (error) {
        console.error('加载轮播图失败:', error);
        totalSlides = 0;
    }
}

  function refreshSlide() {
    const all = lunkuangtu.querySelectorAll('.items');
    all.forEach(i => i.classList.remove('active'));
    if (all[currentIndex]) all[currentIndex].classList.add('active');
    updateDots();
}
    function nextSlide() {
        if (totalSlides === 0) return;
        currentIndex = (currentIndex + 1) % totalSlides;
        refreshSlide();
    }

    function startAutoPlay() {
        if (autoInterval) clearInterval(autoInterval);
        if (totalSlides > 1) {
            autoInterval = setInterval(nextSlide, 1500);
        }
    }

    function stopAutoPlay() {
        if (autoInterval) clearInterval(autoInterval);
    }

    function createDots() {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalSlides; i++) {
            const d = document.createElement('div');
            d.className = 'dot';
            if (i === 0) d.classList.add('active');
            d.addEventListener('click', () => {
                currentIndex = i;
                refreshSlide();
                stopAutoPlay();
                startAutoPlay();
            });
            dotsContainer.appendChild(d);
        }
    }

    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }

    // 左侧分类菜单
    const menuItems = document.querySelectorAll('.left-menu a[data-type]');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const type = item.dataset.type;
            carouselWrapper.style.display = 'block';
            loadCarousel(type);
        });
    });

    const leftMenu = document.querySelector('.left-menu');
    leftMenu.addEventListener('mouseleave', () => {
        carouselWrapper.style.display = 'none';
        stopAutoPlay();
    });

    // 滚动显示左侧导航
    window.addEventListener('scroll', function() {
        const d1 = document.getElementById('d1');
        const d1Top = d1.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (d1Top <= windowHeight / 2) {
            leftMenu.classList.add('show');
        } else {
            leftMenu.classList.remove('show');
        }
    });

    // 悬停暂停轮播
    lunkuangtu.addEventListener('mouseenter', stopAutoPlay);
    lunkuangtu.addEventListener('mouseleave', startAutoPlay);

    // 下拉菜单绑定事件
    select1.addEventListener('change', () => switchCard(select1.value));
    select2.addEventListener('change', () => switchCard(select2.value));
    select3.addEventListener('change', () => switchCard(select3.value));
})();