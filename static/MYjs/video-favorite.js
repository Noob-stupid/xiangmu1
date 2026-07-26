async function loadFavoriteFolders() {
    try {
        const response = await fetch('/api/shoucang/folders');
        const data = await response.json();
        if (data.success && data.folders) {
            favoriteFolders = data.folders;
            updateFolderSelect();
        }
    } catch (error) {
        console.error('获取收藏夹失败:', error);
    }
}

// 检查当前视频在指定收藏夹的收藏状态
async function checkFavoriteStatus(videoId, folderName) {
    if (!videoId) return false;
    
    try {
        const response = await fetch(`/api/shoucang/status/${videoId}?sc_name=${encodeURIComponent(folderName)}`);
        const data = await response.json();
        return data.success && data.collected;
    } catch (error) {
        console.error('检查收藏状态失败:', error);
        return false;
    }
}

// ==================== 收藏夹 UI ====================

// 更新下拉框选项
function updateFolderSelect() {
    const select = document.getElementById('folderSelect');
    if (!select) return;
    
    let html = '';
    favoriteFolders.forEach(folder => {
        const folderName = typeof folder === 'object' ? folder.name : folder;
        html += `<option value="${escapeHtml(folderName)}">${escapeHtml(folderName)}</option>`;
    });
    html += '<option value="__new__">➕ 新建收藏夹...</option>';
    
    select.innerHTML = html;
    select.value = currentFolder;
}

// 更新收藏按钮显示
async function updateFavButton() {
    if (!favBtn || !currentVideo) return;
    
    const isCollected = await checkFavoriteStatus(currentVideo.id, currentFolder);
    if (isCollected) {
        favBtn.innerHTML = '⭐ 已收藏';
    } else {
        favBtn.innerHTML = '⭐ 收藏';
    }
}

// 下拉框事件处理
async function handleFolderChange(e) {
    if (e.target.value === '__new__') {
        const newFolder = prompt('请输入新收藏夹名称：');
        if (newFolder && newFolder.trim()) {
            const folderName = newFolder.trim();
            const exists = favoriteFolders.some(f => {
                const name = typeof f === 'object' ? f.name : f;
                return name === folderName;
            });
            if (!exists) {
                favoriteFolders.push(folderName);
                currentFolder = folderName;
                updateFolderSelect();
                await updateFavButton();
            } else {
                alert('收藏夹已存在');
                e.target.value = currentFolder;
            }
        } else {
            e.target.value = currentFolder;
        }
    } else {
        currentFolder = e.target.value;
        await updateFavButton();
    }
}
