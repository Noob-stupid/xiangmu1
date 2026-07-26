const daohang = document.querySelectorAll('.daohanglan span')
function qingkong (){
  daohang.forEach(items => {
    items.style.backgroundColor = "";
    items.style.border = "";
  })
}
daohang.forEach(item => {
  item.addEventListener('click',function(){
    switch (this.id) {
    case 'zhuye': qingkong(); this.style.backgroundColor = "rgba(217, 137, 39, 0.5)";
      this.style.border = "1.5px solid gray"; break;
    case 'dianzan':qingkong(); this.style.backgroundColor = "pink";
      this.style.border = "1.5px solid gray";break;
    case 'shoucang':qingkong(); this.style.backgroundColor = "yellow";
      this.style.border = "1.5px solid gray";  break;
    case 'lishi':qingkong(); this.style.backgroundColor = "rgba(11,123,101,0.5)";
      this.style.border = "1.5px solid gray";  break;
    case 'tougao':qingkong(); this.style.backgroundColor = "rgba(111,255,255)";
      this.style.border = "1.5px solid gray";  break;
    case 'dongtai':qingkong(); this.style.backgroundColor = "rgba(82, 224, 16, 0.5)";
      this.style.border = "1.5px solid gray";break;
    case 'shezhi':this.style.backgroundColor = "rgba(85, 78, 78, 0.5)";
      this.style.border = "1.5px solid gray";break;
    default: break;
  }
})
})
function Shezhi(){
    const shezhiJS = document.createElement('div');
  shezhiJS.className = 'shezhi';
  shezhiJS.style.opacity = '0';
  shezhiJS.innerHTML = `
    <div class="shezhi-header" style="cursor: move; padding: 10px 0; margin-bottom: 15px; border-bottom: 1px solid #e8e8e8; user-select: none;">
            <button class="guanbi">❌</button>
    <span style="font-weight: 500;">设置</span>
        </div>
        <div>上传头像<input type="file" id="filetx" class="fileTouxiang">(宽高150px)
        <button class="queding">确定</button>
        </div>
        <div>修改名称<input type="text" value="" class="gaiming">
        <button class="genggai">更改</button>
        </div>
        <div>更换背景<input type="file" id="filebg" class="filego">
        <button class="genggaibg">更改</button>
        </div>
        <div>隐私设置:(暂未实现)
            <ul class="yinsi">
                <li>公开我的收藏 <input type="radio" class="xuanze" name="ys.shoucang"></li>
                <li>公开我的生日、个人资料<input type="radio" class="xuanze"></li>
                <li>公开学校信息<input type="radio" class="xuanze"></li>
                <li>公开我的粉丝列表<input type="radio" class="xuanze" checked></li>
                <li>公开最近点赞的视频<input type="radio" class="xuanze" checked></li>
            </ul>
        </div>
        <div class=""><a href="/logout">退出登录</a></div>
        
        `
      
      ;
    shezhiJS.style.left = '50%';
    shezhiJS.style.top = '50%';
    shezhiJS.style.transform = 'translate(-50%, -50%)';
    shezhiJS.style.position = 'fixed';
  shezhiJS.style.zIndex = '999';
  setTimeout(() => {
        shezhiJS.style.opacity = '1';
    }, 10);
    
    const guanbiBtn = shezhiJS.querySelector('.guanbi');
    guanbiBtn.addEventListener('click', function () {
        shezhiJS.remove();
        const shezhiqingkong = document.getElementById('shezhi');
        shezhiqingkong.style.backgroundColor = "";
        shezhiqingkong.style.border = "";
    });
  const gaimingInput = shezhiJS.querySelector('.gaiming');
  fetch('/api/getuserinfor')
    .then(res => res.json())
    .then(data => {
      gaimingInput.value = data.name;
    });
    // ========== 拖动功能 ==========
const header = shezhiJS.querySelector('.shezhi-header');
let isDragging = false;
let startX, startY, startLeft, startTop;

header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('guanbi')) return;
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // 获取当前位置（考虑 transform 的影响）
    const rect = shezhiJS.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
  // 取消 transform，改用 left/top 定位
  shezhiJS.style.left = startLeft + 'px';
    shezhiJS.style.top = startTop + 'px';
    shezhiJS.style.transform = 'none';
    shezhiJS.style.cursor = 'move';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    shezhiJS.style.left = (startLeft + deltaX) + 'px';
    shezhiJS.style.top = (startTop + deltaY) + 'px';
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    shezhiJS.style.cursor = '';
});
    return shezhiJS;
}

const SHEZHI = document.querySelector('.SHEZHI');
const shezhiAnniu = document.getElementById('shezhi');
shezhiAnniu.addEventListener('click', () => {
  SHEZHI.appendChild(Shezhi());
  fetch('/api/getuserinfor')
    .then(res => res.json())
    .then(data => {
      document.querySelector('.gaiming').value = data.name;
    });
  bindRadioEvents();
  bindGaimingEvent();
  bindTouxiangEvent();
  bindBgEvent();
});
// 检查当前用户是否是审核员
async function checkShenheyuanStatus() {
    try {
        const response = await fetch('/api/check_shenheyuan');
        const data = await response.json();
        
        const shenqing = document.querySelector('.shenqing');
        const shenhe = document.querySelector('.shenhe');
        
        if (data.is_shenheyuan) {
            // 是审核员：隐藏申请，显示审核入口
            if (shenqing) shenqing.style.display = 'none';
            if (shenhe) shenhe.style.display = 'inline-block';
        } else {
            // 不是审核员：显示申请，隐藏审核入口
            if (shenqing) shenqing.style.display = 'inline-block';
            if (shenhe) shenhe.style.display = 'none';
        }
    } catch (error) {
        console.error('检查审核员状态失败:', error);
        // 默认显示申请入口
        document.querySelector('.shenqing').style.display = 'inline-block';
        document.querySelector('.shenhe').style.display = 'none';
    }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
  checkShenheyuanStatus();
  loadUserAvatar();
});