//修改名字
function bindGaimingEvent() {
    const gaiming = document.querySelector('.gaiming')
    const genggai = document.querySelector('.genggai')
    genggai.addEventListener('click', () => {
        fetch('/api/getuserinfor')
            .then(response => {
                
                return response.json()//原始相应
            })
            .then(data => {
                // gaimingInput.value = data.name
                const name = data.name
                if (name == gaiming.value) {
                    alert('你不想改名字吗?xd')
                    return
                }
                else {
                    const newname = gaiming.value
                    fetch('/api/changename', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'//告诉后端传输的类型
                        },
                        body: JSON.stringify({ name: newname })
                    })
                        .then(res => res.json())//为获取上传信息
                        .then(data => {
                            alert(data.msg)
                            location.reload()//data依旧为解析后的真实数据
                        })
                        .catch(err => {
                            console.log(err)
                        })
                }
            })
    })
}
//修改签名
function updatesignature() {
    const qianming = document.querySelector('.qianming input');
    let timer;
    qianming.addEventListener('input', function () {
        clearTimeout(timer)
        timer = setTimeout(() => {
            fetch('/api/signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_signature: this.value })
        })
        .then(res => res.json())
        .then(data => {
            console.log('后端返回:', data);
        })
        .catch(err => {
            console.log('请求失败:', err);
        })
        },1000)
        
    })
    
    console.log('事件绑定完成');
}

// 等 DOM 加载完再执行
document.addEventListener('DOMContentLoaded', function() {
    updatesignature();
});

//修改头像
function bindTouxiangEvent() {
    const fileTouxiang = document.querySelector('.fileTouxiang')
    const queding = document.querySelector('.queding')
    let uploadedAvatarUrl = '';  // 存储上传后的头像URL
    fileTouxiang.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        // 检查文件类型
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('只支持 jpg、png、gif 格式的图片');
            return;
        }
        
        // 检查文件大小（2MB）
        if (file.size > 2 * 1024 * 1024) {
            alert('图片大小不能超过2MB');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const res = await fetch('/api/upload_avatar', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (data.success) {
                uploadedAvatarUrl = data.avatar_url;
                alert('头像上传成功！点击"确定"保存更改');
            } else {
                alert(data.error || '上传失败');
            }
        } catch (err) {
            console.error('上传失败:', err);
            alert('网络错误，请重试');
        }
    });
    queding.addEventListener('click', async function () {
        if (!uploadedAvatarUrl) {
            alert('请先选择并上传新头像');
            return;
        }
        try {
            // 获取当前用户信息
            const userRes = await fetch('/api/getuserinfor');
            const userData = await userRes.json();
            const currentAvatar = userData.touxiang_url;
            // 检查是否和当前头像相同
            if (currentAvatar === uploadedAvatarUrl) {
                alert('你不需要换头像吗?xd');
                return;
            }
            // 更新数据库
            const res = await fetch('/api/changeTouxiang', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ new_touxiang: uploadedAvatarUrl })
            });
            const data = await res.json();
            if (data.msg === '修改成功') {
                alert('头像修改成功！');
                location.reload();  // ✅ 直接刷新页面
        } else {
            alert(data.msg || '修改失败');
        }
    } catch (err) {
        console.error('保存失败:', err);
        alert('网络错误，请重试');
    }
});
}
function bindBgEvent() {
    const fileBg = document.querySelector('#filebg');
    const genggaibg = document.querySelector('.genggaibg');
    let uploadedBgUrl = '';
    
    // 文件选择：上传背景
    fileBg.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert('只支持 jpg、png 格式的图片');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过5MB');
            return;
        }
        
        const formData = new FormData();
        formData.append('bg', file);
        
        try {
            const res = await fetch('/api/upload_bg', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (data.success) {
                uploadedBgUrl = data.bg_url;
                alert('背景上传成功！点击"更改"保存');
            } else {
                alert(data.error || '上传失败');
            }
        } catch (err) {
            console.error('上传失败:', err);
            alert('网络错误，请重试');
        }
    });
    
    // 更改按钮：保存到数据库
    genggaibg.addEventListener('click', async function() {
        if (!uploadedBgUrl) {
            alert('请先选择并上传新背景');
            return;
        }
        
        try {
            const res = await fetch('/api/changeBg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_bg: uploadedBgUrl })
            });
            
            const data = await res.json();
            
            if (data.msg === '修改成功') {
                alert('背景修改成功！');
                location.reload();
            } else {
                alert(data.msg || '修改失败');
            }
        } catch (err) {
            console.error('保存失败:', err);
            alert('网络错误，请重试');
        }
    });
}

window.bindTouxiangEvent = bindTouxiangEvent
window.bindGaimingEvent = bindGaimingEvent
window.updatesignature = updatesignature