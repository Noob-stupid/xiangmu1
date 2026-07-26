let selectedFile = null;

        // 文件选择
        document.getElementById('videoInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                const fileInfo = document.getElementById('fileInfo');
                fileInfo.style.display = 'block';
                fileInfo.innerHTML = `📄 已选择: ${file.name}<br>📏 大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
                document.getElementById('auditBtn').disabled = false;
            }
        });

        // 开始评审
        async function startAudit() {
            if (!selectedFile) return;
            
            const auditBtn = document.getElementById('auditBtn');
            const resultDiv = document.getElementById('auditResult');
            
            auditBtn.disabled = true;
            auditBtn.textContent = '⏳ AI创意评审中，请稍候...';
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>AI正在分析你的创意作品，请稍候...</p>
                    <p style="font-size:12px; color:#888;">正在评估创意性、技术性和主题契合度</p>
                </div>
            `;
            
            const formData = new FormData();
            formData.append('video', selectedFile);
            formData.append('filename', selectedFile.name);
            try {
                const response = await fetch('/api/audit', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                
                if (data.error) {
                    resultDiv.innerHTML = `<div style="color:red">❌ 评审失败: ${data.error}</div>`;
                    resultDiv.className = 'result-area result-fail';
                    return;
                }
                
                displayAuditResult(data);
                
            } catch (error) {
                resultDiv.innerHTML = `<div style="color:red">❌ 网络错误: ${error.message}</div>`;
                resultDiv.className = 'result-area result-fail';
            } finally {
                auditBtn.disabled = false;
                auditBtn.textContent = '✨ 开始创意评审';
            }
        }
        
        // 显示评审结果（校园创意版）
        function displayAuditResult(data) {
            const resultDiv = document.getElementById('auditResult');
            const isPassed = data.passed;
            
            resultDiv.className = `result-area ${isPassed ? 'result-pass' : 'result-fail'}`;
            
            // 评分颜色
            const scoreColor = data.score >= 85 ? '#28a745' : (data.score >= 70 ? '#ffc107' : '#dc3545');
            
            // 评分等级文字
            let scoreLevel = '';
            if (data.score >= 85) scoreLevel = '🎉 优秀作品';
            else if (data.score >= 70) scoreLevel = '👍 良好作品';
            else if (data.score >= 60) scoreLevel = '📌 通过作品';
            else scoreLevel = '💪 待改进';
            
            // 创意类型标签
            let typeBadge = '';
            if (data.content_type) {
                typeBadge = `<div style="margin: 10px 0"><strong>📁 作品类型：</strong><span class="badge" style="background:#667eea; color:white; padding:4px 12px; border-radius:20px">${data.content_type}</span></div>`;
            }
            
            // 内容标签
            let tagsHtml = '';
            if (data.tags && data.tags.length > 0) {
                tagsHtml = `<div style="margin: 10px 0"><strong>🏷️ 作品标签：</strong> ${data.tags.map(t => `<span style="background:#e9ecef; padding:4px 10px; border-radius:20px; margin-right:8px; font-size:12px">#${t}</span>`).join('')}</div>`;
            }
            
            // 改进建议
            let suggestionsHtml = '';
            if (data.suggestions && data.suggestions.length > 0) {
                suggestionsHtml = `
                    <div style="margin-top: 15px; background: #fff3cd; padding: 12px; border-radius: 10px;">
                        <strong>💡 创意提升建议：</strong>
                        <ul style="margin: 8px 0 0 20px;">
                            ${data.suggestions.map(s => `<li style="margin: 5px 0">${s}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            
            // 帧分析详情
            let framesHtml = '';
            if (data.frame_details && data.frame_details.length > 0) {
                framesHtml = '<div style="margin-top:15px"><strong>🎬 作品亮点分析</strong><div class="frame-list">';
                data.frame_details.forEach(f => {
                    const emoji = f.status === 'excellent' ? '✨' : (f.status === 'good' ? '👍' : (f.status === 'warning' ? '💡' : '📌'));
                    framesHtml += `
                        <div class="frame-item">
                            <span>📸 片段 ${f.frame}</span>
                            <span>${emoji} ${f.analysis}</span>
                        </div>
                    `;
                });
                framesHtml += '</div></div>';
            }
            
            resultDiv.innerHTML = `
                <div class="result-title" style="font-size: 20px;">
                    ${scoreLevel}
                </div>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 12px; margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                        <span style="font-size: 14px; color: #666;">综合创意评分</span>
                        <span style="font-size: 28px; font-weight: bold; color: ${scoreColor};">${data.score}分</span>
                    </div>
                    <div style="margin-top: 10px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${data.score}%; height: 100%; background: ${scoreColor}; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #888;">
                        <span>✨ 创意性: ${data.quality_score}分</span>
                        <span>🎯 主题契合: ${data.theme_score}分</span>
                    </div>
                </div>
                
                <div style="margin: 15px 0; padding: 12px; background: #e8f4fd; border-radius: 10px;">
                    <strong>📢 评审意见</strong>
                    <p style="margin-top: 8px; line-height: 1.5;">${data.message}</p>
                </div>
                
                ${typeBadge}
                ${tagsHtml}
                ${framesHtml}
                ${suggestionsHtml}
                
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                    📊 分析片段数: ${data.frames_analyzed} 个
                </div>
            `;
            sessionStorage.setItem('latestAuditResult', JSON.stringify({
        screen: data.quality_score || 0,
        subtitle: data.theme_score || 0,
        total: data.score || 0,
        timestamp: Date.now()
    }));
    
    // ========== 触发报告更新 ==========
    if (typeof MultimodalReport !== 'undefined') {
        MultimodalReport.refresh();
    }

}

        
/**
 * 人工审核记录 - 极简版
 */
async function loadAuditRecords() {
    const container = document.getElementById('statusContainer');
    
    try {
        const res = await fetch('/api/user/video_status', { credentials: 'include' });
        const data = await res.json();
        
        if (!data.success || !data.records?.length) {
            container.innerHTML = '<div class="empty-records">📭 暂无审核记录</div>';
            return;
        }
        
        let html = '';
        
        data.records.forEach(r => {
            const isPending = r.status === 'pending';
            const icon = isPending ? '⏳' : '❌';
            const text = isPending ? '审核中' : '未通过';
            const statusClass = isPending ? 'status-pending' : 'status-rejected';
            const reason = !isPending && r.reason ? `<span class="status-reason">${r.reason}</span>` : '';
            
            html += `
                <div class="status-item ${statusClass}">
                    <span class="status-icon">${icon}</span>
                    <span class="status-text">${text}</span>
                    <span class="status-time">${r.created_at || ''}</span>
                    ${reason}
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (err) {
        container.innerHTML = '<div class="empty-records">❌ 加载失败</div>';
    }
}

// 页面加载
document.addEventListener('DOMContentLoaded', loadAuditRecords);