const shoucang = document.getElementById('shoucang');
if (shoucang) {
  shoucang.style.backgroundColor = "yellow";
  shoucang.style.border = "1.5px solid gray";
}

let folders = JSON.parse(localStorage.getItem('folders')) || [];
let currentFolderId = null;
let currentFolderName = null;

function tanchu() {
  const box = document.querySelector('.shoucanglan');
  box.classList.toggle("show");
}

function generateID() {
  return Date.now() + Math.random().toString(36).substr(2, 5);
}

function saveToLocal() {
  localStorage.setItem('folders', JSON.stringify(folders));
}

// HTML转义
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// 从后端加载收藏夹内的视频
async function loadFolderVideos(folderName) {
  const container = document.getElementById('folderContent');
  container.innerHTML = '<div class="empty-tip">⏳ 加载中...</div>';
  
  try {
    const response = await fetch(`/api/shoucang/folder/${encodeURIComponent(folderName)}/videos`);
    const data = await response.json();
    
    if (data.success) {
      renderVideosFromData(data.videos, folderName);
    } else {
      container.innerHTML = '<div class="empty-tip">❌ 加载失败，请重试</div>';
      console.error('加载失败:', data.error);
    }
  } catch (e) {
    container.innerHTML = '<div class="empty-tip">❌ 网络错误，请重试</div>';
    console.error('请求失败:', e);
  }
}

// 渲染从后端获取的视频数据
function renderVideosFromData(videos, folderName) {
  const container = document.getElementById('folderContent');
  
  if (!videos || videos.length === 0) {
    container.innerHTML = '<div class="empty-tip">📭 这个收藏夹还没有视频</div>';
    return;
  }
  
  let html = `<div class="video-flow">`;
  videos.forEach(v => {
    html += `
      <div class="video-card" onclick="location.href='/video?id=${v.video_id}'">
        <div class="video-cover">
          <img src="${v.cover}" alt="封面">
          <span class="duration">${escapeHtml(v.duration || '--:--')}</span>
          <span class="video-stats">📊 ${escapeHtml(v.stats || '0')}</span>
        </div>
        <div class="video-title">${escapeHtml(v.title)}</div>
        <div class="video-meta">${v.view_count || 0}播放 · ${v.like_count || 0}点赞</div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

// 渲染收藏夹列表
function renderFolders() {
  const list = document.getElementById('folderList');
  list.innerHTML = '';
  
  folders.forEach(f => {
    const div = document.createElement('div');
    div.className = 'shoucang-item';
    if (currentFolderId === f.id) div.classList.add('active');
    
    div.innerText = f.name;
    
    div.onclick = () => {
      currentFolderId = f.id;
      currentFolderName = f.name;
      renderFolders();
      loadFolderVideos(f.name);
    };
    list.appendChild(div);
  });
}

// 从后端同步收藏夹列表
async function syncFoldersFromServer() {
  try {
    const response = await fetch('/api/shoucang/folders');
    const data = await response.json();
    
    if (data.success && data.folders) {
      data.folders.forEach(folder => {
        const exists = folders.some(f => f.name === folder.name);
        if (!exists) {
          folders.push({
            id: generateID(),
            name: folder.name,
            video_count: folder.video_count,
            videos: []
          });
        }else {
          // 更新视频数量
          const existing = folders.find(f => f.name === folder.name);
          if (existing) {
            existing.video_count = folder.video_count;
          }
        }
      });
      
      saveToLocal();
      renderFolders();
    }
  } catch (e) {
    console.error('同步收藏夹失败:', e);
  }
}

// 删除收藏夹
document.getElementById('deftshoucangjia').onclick = async function (e) {
  e.stopPropagation();
  
  if (!currentFolderId) return alert('请先选择一个收藏夹');
  
  const folderToDelete = folders.find(f => f.id === currentFolderId);
  if (!folderToDelete) return;
  
  if (folderToDelete.name === '默认收藏夹' && folders.length === 1) {
    return alert('默认收藏夹是唯一的收藏夹，不能删除');
  }
  
  if (!confirm(`确定要删除收藏夹"${folderToDelete.name}"吗？\n注意：收藏夹内的所有视频收藏也会被删除！`)) {
    return;
  }
  
  // 调用后端删除
  try {
    const response = await fetch('/api/shoucang/folder/delete', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({folder_name: folderToDelete.name})
    });
    const data = await response.json();
    if (!data.success) {
      alert(data.error || '删除失败');
      return;
    }
  } catch (e) {
    console.log('后端删除接口未响应，继续前端删除');
  }
  
  // 删除本地记录
  folders = folders.filter(f => f.id !== currentFolderId);
  
  // 如果删除后没有收藏夹了，自动创建默认收藏夹
  if (folders.length === 0) {
    const defaultFolder = {
      id: generateID(),
      name: "默认收藏夹",
      videos: []
    };
    folders.push(defaultFolder);
    currentFolderId = defaultFolder.id;
    currentFolderName = defaultFolder.name;
  } else {
    currentFolderId = folders[0].id;
    currentFolderName = folders[0].name;
  }
  
  saveToLocal();
  renderFolders();
  loadFolderVideos(currentFolderName);
};


// 加载初始数据
async function loadData() {
  const stored = localStorage.getItem('folders');
  if (stored) {
    try {
      folders = JSON.parse(stored);
        // 清理旧格式的脏数据
      folders = folders.filter(f => {
        return f && typeof f === 'object' && f.id && f.name && f.name !== '[object Object]';
      });
    } catch (e) {
      folders = [];
    }
  } else {
    folders = [];
  }
  
  
  await syncFoldersFromServer();
  saveToLocal();
  
  const urlParams = new URLSearchParams(window.location.search);
  const folderParam = urlParams.get('folder');
  
  let targetFolder = null;
  
  if (folderParam) {
    targetFolder = folders.find(f => f.name === folderParam);
  }
  
  if (targetFolder) {
    currentFolderId = targetFolder.id;
    currentFolderName = targetFolder.name;
  } else if (folders.length > 0 && !currentFolderId) {
    currentFolderId = folders[0].id;
    currentFolderName = folders[0].name;
  }
  
  if (currentFolderName) {
    loadFolderVideos(currentFolderName);
  }
  
  renderFolders();
}

// URL参数处理
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const folderParam = urlParams.get('folder');
  if (folderParam) {
    window.SCname = folderParam;
    console.log('定位到收藏夹：', folderParam);
  }
})();

// 初始化
loadData();

// 默认展开收藏夹列表
document.querySelector('.shoucanglan').classList.add('show');