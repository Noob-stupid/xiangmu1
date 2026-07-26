// dongtai.js - 完整版

const dongtai = document.getElementById('dongtai');
if (dongtai) {
    dongtai.style.backgroundColor = "rgba(82, 224, 16, 0.5)";
    dongtai.style.border = "1.5px solid gray";
}

// ========== 发布动态功能 ==========
let selectedImageFile = null;

function initPublishDynamic() {
    const textarea = document.getElementById('dynamicContent');
    const charCount = document.getElementById('dynamicCharCount');
    const imageInput = document.getElementById('dynamicImage');
    const imageName = document.getElementById('imageName');
    const previewDiv = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeBtn = document.getElementById('removeImage');
    const publishBtn = document.getElementById('publishDynamicBtn');
    
    if (textarea) {
        textarea.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                selectedImageFile = file;
                imageName.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    previewDiv.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            selectedImageFile = null;
            imageInput.value = '';
            imageName.textContent = '';
            previewDiv.style.display = 'none';
            previewImg.src = '';
        });
    }
    
    if (publishBtn) {
        publishBtn.addEventListener('click', async function() {
            const content = textarea.value.trim();
            
            if (!content && !selectedImageFile) {
                alert('请输入内容或选择图片');
                return;
            }
            
            if (content.length > 500) {
                alert('内容最多500字');
                return;
            }
            
            publishBtn.textContent = '发布中...';
            publishBtn.disabled = true;
            
            try {
                const formData = new FormData();
                formData.append('content', content);
                if (selectedImageFile) {
                    formData.append('image', selectedImageFile);
                }
                
                const response = await fetch('/api/dynamics', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    textarea.value = '';
                    charCount.textContent = '0';
                    selectedImageFile = null;
                    imageInput.value = '';
                    imageName.textContent = '';
                    previewDiv.style.display = 'none';
                    
                    await loadDynamics();
                    alert('发布成功！');
                } else {
                    alert(data.error || '发布失败');
                }
            } catch (error) {
                console.error('发布动态失败:', error);
                alert('网络错误，请稍后重试');
            } finally {
                publishBtn.textContent = '发布';
                publishBtn.disabled = false;
            }
        });
    }
}

// ========== 创建通知图标 ==========
function createNotificationIcon() {
    const topLabel = document.querySelector('.toplabel');
    if (!topLabel) return;
    if (document.getElementById('notificationIcon')) return;
    
    const li = document.createElement('li');
    li.style.listStyle = 'none';
    li.innerHTML = `
        <div class="notification-icon" id="notificationIcon">
            <span class="bell">🔔</span>
            <span class="unread-badge" id="unreadBadge" style="display: none;">0</span>
        </div>
    `;
    topLabel.appendChild(li);
}

// ========== 通知功能 ==========
let unreadCount = 0;

async function initNotifications() {
    createNotificationIcon();
    await loadUnreadCount();
    bindNotificationEvents();
    setInterval(loadUnreadCount, 30000);
}

async function loadUnreadCount() {
    try {
        const response = await fetch('/api/notifications/unread/count');
        const data = await response.json();
        if (data.success) {
            unreadCount = data.count;
            updateBadge();
        }
    } catch (error) {
        console.error('加载未读数量失败:', error);
    }
}

function updateBadge() {
    const badge = document.getElementById('unreadBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function loadNotifications() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    container.innerHTML = '<div class="empty-notifications">加载中...</div>';
    
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        if (data.success && data.notifications && data.notifications.length > 0) {
            renderNotifications(data.notifications);
        } else {
            container.innerHTML = '<div class="empty-notifications">暂无通知</div>';
        }
    } catch (error) {
        console.error('加载通知失败:', error);
        container.innerHTML = '<div class="empty-notifications">加载失败</div>';
    }
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationList');
    let html = '';
    
    notifications.forEach(n => {
        const unreadClass = n.is_read === 0 ? 'unread' : '';
        const avatar = n.sender_avatar || '';
        const avatarHtml = avatar 
            ? `<img class="notification-avatar" src="${escapeHtml(avatar)}" alt="">` 
            : `<div class="notification-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;display:flex;align-items:center;justify-content:center;">${escapeHtml(n.sender_name ? n.sender_name[0] : '?')}</div>`;
        
        let title = '';
        let desc = '';
        let link = '';
        
        if (n.type === 'comment') {
            title = `<span class="name">${escapeHtml(n.sender_name || '用户')}</span> 评论了你的视频`;
            desc = n.comment_content || '';
            link = `/video?id=${n.video_id}`;
        } else if (n.type === 'reply') {
            title = `<span class="name">${escapeHtml(n.sender_name || '用户')}</span> 回复了你的评论`;
            desc = n.reply_content || '';
            link = `/video?id=${n.video_id}`;
        }
        
        html += `
            <div class="notification-item ${unreadClass}" data-id="${n.id}" data-link="${link}">
                ${avatarHtml}
                <div class="notification-content">
                    <div class="notification-title">${title}</div>
                    <div class="notification-desc">${escapeHtml(desc)}</div>
                    <div class="notification-time">${formatTime(n.created_at)}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    container.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.dataset.id;
            const link = item.dataset.link;
            await markAsRead(id);
            if (link) window.location.href = link;
        });
    });
}

async function markAsRead(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
        await loadUnreadCount();
    } catch (error) {
        console.error('标记已读失败:', error);
    }
}

async function markAllRead() {
    try {
        await fetch('/api/notifications/read/all', { method: 'POST' });
        await loadNotifications();
        await loadUnreadCount();
    } catch (error) {
        console.error('全部已读失败:', error);
    }
}

function bindNotificationEvents() {
    const icon = document.getElementById('notificationIcon');
    const panel = document.getElementById('notificationPanel');
    const markAllBtn = document.getElementById('markAllRead');
    
    if (icon) {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) loadNotifications();
        });
    }
    
    if (markAllBtn) {
        markAllBtn.addEventListener('click', markAllRead);
    }
    
    document.addEventListener('click', (e) => {
        if (panel && !panel.contains(e.target) && icon && !icon.contains(e.target)) {
            panel.style.display = 'none';
        }
    });
}

// ========== 动态列表功能 ==========
async function loadDynamics() {
    const container = document.getElementById('dynamicList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-text" style="text-align:center;padding:40px;color:#999;">加载动态中...</div>';
    
    try {
        const [notiRes, dynRes] = await Promise.all([
            fetch('/api/notifications'),
            fetch('/api/dynamics')
        ]);
        
        const notiData = await notiRes.json();
        const dynData = await dynRes.json();
        
        let allItems = [];
        
        if (notiData.success && notiData.notifications) {
            notiData.notifications.forEach(n => {
                allItems.push({
                    type: 'notification',
                    subType: n.type,
                    data: n,
                    time: n.created_at
                });
            });
        }
        
        if (dynData.success && dynData.dynamics) {
            dynData.dynamics.forEach(d => {
                allItems.push({
                    type: 'dynamic',
                    data: d,
                    time: d.created_at
                });
            });
        }
        
        allItems.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        if (allItems.length > 0) {
            renderAllItems(allItems);
        } else {
            container.innerHTML = '<div class="empty-text" style="text-align:center;padding:40px;color:#999;">暂无动态，快来发布第一条吧~</div>';
        }
    } catch (error) {
        console.error('加载动态失败:', error);
        container.innerHTML = '<div class="empty-text" style="text-align:center;padding:40px;color:#999;">加载失败，请刷新重试</div>';
    }
}

function renderAllItems(items) {
    const container = document.getElementById('dynamicList');
    let html = '';
    
    items.forEach(item => {
        if (item.type === 'notification') {
            html += renderNotificationItem(item.data, item.subType);
        } else if (item.type === 'dynamic') {
            html += renderDynamicItem(item.data);
        }
    });
    
    container.innerHTML = html;
}

function renderNotificationItem(n, subType) {
    const avatar = n.sender_avatar || '';
    const avatarHtml = avatar 
        ? `<img class="dynamic-avatar" src="${escapeHtml(avatar)}" alt="">` 
        : `<div class="dynamic-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">${escapeHtml(n.sender_name ? n.sender_name[0] : '?')}</div>`;
    
    let text = '';
    if (subType === 'comment') {
        text = `<span class="name">${escapeHtml(n.sender_name || '用户')}</span> 评论了你的视频 <span class="video-title">《${escapeHtml(n.video_title || '视频')}》</span>：${escapeHtml(n.comment_content || '')}`;
    } else {
        text = `<span class="name">${escapeHtml(n.sender_name || '用户')}</span> 回复了你的评论：${escapeHtml(n.reply_content || '')}`;
    }
    
    const unreadClass = n.is_read === 0 ? 'unread' : '';
    
    return `
        <div class="dynamic-item ${unreadClass}" onclick="location.href='/video?id=${n.video_id}'">
            ${avatarHtml}
            <div class="dynamic-content">
                <div class="dynamic-text">${text}</div>
                <div class="dynamic-time">${formatTime(n.created_at)}</div>
            </div>
        </div>
    `;
}

function renderDynamicItem(d) {
    const avatar = d.author_avatar || '';
    const avatarHtml = avatar 
        ? `<img class="dynamic-avatar" src="${escapeHtml(avatar)}" alt="">` 
        : `<div class="dynamic-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">${escapeHtml(d.author_name ? d.author_name[0] : '?')}</div>`;
    
    let imageHtml = '';
    if (d.image_url) {
        imageHtml = `<img class="dynamic-image" src="${escapeHtml(d.image_url)}" alt="动态图片" onclick="event.stopPropagation();window.open('${escapeHtml(d.image_url)}')">`;
    }
    
    return `
        <div class="dynamic-item">
            ${avatarHtml}
            <div class="dynamic-content">
                <div class="dynamic-header">
                    <span class="dynamic-author">${escapeHtml(d.author_name || '用户')}</span>
                    <span class="dynamic-time">${formatTime(d.created_at)}</span>
                </div>
                ${d.content ? `<div class="dynamic-text">${escapeHtml(d.content).replace(/\n/g, '<br>')}</div>` : ''}
                ${imageHtml}
            </div>
        </div>
    `;
}

// ========== 工具函数 ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    initNotifications();
    loadDynamics();
    initPublishDynamic();
});