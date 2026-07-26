// const tougao = document.getElementById('tougao');
// tougao.style.backgroundColor = "rgba(111,255,255)";
// tougao.style.border = "1.5px solid gray";
const fileup = document.getElementById('videoInput');
const shangchuan = document.getElementById('shangchuan');
shangchuan.addEventListener('click', async() => {
  const file = fileup.files[0];
  const formData = new FormData();
  formData.append('file', file);//创建formdata表单，并添加文件
  const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  // console.log('服务器保存位置:', result.filePath);
  // alert('上传成功!');
  if (result.success) {
      alert(`上传成功！\n得分：${result.audit_score}分`);
      console.log('服务器保存位置:', result.filePath);
    } else {
      // 审核不通过
      alert(`审核不通过！\n得分：${result.score}分\n原因：${result.message}`);
    }
   
})
const fileupNOAI = document.getElementById('auditNOAI');
const rengong = document.getElementById('rengong');
rengong.addEventListener('click', async() => {
  const file = fileupNOAI.files[0];
  const formData = new FormData();
  formData.append('file', file);//创建formdata表单，并添加文件
  const response = await fetch('/uploadNOAI', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  // console.log('服务器保存位置:', result.filePath);
  // alert('上传成功!');
  if (result.status=='success') {
      alert(`上传成功`);
      console.log('服务器保存位置:', result.filePath);
    }
})

// 加载审核状态
function loadVideoStatus() {
    const container = document.getElementById('statusContainer');
    if (!container) return;
    
    container.innerHTML = '加载中...';
    
    fetch('/api/user/video_status')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.records.length > 0) {
                displayStatus(data.records);
            } else {
                container.innerHTML = '<p style="color: #f9f7f7;">暂无审核记录</p>';
            }
        })
        .catch(err => {
            console.error('加载状态失败:', err);
            container.innerHTML = '<p style="color: red;">加载失败，请刷新</p>';
        });
}

function displayStatus(records) {
    const container = document.getElementById('statusContainer');
    
    const statusMap = {
        'pending': { text: '⏳ 待审核', color: '#ffa500' },
        'approved': { text: '✅ 已通过', color: '#4CAF50' },
        'rejected': { text: '❌ 未通过', color: '#f44336' }
    };
    
    let html = '';
    records.forEach(record => {
        const status = statusMap[record.status] || { text: record.status, color: '#888' };
        const videoName = record.zuopin_url.split('/').pop();
        
        html += `
            <div class="status-item" style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:8px;">
                <p><strong>视频:</strong> ${videoName}</p>
                <p><strong>状态:</strong> <span style="color: ${status.color};">${status.text}</span></p>
                <p><strong>原因:</strong> ${record.reason || '—'}</p>
                <p><strong>上传时间:</strong> ${record.created_at || '—'}</p>
                ${record.status === 'rejected' ? 
                    `<button onclick="confirmDelete(${record.id})" style="background:#f44336; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">确认并删除</button>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 用户确认删除
function confirmDelete(shenheId) {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    const formData = new FormData();
    formData.append('shenhe_id', shenheId);
    
    fetch('/api/confirm_reject', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('已删除');
            loadVideoStatus(); // 刷新列表
        } else {
            alert('删除失败: ' + data.error);
        }
    })
    .catch(err => {
        console.error('删除失败:', err);
        alert('操作失败');
    });
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    loadVideoStatus();
});