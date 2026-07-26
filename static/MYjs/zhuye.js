// ==================== 页面跳转 ====================
function goToshoucangPage(folderName) {
    window.location.href = `/zhuyeshoucang?folder=${encodeURIComponent(folderName)}`;
}

function goToVideoPage(videoId) {
    window.location.href = `/video?id=${videoId}`;
}

// ==================== 获取当前用户 ====================
let currentUserId = null;
let currentUserInfo = null;

async function loadCurrentUser() {
    try {
        const response = await fetch('/api/getuserinfor');
        const data = await response.json();
        if (data && data.id) {
            currentUserId = data.id;
            currentUserInfo = data;
            updateInfoCenter(data);
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }
}

// ==================== 信息中心功能 ====================
async function loadFollowCounts() {
    if (!currentUserId) return;
    try {
        const response = await fetch(`/api/follow/count/${currentUserId}`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('followingCount').textContent = data.following || 0;
            document.getElementById('followersCount').textContent = data.followers || 0;
        }
    } catch (error) {
        console.error('加载关注数失败:', error);
    }
}

function bindFollowClick() {
    const followItem = document.getElementById('followInfo');
    if (!followItem) return;
    followItem.addEventListener('click', () => {
        window.location.href = '/zhuyeguanzhu';
    });
}

function updateInfoCenter(userData) {
    const schoolValue = document.getElementById('schoolValue');
    if (schoolValue) {
        schoolValue.textContent = userData.school || '未公开';
    }
    const totalLikes = document.getElementById('totalLikes');
    if (totalLikes) {
        totalLikes.textContent = userData.total_likes || 0;
    }
    loadFollowCounts();
    loadInfoUnreadCount();
}

async function loadInfoUnreadCount() {
    try {
        const response = await fetch('/api/notifications/unread/count');
        const data = await response.json();
        const badge = document.getElementById('infoUnreadBadge');
        if (badge) {
            if (data.success && data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('加载未读数量失败:', error);
    }
}

function bindSchoolEdit() {
    const schoolItem = document.getElementById('schoolItem');
    const schoolEdit = document.getElementById('schoolEdit');
    const schoolInput = document.getElementById('schoolInput');
    const saveBtn = document.getElementById('saveSchool');
    const cancelBtn = document.getElementById('cancelSchool');
    const schoolValue = document.getElementById('schoolValue');
    if (!schoolItem) return;
    schoolItem.addEventListener('click', () => {
        schoolItem.style.display = 'none';
        schoolEdit.style.display = 'flex';
        schoolInput.value = schoolValue.textContent === '未公开' ? '' : schoolValue.textContent;
        schoolInput.focus();
    });
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const school = schoolInput.value.trim();
            if (!school) {
                alert('请输入学校名称');
                return;
            }
            try {
                const response = await fetch('/api/changeSchool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ school: school })
                });
                const data = await response.json();
                if (data.msg === '修改成功') {
                    schoolValue.textContent = school;
                    schoolEdit.style.display = 'none';
                    schoolItem.style.display = 'flex';
                } else {
                    alert(data.msg || '修改失败');
                }
            } catch (error) {
                console.error('修改学校失败:', error);
                alert('网络错误，请重试');
            }
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            schoolEdit.style.display = 'none';
            schoolItem.style.display = 'flex';
        });
    }
    if (schoolInput) {
        schoolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
    }
}

function bindNotificationClick() {
    const notiItem = document.getElementById('notificationInfo');
    if (!notiItem) return;
    notiItem.addEventListener('click', async () => {
        try {
            await fetch('/api/notifications/read/all', { method: 'POST' });
            const badge = document.getElementById('infoUnreadBadge');
            if (badge) {
                badge.style.display = 'none';
                badge.textContent = '0';
            }
        } catch (error) {
            console.error('标记已读失败:', error);
        }
        window.location.href = '/zhuyedongtai';
    });
}

function startAutoRefresh() {
    setInterval(async () => {
        if (!currentUserId) return;
        try {
            const response = await fetch('/api/getuserinfor');
            const data = await response.json();
            const totalLikes = document.getElementById('totalLikes');
            if (totalLikes) {
                totalLikes.textContent = data.total_likes || 0;
            }
        } catch (error) {
            console.error('刷新点赞数失败:', error);
        }
        loadFollowCounts();
        loadInfoUnreadCount();
    }, 30000);
}

function initInfoCenter() {
    bindSchoolEdit();
    bindFollowClick();
    bindNotificationClick();
    startAutoRefresh();
}

// ==================== 工具函数 ====================
function formatViews(views) {
    if (!views) return '0';
    if (views >= 10000) {
        return (views / 10000).toFixed(1) + 'w';
    }
    return views.toString();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== 创建视频卡片 ====================
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.style.cursor = 'pointer';
    const coverUrl = video.cover_path || video.cover || '/static/images/default-cover.jpg';
    const title = video.zuopin_name || video.title || '未知标题';
    const author = video.author_name || video.author || video.username || '未知作者';
    const views = formatViews(video.view_count || video.views || 0);
    card.innerHTML = `
        <img class="video-cover" src="${coverUrl}" alt="${escapeHtml(title)}" 
             onerror="this.src='/static/images/default-cover.jpg'">
        <div class="video-info">
            <div class="video-title">${escapeHtml(title)}</div>
            <div class="video-meta">
                <span>${escapeHtml(author)}</span>
                <span>${views}播放</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => {
        const vid = video.video_id || video.id;
        goToVideoPage(vid);
    });
    return card;
}

// ==================== 加载收藏夹 ====================
async function loadFavorites() {
    try {
        const response = await fetch('/api/shoucang/folders');
        const data = await response.json();
        
        if (data.success && data.folders) {
            const container = document.getElementById('fav-container');
            if (container) {
                container.innerHTML = '';
                
                const defaultCovers = [
                    '/static/images/default-fav1.jpg',
                    '/static/images/default-fav2.jpg',
                    '/static/images/default-fav3.jpg',
                    '/static/images/default-fav4.jpg',
                    '/static/images/default-fav5.jpg',
                    '/static/images/default-fav6.jpg',
                    '/static/images/default-fav7.jpg'
                ];
                
                data.folders.forEach((folder, index) => {
                    const coverUrl = folder.bg_url || defaultCovers[index % defaultCovers.length];
                    
                    const card = document.createElement('div');
                    card.className = 'fav-card';
                    card.dataset.folder = folder.folder_name;
                    card.style.cursor = 'pointer';
                    card.innerHTML = `
                        <img class="fav-cover" 
                             src="${coverUrl}" 
                             alt="${escapeHtml(folder.name)}"
                             onerror="this.onerror=null;this.src='/static/images/default-fav1.jpg'">
                        <div class="fav-info">
                            <div class="fav-title">${escapeHtml(folder.name)}</div>
                            <div class="fav-meta">
                                <span>${folder.video_count || 0}个视频</span>
                                <span>公开</span>
                            </div>
                        </div>
                    `;
                    card.addEventListener('click', () => {
                        goToshoucangPage(encodeURIComponent(folder.name));
                    });
                    container.appendChild(card);
                });
                
                const moreBtn = document.createElement('button');
                moreBtn.className = 'buttonchakan';
                moreBtn.innerHTML = '<a href="/zhuyeshoucang">查看更多》》</a>';
                container.appendChild(moreBtn);
            }
        }
    } catch (error) {
        console.error('加载收藏夹失败:', error);
    }
}

// 打开弹窗
document.getElementById('openBgSetting').onclick = function() {
  document.getElementById('bgModal').style.display = 'flex';
  document.getElementById('uploadTip').innerText = '';
  loadBgImageList();
};

// 关闭弹窗
document.getElementById('closeModal').onclick = function() {
  document.getElementById('bgModal').style.display = 'none';
};

// 上传图片
document.getElementById('saveBgBtn').onclick = async function() {
  const fileInput = document.getElementById('bgFile');
  const file = fileInput.files[0];
  const tip = document.getElementById('uploadTip');

  if (!file) {
    tip.innerText = '请先选择一张图片';
    return;
  }

  const formData = new FormData();
  formData.append('bg_file', file);

  try {
    const uploadRes = await fetch('/api/uploadSCbg', {
      method: 'POST',
      body: formData
    });
    const uploadData = await uploadRes.json();

    if (!uploadData.success) {
      tip.innerText = uploadData.msg || '上传失败';
      return;
    }

    tip.style.color = 'green';
    tip.innerText = '上传成功！点击下方图片可设为背景';
    fileInput.value = '';
    loadBgImageList();
  } catch (err) {
    tip.innerText = '上传失败';
    console.error(err);
  }
};

// 加载已上传背景图列表
async function loadBgImageList() {
  let res = await fetch('/api/listBgImages');
  let data = await res.json();
  let list = data.list || [];
  let wrap = document.getElementById('bgImageList');
  wrap.innerHTML = '';

  if (list.length === 0) {
    wrap.innerHTML = '<div style="grid-column:1/-1;color:#999;padding:20px;">暂无已上传图片</div>';
    return;
  }

  // 获取收藏夹列表用于下拉框
  let foldersRes = await fetch('/api/shoucang/folders');
  let foldersData = await foldersRes.json();
  let folders = foldersData.folders || [];
  
  let folderOptions = folders.map(f => 
    `<option value="${escapeHtml(f.folder_name)}">${escapeHtml(f.folder_name)}</option>`
  ).join('');

  list.forEach(item => {
    let div = document.createElement('div');
    div.style.position = 'relative';
    div.style.border = '1px solid #eee';
    div.style.borderRadius = '6px';
    div.style.overflow = 'hidden';
    div.style.cursor = 'pointer';

    div.innerHTML = `
      <img src="${item.url}" style="width:100%;height:100px;object-fit:cover;display:block;"
           onerror="this.parentElement.style.display='none'">
      
      <div style="position:absolute;bottom:0;left:0;right:0;">
        <select data-url="${item.url}" class="folder-select" 
                style="width:100%;padding:5px;font-size:12px;border:none;background:#f0f0f0;cursor:pointer;">
          <option value="">设为哪个收藏夹背景</option>
          ${folderOptions}
        </select>
      </div>
      <div data-image-id="${item.id}" data-filename="${item.name}" class="del-bg-btn" 
           style="position:absolute;top:4px;right:4px;background:red;color:white;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px;border-radius:4px;cursor:pointer;">
        ×
      </div>
    `;
    wrap.appendChild(div);
  });

  // 绑定下拉框选择事件
  document.querySelectorAll('.folder-select').forEach(select => {
    select.onchange = async function(e) {
      e.stopPropagation();
      let folderName = this.value;
      let url = this.dataset.url;
      
      if (!folderName) return;
      
      // 直接修改对应卡片的图片
      let targetCard = document.querySelector(`.fav-card[data-folder="${CSS.escape(folderName)}"]`);
      if (targetCard) {
        let img = targetCard.querySelector('.fav-cover');
        if (img) {
          img.src = url;
        }
      }
      
      // 保存到后端
      try {
        await fetch('/api/setFolderBg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder_name: folderName, image_url: url })
        });
      } catch(err) {
        console.error('保存失败:', err);
      }
    };
  });

  // 绑定删除事件
  document.querySelectorAll('.del-bg-btn').forEach(btn => {
    btn.onclick = async function(e) {
      e.stopPropagation();
      let imageId = this.dataset.imageId;
      let filename = this.dataset.filename;
      
      if (!confirm('确定要删除这张背景图吗？')) return;

      try {
        let res = await fetch('/api/delBgImage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_id: parseInt(imageId), name: filename })
        });
        let ret = await res.json();
        if (ret.msg === '删除成功') {
          loadBgImageList();
        } else {
          alert(ret.msg || '删除失败');
        }
      } catch (err) {
        console.error('删除失败:', err);
        alert('删除失败，请重试');
      }
    };
  });
}

// 绑定关注信息点击
function bindFollowClick() {
    const followItem = document.getElementById('followInfo');
    const modal = document.getElementById('followModal');
    const closeBtn = document.getElementById('closeFollowModal');
    const tabs = document.querySelectorAll('.follow-tab');
    
    if (!followItem) return;
    
    followItem.addEventListener('click', () => {
        modal.style.display = 'flex';
        loadFollowingList();
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.dataset.tab;
            if (type === 'following') {
                document.getElementById('followingList').style.display = 'block';
                document.getElementById('followersList').style.display = 'none';
                loadFollowingList();
            } else {
                document.getElementById('followingList').style.display = 'none';
                document.getElementById('followersList').style.display = 'block';
                loadFollowersList();
            }
        });
    });
}

async function loadFollowingList() {
    const container = document.getElementById('followingList');
    container.innerHTML = '<div class="empty-follow">加载中...</div>';
    try {
        const response = await fetch(`/api/follow/following/${currentUserId}`);
        const data = await response.json();
        if (data.success && data.users && data.users.length > 0) {
            renderFollowList(container, data.users);
        } else {
            container.innerHTML = '<div class="empty-follow">暂无关注</div>';
        }
    } catch (error) {
        console.error('加载关注列表失败:', error);
        container.innerHTML = '<div class="empty-follow">加载失败</div>';
    }
}

async function loadFollowersList() {
    const container = document.getElementById('followersList');
    container.innerHTML = '<div class="empty-follow">加载中...</div>';
    try {
        const response = await fetch(`/api/follow/followers/${currentUserId}`);
        const data = await response.json();
        if (data.success && data.users && data.users.length > 0) {
            renderFollowList(container, data.users);
        } else {
            container.innerHTML = '<div class="empty-follow">暂无粉丝</div>';
        }
    } catch (error) {
        console.error('加载粉丝列表失败:', error);
        container.innerHTML = '<div class="empty-follow">加载失败</div>';
    }
}

function renderFollowList(container, users) {
    let html = '';
    users.forEach(user => {
        const avatar = user.touxiang_url || '';
        const avatarHtml = avatar 
            ? `<img class="follow-avatar" src="${avatar}" alt="">` 
            : `<div class="follow-avatar" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;display:flex;align-items:center;justify-content:center;">${user.name?.[0] || '?'}</div>`;
        
        const isFollowing = user.is_following;
        const btnText = isFollowing ? '已关注' : '关注';
        const btnClass = isFollowing ? 'following' : '';
        
        html += `
            <div class="follow-item">
                ${avatarHtml}
                <div class="follow-info">
                    <div class="follow-name">${escapeHtml(user.name || user.username)}</div>
                    <div class="follow-school">${escapeHtml(user.school || '未公开学校')}</div>
                </div>
                ${user.id !== currentUserId ? `
                    <button class="follow-btn ${btnClass}" data-userid="${user.id}" onclick="toggleFollow(${user.id}, this)">
                        ${btnText}
                    </button>
                ` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

async function toggleFollow(userId, btn) {
    try {
        const response = await fetch(`/api/follow/${userId}`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            if (data.action === 'followed') {
                btn.textContent = '已关注';
                btn.classList.add('following');
            } else {
                btn.textContent = '关注';
                btn.classList.remove('following');
            }
            loadFollowCounts();
        } else {
            alert(data.error || '操作失败');
        }
    } catch (error) {
        console.error('操作失败:', error);
    }
}

// ==================== 加载点赞视频 ====================
async function loadLikedVideos() {
    if (!currentUserId) return;
    try {
        const response = await fetch(`/api/user/liked-videos/${currentUserId}`);
        const data = await response.json();
        const container = document.getElementById('video-container');
        if (!container) return;
        container.innerHTML = '';
        if (data.likevideo && data.likevideo.length > 0) {
            data.likevideo.slice(0, 5).forEach(video => {
                container.appendChild(createVideoCard(video));
            });
        } else {
            container.innerHTML = '<div class="empty-tip">暂无点赞视频</div>';
        }
        const moreBtn = document.createElement('button');
        moreBtn.className = 'buttonchakan2';
        moreBtn.innerHTML = '<a href="/zhuyedianzan">查看更多》》</a>';
        container.appendChild(moreBtn);
    } catch (error) {
        console.error('加载点赞视频失败:', error);
    }
}

// ==================== 加载浏览历史 ====================
async function loadHistoryVideos() {
    if (!currentUserId) return;
    try {
        const response = await fetch(`/api/user/history-videos/${currentUserId}`);
        const data = await response.json();
        const container = document.getElementById('video-container2');
        if (!container) return;
        container.innerHTML = '';
        if (data.lishivideo && data.lishivideo.length > 0) {
            data.lishivideo.slice(0, 5).forEach(video => {
                container.appendChild(createVideoCard(video));
            });
        } else {
            container.innerHTML = '<div class="empty-tip">暂无浏览历史</div>';
        }
        const moreBtn = document.createElement('button');
        moreBtn.className = 'buttonchakan3';
        moreBtn.innerHTML = '<a href="/zhuyelishi">查看更多》》</a>';
        container.appendChild(moreBtn);
    } catch (error) {
        console.error('加载浏览历史失败:', error);
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    initInfoCenter();
    loadFavorites();
    loadLikedVideos();
    loadHistoryVideos();
});