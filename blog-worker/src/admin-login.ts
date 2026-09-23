/**
 * 独立登录页：/admin/login
 * 登录成功后写入 Cookie(wl_token) + localStorage(TOKEN)，跳转 /admin。
 * 与后台页分离，服务端根据 Cookie 直接渲染对应页面，避免刷新闪登录。
 */

const LOGIN_STYLE = `
:root{color-scheme:light dark;--accent:#f97316;--accent-h:#ea580c}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;font:13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',Helvetica,Arial,sans-serif;
background:var(--bg,#f7f7f8);color:var(--fg,#1f2328);display:flex;align-items:center;justify-content:center;padding:16px}
@media(prefers-color-scheme:dark){body{--bg:#141414;--fg:#e6e6e6;--card:#1c1c1c;--border:#333;--muted:#a6a6a6;--input-bg:#222;--input-fg:#f2f2f2}}
body{--card:#fff;--border:#e2e2e3;--muted:#6b7280;--input-bg:#fff;--input-fg:#1f2328}
.card{width:100%;max-width:340px;background:var(--card);border:1px solid var(--border);border-radius:4px;padding:28px}
.brand{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.brand img{width:22px;height:22px}
h1{font-size:16px;margin:0;font-weight:600}
.sub{color:var(--muted);font-size:12px;margin:4px 0 20px}
label{font-size:12px;color:var(--muted);display:block;margin:12px 0 4px}
input{width:100%;padding:7px 10px;font:inherit;border:1px solid var(--border);border-radius:4px;background:var(--input-bg);color:var(--input-fg);outline:none}
input:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(249,115,22,.12)}
button{width:100%;margin-top:18px;padding:8px;font:inherit;font-weight:500;background:var(--accent);border:none;border-radius:4px;color:#fff;cursor:pointer}
button:hover{background:var(--accent-h)}
button:disabled{opacity:.5}
.msg{font-size:12px;color:#dc2626;min-height:18px;margin-top:10px;white-space:pre-wrap}
.hid{display:none}
.link{font-size:11px;color:var(--muted);text-align:right;margin-top:8px}
`;

const LOGIN_SCRIPT = `
const $=s=>document.querySelector(s);
(async function(){
  const saved = (()=>{try{return localStorage.getItem('TOKEN')||''}catch(e){return ''}})();
  if(saved){
    try{
      const r=await fetch('/waline/api/token',{headers:{Authorization:'Bearer '+saved}});
      const d=await r.json();
      if(d.errno===0&&d.data&&d.data.type==='administrator'){ location.replace('/admin'); return; }
    }catch(e){}
  }
  document.body.classList.remove('pending');
})();
function setMsg(t){ $('#msg').textContent=t||''; }
async function doLogin(){
  const email=$('#email').value.trim(), pass=$('#pass').value;
  if(!email||!pass){ setMsg('请输入邮箱和密码'); return; }
  $('#btn').disabled=true; $('#btn').textContent='登录中...'; setMsg('');
  const r=await fetch('/waline/api/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass,code:$('#code').value.trim()||undefined})});
  const d=await r.json().catch(()=>({}));
  if(d.errno!==0){
    $('#btn').disabled=false; $('#btn').textContent='登录';
    setMsg(d.errmsg||'登录失败');
    if(d.data&&d.data['2fa']) $('#twofaWrap').classList.remove('hid');
    return;
  }
  const tok=d.data.token;
  try{ localStorage.setItem('TOKEN',tok); }catch(e){}
  // 写 Cookie 供服务端 /admin 识别
  document.cookie='wl_token='+encodeURIComponent(tok)+';path=/;max-age=2592000;SameSite=Lax';
  setMsg('登录成功，跳转中...');
  location.replace('/admin');
}
document.addEventListener('DOMContentLoaded',()=>{
  $('#btn').onclick=doLogin;
  ['email','pass','code'].forEach(id=>{
    const el=$('#'+id);
    el.addEventListener('keydown',e=>{ if(e.key==='Enter') doLogin(); });
  });
});
`;

export function renderAdminLoginPage(siteUrl: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>登录 - 博客后台</title>
<style>${LOGIN_STYLE}</style>
</head>
<body>
<div class="card">
  <div class="brand">
    <img src="https://waline.js.org/logo.png" alt="">
    <h1>博客管理后台</h1>
  </div>
  <div class="sub">使用管理员账号登录</div>
  <label for="email">邮箱</label>
  <input id="email" autocomplete="email" placeholder="admin@example.com">
  <label for="pass">密码</label>
  <input id="pass" type="password" autocomplete="current-password" placeholder="••••••••">
  <div id="twofaWrap" class="hid">
    <label for="code">两步验证码</label>
    <input id="code" placeholder="6 位验证码">
  </div>
  <button id="btn">登录</button>
  <div class="msg" id="msg"></div>
  ${siteUrl ? '<div class="link"><a href="' + siteUrl + '">← 返回站点</a></div>' : ''}
</div>
<script>${LOGIN_SCRIPT}</script>
</body>
</html>`;
}