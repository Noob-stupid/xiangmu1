(function() {
    'use strict';
    
    // ----- 配置 -----
    const container = document.getElementById('background-container');
    const oldBg = document.getElementById('old-background');
    const newBg = document.getElementById('new-background');
    
    // 获取所有下拉菜单
    const flow1 = document.getElementById('flow1');
    const flow2 = document.getElementById('flow2');
    const flow3 = document.getElementById('flow3');
    
    if (!container || !oldBg || !newBg) {
        console.log('背景切换功能未启用');
        return;
    }
    
    // 背景图库
    const bgLibrary = [
        'https://wallpaperm.cmcm.com/94e254e46c408b161f11c1ae12fae8bf.jpg',
        'https://images.pexels.com/photos/207665/pexels-photo-207665.jpeg?auto=compress&cs=tinysrgb&w=1920',
        'https://images.pexels.com/photos/261909/pexels-photo-261909.jpeg?auto=compress&cs=tinysrgb&w=1920',
        'https://images.pexels.com/photos/301920/pexels-photo-301920.jpeg?auto=compress&cs=tinysrgb&w=1920',
        'https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=1920',
        'https://images.pexels.com/photos/1266810/pexels-photo-1266810.jpeg?auto=compress&cs=tinysrgb&w=1920'
    ];
    
    let currentIndex = 0;
    let isAnimating = false;
    
    // ----- 预加载 -----
    function preloadImagesSilently() {
        bgLibrary.forEach((url) => {
            const img = new Image();
            img.src = url;
            img.onerror = () => console.warn('背景图加载失败');
        });
    }
    
    function setBackground(element, index) {
        element.style.backgroundImage = `url(${bgLibrary[index]})`;
    }
    
    function initBackgrounds() {
        setBackground(oldBg, 0);
        setBackground(newBg, 1);
        currentIndex = 0;
    }
    
    // ----- 获取元素中心位置 -----
    function getElementCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    // ----- 水珠效果 -----
    function createWaterDrop(x, y) {
        const drop = document.createElement('div');
        drop.className = 'water-drop';
        drop.style.left = x + 'px';
        drop.style.top = y + 'px';
        container.appendChild(drop);
        setTimeout(() => drop.remove(), 1000);
    }
    
    // ----- 涟漪波纹 -----
    function createRippleWave(x, y) {
        const wave = document.createElement('div');
        wave.className = 'ripple-wave';
        wave.style.left = x + 'px';
        wave.style.top = y + 'px';
        container.appendChild(wave);
        setTimeout(() => wave.remove(), 1600);
    }
    
    // ----- 背景切换 -----
    function switchBackground(targetIndex, clickX, clickY) {
        if (isAnimating) return;
        if (targetIndex === currentIndex) return;
        
        isAnimating = true;
        
        setBackground(newBg, targetIndex);
        
        const rect = container.getBoundingClientRect();
        const centerX = ((clickX - rect.left) / rect.width) * 100;
        const centerY = ((clickY - rect.top) / rect.height) * 100;
        
        newBg.style.transition = 'none';
        newBg.style.clipPath = `circle(0px at ${centerX}% ${centerY}%)`;
        
        void newBg.offsetWidth;
        
        newBg.style.transition = 'clip-path 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        newBg.style.clipPath = `circle(150% at ${centerX}% ${centerY}%)`;
        
        const onTransitionEnd = () => {
            newBg.removeEventListener('transitionend', onTransitionEnd);
            setBackground(oldBg, targetIndex);
            newBg.style.transition = 'none';
            newBg.style.clipPath = 'circle(0px at 50% 50%)';
            currentIndex = targetIndex;
            isAnimating = false;
        };
        
        newBg.addEventListener('transitionend', onTransitionEnd);
    }
    
    // ----- 统一的下拉菜单处理 -----
    function handleSelectChange(event) {
        const selectEl = event.target;
        const value = selectEl.value;
        let bgIndex = -1;
        
        // 根据不同下拉菜单的选项值，映射到背景索引
        // flow1: 视频观看相关
        if (selectEl.id === 'flow1') {
            const valueMap = {
                '1': 0,  // 点赞收藏 -> 背景1
                '2': 1,  // 评论视频 -> 背景2
                '3': 2   // 观看视频 -> 背景3
            };
            bgIndex = valueMap[value];
        }
        // flow2: 个人中心相关
        else if (selectEl.id === 'flow2') {
            const valueMap = {
                '4': 2,  // 登录注册 -> 背景3
                '5': 3   // 观看历史 -> 背景4
            };
            bgIndex = valueMap[value];
        }
        // flow3: 作品投稿相关
        else if (selectEl.id === 'flow3') {
            const valueMap = {
                '6': 4   // 上传作品 -> 背景5
            };
            bgIndex = valueMap[value];
        }
        
        // 如果是有效的背景切换
        if (bgIndex !== undefined && bgIndex >= 0) {
            const center = getElementCenter(selectEl);
            
            // 创建视觉反馈
            createWaterDrop(center.x, center.y);
            createRippleWave(center.x, center.y);
            
            // 切换背景
            switchBackground(bgIndex, center.x, center.y);
            
            // 重置下拉菜单
            setTimeout(() => {
                selectEl.value = 'none';
            }, 100);
        }
    }
    
    // ----- 绑定事件到所有下拉菜单 -----
    if (flow1) flow1.addEventListener('change', handleSelectChange);
    if (flow2) flow2.addEventListener('change', handleSelectChange);
    if (flow3) flow3.addEventListener('change', handleSelectChange);
    
    // 初始化
    preloadImagesSilently();
    initBackgrounds();
    
})();