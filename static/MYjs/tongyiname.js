  // 一进页面就自动显示名字
function showUserName() {
  fetch('/api/getuserinfor')
    .then(res => res.json())
    .then(user => {
      // 核心：直接显示 user.name 即可
      // 注册=账号，改名=新名字，后端已经处理好了
       const showName = document.getElementById('showName');
            const showName2 = document.getElementById('showName2');
            
            if (showName) {
                showName.innerText = user.name;
            }
            if (showName2) {
                showName2.innerText = user.name;
      }
      const path = window.location.pathname;
      if (path.includes('/zhuye')) {
        document.title = `${user.name}的主页`;
      }
    });
}
//加载签名
function showsignature() {
    fetch('/api/get-signature')  // 纯获取，不传任何东西
        .then(res => res.json())
        .then(data => {
            document.querySelector('.qianming input').value = data.signature || '';
        });
}
// ========== 页面加载时读取头像 ==========
async function loadUserAvatar() {
    try {
        const res = await fetch('/api/getuserinfor');
        const data = await res.json();
        
      if (data.touxiang_url) {
          const style = document.createElement('style');
            style.id = 'avatar-style';
            style.textContent = `.geren::before { background-image: url("${data.touxiang_url}") !important; }`;
            
            // 移除旧的，添加新的
            const old = document.getElementById('avatar-style');
            if (old) old.remove();
            document.head.appendChild(style);
            document.querySelectorAll('.touxiang').forEach(el => {
                el.style.backgroundImage = `url("${data.touxiang_url}")`;
                el.style.backgroundSize = 'cover';
              el.style.backgroundPosition = 'center';
            });
        }
    } catch (err) {
        console.error('加载头像失败:', err);
    }
}
// 加载用户背景图
async function loadUserBg() {
    try {
        const res = await fetch('/api/getuserinfor');
        const data = await res.json();
        
        if (data.bg_url) {
            const style = document.createElement('style');
            style.id = 'bg-style';
            style.textContent = `.bg1 { background-image: url("${data.bg_url}") !important; }`;
            
            const old = document.getElementById('bg-style');
            if (old) old.remove();
            document.head.appendChild(style);
            
            console.log('背景已设置:', data.bg_url);
        }
    } catch (err) {
        console.error('加载背景失败:', err);
    }
}

// 页面加载时执行
loadUserBg();//显示背景
showUserName();// 页面加载 → 显示名字
loadUserAvatar();//全局显示头像
showsignature();  // 页面加载时显示签名
