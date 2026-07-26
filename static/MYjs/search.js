// 显示首页搜索
function showHomeSearch() {
    document.getElementById('homeSearch').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('homeSearchInput').value = '';
}

// 显示搜索结果
function showSearchResults(query) {
    document.getElementById('homeSearch').style.display = 'none';
    document.getElementById('searchResults').style.display = 'block';
    document.getElementById('searchQuery').textContent = query;
}

// 点击热门标签
function searchHot(tag) {
    document.getElementById('homeSearchInput').value = tag;
    doSearch('home');
}

// 执行搜索
function doSearch(source) {
    let query;
    if (source === 'home') {
        query = document.getElementById('homeSearchInput').value.trim();
    }
    
    if (!query) {
        alert('请输入搜索关键词');
        return;
    }
    
    showSearchResults(query);
    loadSearchResults(query);
}

// 加载搜索结果
async function loadSearchResults(query) {
    const resultList = document.getElementById('resultList');
    resultList.innerHTML = '<div class="loading">搜索中...</div>';
    
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query, top_k: 20 })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data.results);
            document.getElementById('resultCount').textContent = data.results.length;
        } else {
            resultList.innerHTML = '<div class="empty-result">搜索失败</div>';
        }
    } catch (error) {
        resultList.innerHTML = '<div class="empty-result">网络错误，请稍后重试</div>';
    }
}

// 显示结果
function displayResults(results) {
    const resultList = document.getElementById('resultList');
    
    if (!results || results.length === 0) {
        resultList.innerHTML = '<div class="empty-result">未找到相关视频</div>';
        return;
    }
    
    resultList.innerHTML = results.map(v => {
        const matchPercent = (v.score * 100).toFixed(0);
        let tags = [];
        if (v.tags) {
            tags = typeof v.tags === 'string' ? v.tags.split(',') : v.tags;
        }
        
        return `
            <div class="result-item" onclick="playVideo(${v.id})">
                <div class="result-cover">
                    <img src="${v.cover_path || ''}" alt="">
                </div>
                <div class="result-info">
                    <div class="result-title">${highlightKeyword(v.zuopin_name, document.getElementById('searchQuery').textContent)}</div>
                    <div class="result-meta">
                        <span class="match-score">匹配度 ${matchPercent}%</span>
                        <span>观看 ${v.view_count || 0}</span>
                    </div>
                    <div class="result-tags">
                        ${tags.slice(0, 3).map(t => '<span class="result-tag">' + t.trim() + '</span>').join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 关键词高亮
function highlightKeyword(text, keyword) {
    if (!keyword || !text) return text;
    const regex = new RegExp('(' + keyword + ')', 'gi');
    return text.replace(regex, '<em style="color: #f00; font-style: normal;">$1</em>');
}

// 播放视频
function playVideo(videoId) {
    window.location.href = '/video?id=' + videoId;
}

// 监听回车键
document.getElementById('homeSearchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') doSearch('home');
});

// 检查 URL 参数
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
        document.getElementById('homeSearchInput').value = q;
        showSearchResults(q);
        loadSearchResults(q);
    }
}

// 页面加载时执行
// loadUserInfo();
checkUrlParams();