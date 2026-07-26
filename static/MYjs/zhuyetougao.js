// zhuyetougao.js
const tougao = document.getElementById('tougao');
if (tougao) {
    tougao.style.backgroundColor = "rgba(111,255,255)";
    tougao.style.border = "1.5px solid gray";
}

let currentUserId = null;
let currentStatus = 'all';
let allWorks = [];

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

// ==================== 加载作品列表 ====================
async function loadWorks() {
    const container = document.getElementById('worksList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-tip">加载中...</div>';
    
    if (!currentUserId) {
        container.innerHTML = '<div class="empty-tip">请先登录</div>';
        return;
    }
    
    try {
        // 获取已发布的作品
        const videoRes = await fetch(`/api/user/videos/${currentUserId}`);
        const videoData = await videoRes.json();
        
        // 获取审核中的作品
        const pendingRes = await fetch(`/api/user/video_status`);
        const pendingData = await pendingRes.json();
        
        allWorks = [];
        
        // 合并已发布作品
        if (videoData.success && videoData.videos) {
            videoData.videos.forEach(v => {
                // audit_result 为 'hidden' 表示已下架
                const status = v.audit_result === 'hidden' ? 'hidden' : 'passed';
                allWorks.push({
                    id: v.id,
                    type: 'video',
                    title: v.zuopin_name,
                    cover: v.cover_path || '/static/images/default-cover.jpg',
                    views: v.view_count || 0,
                    status: status,
                    createdAt: v.upload_time
                });
            });
        }
        
        // 合并审核中/未通过作品
        if (pendingData.success && pendingData.records) {
            pendingData.records.forEach(r => {
                allWorks.push({
                    id: r.id,
                    type: 'pending',
                    title: r.zuopin_url.split('/').pop() || '未知文件',
                    cover: '/static/images/video-pending.jpg',
                    status: r.status,
                    reason: r.reason,
                    createdAt: r.created_at
                });
            });
        }
        
        renderWorks();
        
    } catch (error) {
        console.error('加载作品失败:', error);
        container.innerHTML = '<div class="empty-tip">加载失败，请刷新重试</div>';
    }
}

// ==================== 渲染作品列表 ====================
function renderWorks() {
    const container = document.getElementById('worksList');
    
    let filteredWorks = allWorks;
    if (currentStatus !== 'all') {
        filteredWorks = allWorks.filter(w => w.status === currentStatus);
    }
    
    if (filteredWorks.length === 0) {
        container.innerHTML = '<div class="empty-tip">暂无作品，快去上传吧~</div>';
        return;
    }
    
    let html = '';
    filteredWorks.forEach(work => {
        const statusText = {
            'passed': '已发布',
            'pending': '审核中',
            'rejected': '未通过',
            'hidden': '已下架'
        }[work.status] || work.status;
        
        const statusClass = `status-${work.status}`;
        
        // 下架标识
        const hiddenBadge = work.status === 'hidden' ? '<span class="hidden-badge">🔒 已下架</span>' : '';
        
        // 操作按钮
        let actionsHtml = '';
        if (work.status === 'passed') {
            actionsHtml = `
                <button class="work-action-btn down" onclick="event.stopPropagation(); toggleWorkStatus(${work.id}, 'down')" title="下架">⬇</button>
                <button class="work-action-btn delete" onclick="event.stopPropagation(); deleteWork(${work.id})" title="删除">🗑</button>
            `;
        } else if (work.status === 'hidden') {
            actionsHtml = `
                <button class="work-action-btn up" onclick="event.stopPropagation(); toggleWorkStatus(${work.id}, 'up')" title="上架">⬆</button>
                <button class="work-action-btn delete" onclick="event.stopPropagation(); deleteWork(${work.id})" title="删除">🗑</button>
            `;
        } else if (work.status === 'rejected') {
            actionsHtml = `
                <button class="work-action-btn delete" onclick="event.stopPropagation(); confirmReject(${work.id})" title="删除">🗑</button>
            `;
        }
        
        // 点击跳转 - 已发布和已下架可以点击
        const clickable = (work.status === 'passed' || work.status === 'hidden') && work.type === 'video';
        const onClick = clickable ? `onclick="goToVideo(${work.id})"` : '';
        const cursorStyle = clickable ? 'cursor: pointer;' : '';
        
        html += `
            <div class="work-card" ${onClick} style="${cursorStyle}">
                <img class="work-cover" src="${escapeHtml(work.cover)}" alt="${escapeHtml(work.title)}" 
                     onerror="this.src='/static/images/default-cover.jpg'">
                <div class="work-actions">
                    ${actionsHtml}
                </div>
                <div class="work-info">
                    <div class="work-title" title="${escapeHtml(work.title)}">${escapeHtml(work.title)}</div>
                    <div class="work-meta">
                        <span>👁 ${work.views || 0} 播放</span>
                        <span class="work-status ${statusClass}">${statusText}</span>
                    </div>
                    ${hiddenBadge}
                    ${work.status === 'rejected' && work.reason ? 
                        `<div style="font-size:12px;color:#ff4d4f;margin-top:8px;">原因: ${escapeHtml(work.reason)}</div>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==================== 跳转到视频页 ====================
function goToVideo(videoId) {
    window.location.href = `/video?id=${videoId}`;
}

// ==================== 下架/上架作品 ====================
async function toggleWorkStatus(workId, action) {
    const actionText = action === 'down' ? '下架' : '上架';
    if (!confirm(`确定${actionText}这个作品吗？`)) return;
    
    try {
        const status = action === 'down' ? 'hidden' : 'passed';
        const response = await fetch(`/api/video/${workId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        const data = await response.json();
        
        if (data.success) {
            alert(`${actionText}成功`);
            loadWorks();
        } else {
            alert(data.error || '操作失败');
        }
    } catch (error) {
        console.error(`${actionText}失败:`, error);
        alert('网络错误，请重试');
    }
}

// ==================== 删除作品 ====================
async function deleteWork(workId) {
    if (!confirm('确定删除这个作品吗？删除后无法恢复！')) return;
    
    try {
        const response = await fetch(`/api/video/${workId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            alert('删除成功');
            loadWorks();
        } else {
            alert(data.error || '删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('网络错误，请重试');
    }
}

// ==================== 确认删除未通过作品 ====================
async function confirmReject(workId) {
    if (!confirm('确定删除这个作品吗？')) return;
    
    try {
        const formData = new FormData();
        formData.append('shenhe_id', workId);
        
        const response = await fetch('/api/confirm_reject', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            alert('删除成功');
            loadWorks();
        } else {
            alert(data.error || '删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('网络错误，请重试');
    }
}

// ==================== 工具函数 ====================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== 绑定标签切换 ====================
function bindTabs() {
    const tabs = document.querySelectorAll('.works-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            renderWorks();
        });
    });
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadWorks();
    bindTabs();
    
    // 检查审核员状态
    if (typeof checkShenheyuanStatus === 'function') {
        checkShenheyuanStatus();
    }
});