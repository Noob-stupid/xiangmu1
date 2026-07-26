let currentShenheId = null;
const OK = document.getElementById('ok')
const NO = document.getElementById('no')
const re = document.getElementById('re')
OK.addEventListener('click', () => {
  const OKclass = document.querySelector('.Btngo')
  OKclass.style.backgroundColor = 'green'
  NO.style.display='none'
  const tongguo = document.querySelector('.tongguo')
  tongguo.style.display = 'block'
})
NO.addEventListener('click', () => {
  const NOclass = document.querySelector('.Btnstop')
  NOclass.style.backgroundColor = 'red'
  OK.style.display='none'
  const STOP = document.querySelector('.STOP')
  STOP.style.display = 'block'
})
re.addEventListener('click', () => {
  const OKclass = document.querySelector('.Btngo')
  const tongguo = document.querySelector('.tongguo')
  const NOclass = document.querySelector('.Btnstop')
  const STOP = document.querySelector('.STOP')
  NO.style.display = ''
  NO.style.display=''
  OK.style.display=''
  OK.style.display = ''
  OKclass.style.backgroundColor = ''
  NOclass.style.backgroundColor = ''
  tongguo.style.display = ''
  STOP.style.display = ''
})
const videoNOAI = document.getElementById('videoNOAI')
fetch('/api/videosNOAI')
  .then(response => response.json())
  .then(data => {
    console.log('获取到的视频数据:', data);
        
        // 设置视频源
    if (data.video) {
          currentShenheId = data.video[0].id;
          videoNOAI.src = data.video[0].zuopin_url;
        }
  })


const form = document.getElementById('myForm');
form.addEventListener('submit', function (e) {
  // 阻止页面刷新/跳转
  e.preventDefault();


  // 构造表单数据
  const formData = new FormData(form);
const firstags=document.querySelector('.tags span')
if (firstags) {
  formData.append('tag', firstags.textContent);
  }
  formData.append('shenhe_id', currentShenheId);
  // 发送请求（页面不动）
  fetch('/tongguo_video', {
    method: 'POST',
    body: formData
  }).then(res => res.json())
    .then(data => {
      console.log('提交成功', data)
      alert('审核提交完成！')
      location.reload()
    })
})
const labelselect = document.getElementById('labelselect')
labelselect.addEventListener('change', () => {
  const label = labelselect.value
  const oldLabeltags = document.querySelector('.labeltags')
  if (oldLabeltags) {
    oldLabeltags.remove()
  }
  const labeltags = document.createElement('div')
  fetch(`/biaoqian?label=${label}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        console.log('获取到的标签:', data.tags)
        labeltags.className = 'labeltags'
        labeltags.innerHTML=``
        data.tags.forEach(tags=> {
          labeltags.innerHTML += `
        <div><span class="tagspan">${tags}</span></div>`
        });
      }//设置点击标签会有触碰反应，并且给视频赋予标签！！！！，提交时video赋予标签（只存储一个主标签#修改下数据库）属性
      document.querySelector('.tongguo').appendChild(labeltags)
  })
})
function removeTag(text) {
    const spans = document.querySelectorAll('.tags span');
    spans.forEach(span => {
        if (span.textContent === text) span.remove();
    });
}
const container = document.querySelector('.tongguo')
container.addEventListener('click', (e) => {
  const target = e.target
  if (!target.classList.contains('tagspan')) return;
  if (target.style.backgroundColor == "gray") {
    target.style.backgroundColor = ""
    removeTag(target.textContent)
  }
  else {
    target.style.backgroundColor = "gray"
    const tags1 = document.createElement('span')
    tags1.innerHTML += `${target.textContent}`
    document.querySelector('.tags').appendChild(tags1)
  }
})
// 确认不通过按钮
const confirmReject = document.getElementById('confirmReject');
confirmReject.addEventListener('click', () => {
    if (!currentShenheId) {
        alert('没有可审核的视频');
        location.reload();  // 没有视频时直接刷新
        return;
    }
    const reason = document.getElementById('rejectReason').value;
    const formData = new FormData();
    formData.append('shenhe_id', currentShenheId);
    if (reason) {
        formData.append('reason', reason);
    }
    
    fetch('/reject_video', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('已拒绝，加载下一个视频');
        } else {
            alert('操作失败: ' + data.error);
        }
        location.reload();  // 无论成功失败都刷新
    })
    .catch(err => {
        console.error('拒绝失败:', err);
        alert('操作失败，请重试');
        location.reload();
    });
});

