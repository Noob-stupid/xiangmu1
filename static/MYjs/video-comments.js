// video-comments.js - 支持回复功能

let isSubmittingComment = false;
let commentsInitialized = false;
let currentUser = null;
let replyToComment = null; // 当前正在回复的评论

// 获取当前用户信息
async function loadCurrentUser() {
    try {
        const response = await fetch('/api/getuserinfor');
        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            currentUserId = data.id;  // ✅ 添加这行
            return data;
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
    }
    return null;
}

// 加载评论列表
async function loadComments(videoId) {
    const container = document.getElementById('commentsListContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="empty-comments">加载评论中...</div>';
    
    try {
        const response = await fetch(`/api/comments/${videoId}`);
        const data = await response.json();
        
        if (data.success && data.comments) {
            renderComments(data.comments);
        } else {
            container.innerHTML = '<div class="empty-comments">💬 还没有评论，来做第一个评论的人吧～</div>';
        }
    } catch (error) {
        console.error('加载评论失败:', error);
        container.innerHTML = '<div class="empty-comments">加载评论失败，请刷新重试</div>';
    }
}

// 渲染评论列表（树形结构）
function renderComments(comments) {
    const container = document.getElementById('commentsListContainer');
    if (!container) return;
    
    if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="empty-comments">💬 还没有评论，来做第一个评论的人吧～</div>';
        return;
    }
    
    let html = '';
    comments.forEach(comment => {
        html += renderCommentItem(comment);
    });
    
    container.innerHTML = html;
    
    // 绑定所有评论的交互事件
    bindCommentEvents();
}

// 渲染单个评论项
function renderCommentItem(comment, isReply = false) {
    const isCurrentUser = currentUser && comment.user_id === currentUser.id;
    const deleteButtonHtml = isCurrentUser 
        ? `<button class="delete-comment" data-id="${comment.id}" title="删除评论">🗑️ 删除</button>` 
        : '';
    
    const replyButtonHtml = currentUser 
        ? `<button class="reply-comment" data-id="${comment.id}" data-username="${escapeHtml(comment.username)}" data-name="${escapeHtml(comment.name)}" data-userid="${comment.user_id}">↵ 回复</button>`
        : '';
    
    // 处理回复提示
    let replyHint = '';
    if (comment.parent_id > 0 && comment.reply_to_username) {
        replyHint = `<span class="reply-hint">回复 @${escapeHtml(comment.reply_to_name || comment.reply_to_username)}</span>`;
    }
    
    // 渲染回复列表
    let repliesHtml = '';
    if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => {
            repliesHtml += renderCommentItem(reply, true);
        });
    }
    
    const commentClass = isReply ? 'reply-item' : 'comment-item';
    const indentStyle = isReply ? 'margin-left: 50px;' : '';
    
    return `
        <div class="${commentClass}" data-id="${comment.id}" style="${indentStyle}">
            <div class="comment-avatar">
                ${comment.avatar ? 
                    `<img src="${escapeHtml(comment.avatar)}" alt="avatar">` : 
                    `<div class="default-avatar">${escapeHtml(comment.name ? comment.name[0] : 'U')}</div>`
                }
            </div>
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.name || comment.username)}</span>
                    ${replyHint}
                    <span class="comment-time">${formatTime(comment.created_at)}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
                <div class="comment-actions">
                    ${replyButtonHtml}
                    ${deleteButtonHtml}
                </div>
                <div class="replies-container" data-parent-id="${comment.id}">
                    ${repliesHtml}
                </div>
                <!-- 回复输入框（默认隐藏） -->
                <div class="reply-input-container" id="replyInput-${comment.id}" style="display: none; margin-top: 10px;">
                    <textarea class="reply-textarea" placeholder="写下你的回复..." rows="2" maxlength="600"></textarea>
                    <div class="reply-actions">
                        <span class="reply-char-count">0/600</span>
                        <button class="reply-submit" data-parent-id="${comment.id}">发布回复</button>
                        <button class="reply-cancel">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 绑定评论交互事件
function bindCommentEvents() {
    // 删除评论
    document.querySelectorAll('.delete-comment').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute('data-id'));
            if (id && confirm('确定删除这条评论吗？删除后将同时删除所有回复。')) {
                await deleteComment(id);
            }
        });
    });
    
    // 回复按钮
    document.querySelectorAll('.reply-comment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const commentId = parseInt(btn.getAttribute('data-id'));
            const username = btn.getAttribute('data-username');
            const name = btn.getAttribute('data-name');
            const userId = parseInt(btn.getAttribute('data-userid'));
            
            showReplyInput(commentId, userId, username, name);
        });
    });
    
    // 发布回复按钮
    document.querySelectorAll('.reply-submit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const parentId = parseInt(btn.getAttribute('data-parent-id'));
            const container = document.getElementById(`replyInput-${parentId}`);
            const textarea = container.querySelector('.reply-textarea');
            const content = textarea.value.trim();
            
            if (!content) {
                alert('回复内容不能为空');
                return;
            }
            
            // 获取回复目标信息
            const commentElement = document.querySelector(`.comment-item[data-id="${parentId}"], .reply-item[data-id="${parentId}"]`);
            const username = commentElement.querySelector('.reply-comment')?.getAttribute('data-username') || '';
            const name = commentElement.querySelector('.reply-comment')?.getAttribute('data-name') || '';
            const userId = parseInt(commentElement.querySelector('.reply-comment')?.getAttribute('data-userid') || '0');
            
            const success = await addReply(window.currentVideo.id, parentId, content, userId, username, name);
            
            if (success) {
                textarea.value = '';
                hideReplyInput(parentId);
            }
        });
    });
    
    // 取消回复按钮
    document.querySelectorAll('.reply-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const container = btn.closest('.reply-input-container');
            const parentId = container.id.replace('replyInput-', '');
            hideReplyInput(parseInt(parentId));
        });
    });
    
    // 回复框字数统计
    document.querySelectorAll('.reply-textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            const container = this.closest('.reply-input-container');
            const countSpan = container.querySelector('.reply-char-count');
            if (countSpan) {
                countSpan.textContent = `${this.value.length}/600`;
            }
        });
    });
}

// 显示回复输入框
function showReplyInput(commentId, userId, username, name) {
    // 隐藏其他回复框
    document.querySelectorAll('.reply-input-container').forEach(container => {
        container.style.display = 'none';
    });
    
    const inputContainer = document.getElementById(`replyInput-${commentId}`);
    if (inputContainer) {
        inputContainer.style.display = 'block';
        const textarea = inputContainer.querySelector('.reply-textarea');
        textarea.placeholder = `回复 @${name || username}：`;
        textarea.focus();
        
        // 保存回复目标信息
        inputContainer.dataset.replyToUserId = userId;
        inputContainer.dataset.replyToUsername = username;
        inputContainer.dataset.replyToName = name;
    }
}

// 隐藏回复输入框
function hideReplyInput(commentId) {
    const inputContainer = document.getElementById(`replyInput-${commentId}`);
    if (inputContainer) {
        inputContainer.style.display = 'none';
        const textarea = inputContainer.querySelector('.reply-textarea');
        textarea.value = '';
    }
}

// 添加评论
async function addComment(videoId, content) {
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                video_id: videoId, 
                content: content,
                parent_id: 0
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadComments(videoId);
            return true;
        } else {
            alert(data.error || '发布失败');
            return false;
        }
    } catch (error) {
        console.error('发布评论失败:', error);
        alert('网络错误，请稍后重试');
        return false;
    }
}

// 添加回复
async function addReply(videoId, parentId, content, replyToUserId, replyToUsername, replyToName) {
    try {
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                video_id: videoId, 
                content: content,
                parent_id: parentId,
                reply_to_user_id: replyToUserId,
                reply_to_username: replyToUsername,
                reply_to_name: replyToName
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadComments(videoId);
            return true;
        } else {
            alert(data.error || '回复失败');
            return false;
        }
    } catch (error) {
        console.error('发布回复失败:', error);
        alert('网络错误，请稍后重试');
        return false;
    }
}

// 删除评论
async function deleteComment(commentId) {
    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadComments(window.currentVideo.id);
        } else {
            alert(data.error || '删除失败');
        }
    } catch (error) {
        console.error('删除评论失败:', error);
        alert('网络错误，请稍后重试');
    }
}

// 工具函数
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

// 初始化评论功能
// 在文件顶部定义全局处理函数

async function initComments(videoId) {
    window.currentVideo = { id: videoId };
    await loadCurrentUser();
    await loadComments(videoId);
    
    const publishBtn = document.getElementById('publishBtn');
    const commentTextarea = document.getElementById('commentContent');
    const charCountSpan = document.getElementById('charCount');
    
    // 直接绑定，不做任何处理
    publishBtn.onclick = async () => {
        const content = commentTextarea.value.trim();
        
        if (!content) {
            alert('评论内容不能为空');
            return;
        }
        const success = await addComment(videoId, content);
        if (success) {
            commentTextarea.value = '';
            charCountSpan.textContent = '0';
        }
    };
    
    commentTextarea.oninput = function() {
        charCountSpan.textContent = this.value.length;
    };
}