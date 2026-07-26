const button=document.querySelector('.buttonchakan').addEventListener('click', () => {
  const shoucang = document.getElementById('shoucang')
  qingkong(); shoucang.style.backgroundColor = "yellow";
  shoucang.style.border = "1.5px solid gray"; 
})
const button2=document.querySelector('.buttonchakan2').addEventListener('click', () => {
  const dianzan = document.getElementById('dianzan')
  qingkong(); dianzan.style.backgroundColor = "pink";
  dianzan.style.border = "1.5px solid gray"; 
})
const button3=document.querySelector('.buttonchakan3').addEventListener('click', () => {
  const dianzan = document.getElementById('lishi')
  qingkong(); dianzan.style.backgroundColor = "rgba(11,123,101,0.5)";
  dianzan.style.border = "1.5px solid gray"; 
})
const zhuye = document.getElementById('zhuye');
zhuye.style.backgroundColor = "rgba(217, 137, 39, 0.5)";
zhuye.style.border = "1.5px solid gray";
// 悬浮窗控制
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('togglePanelBtn');
    const panel = document.getElementById('floatingPanel');
    const closeBtn = document.getElementById('closePanelBtn');
    
    // 点击按钮显示/隐藏面板
    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        panel.classList.toggle('show');
    });
    
    // 点击关闭按钮隐藏面板
    closeBtn.addEventListener('click', function() {
        panel.classList.remove('show');
    });
    
    // 点击面板外部关闭
    document.addEventListener('click', function(e) {
        if (!panel.contains(e.target) && !toggleBtn.contains(e.target)) {
            panel.classList.remove('show');
        }
    });
    
    // 防止点击面板内部时关闭
    panel.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});