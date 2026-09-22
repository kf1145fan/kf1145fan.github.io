/**
 * 统一 /admin 管理后台。
 * - 三个独立标签页：管理文章（默认首页）/ 添加新文章 / 评论管理
 * - Waline 简洁风格（深色顶栏 + 白底内容 + 橙色强调）
 * - 通过 Waline 管理员账号登录（POST /waline/api/token），登录态持久化
 * - 写作使用 Vditor Markdown 编辑器，进入写文章页时自动初始化
 * - 评论管理与 Waline 一致：全部 / 待审批 / 已通过 / 垃圾 筛选 + 通过/垃圾/删除
 */

const VDIRTOR_CSS = "https://cdn.jsdelivr.net/npm/vditor@3.11.1/dist/index.css";
const VDIRTOR_JS = "https://cdn.jsdelivr.net/npm/vditor@3.11.1/dist/index.min.js";
const WALINE_LOGO = "https://waline.js.org/logo.png";

const STYLE = `
*{box-sizing:border-box}
body{margin:0;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',Helvetica,Arial,sans-serif;background:#f5f6f8;color:#24292f}
a{color:#f97316;text-decoration:none}
/* Waline 风格顶栏 */
.wk-nav{background:#1e293b;height:52px;display:flex;align-items:center;padding:0 20px}
.wk-nav .inner{max-width:1080px;margin:0 auto;width:100%;display:flex;align-items:center;gap:16px}
.wk-nav .brand{display:flex;align-items:center;gap:10px;color:#fff;font-size:15px;font-weight:600;cursor:pointer}
.wk-nav .brand img{width:26px;height:26px;filter:brightness(0) invert(1)}
.wk-nav .brand a{color:#fff;text-decoration:none}
.wk-nav .spacer{flex:1}
.wk-nav .user{color:#cbd5e1;font-size:13px}
.wk-nav .logout{color:#94a3b8;font-size:13px;cursor:pointer;border:1px solid #475569;padding:5px 12px;border-radius:6px;background:transparent}
.wk-nav .logout:hover{color:#fff;border-color:#94a3b8}
/* 内容容器 */
.wk-wrap{max-width:1080px;margin:16px auto;padding:0 20px}
/* 标签页 */
.wk-tabs{display:flex;gap:2px;max-width:1080px;margin:20px auto 0;padding:0 20px}
.wk-tab{padding:9px 22px;font-size:14px;border:none;background:transparent;color:#57606a;cursor:pointer;border-radius:8px 8px 0 0;border-bottom:2px solid transparent}
.wk-tab.active{color:#f97316;border-bottom-color:#f97316;font-weight:600}
.wk-tab:hover{color:#24292f}
/* 卡片 */
.wk-card{background:#fff;border:1px solid #e6e8eb;border-radius:10px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.wk-card+.wk-card{margin-top:16px}
.wk-title{font-size:15px;font-weight:600;color:#24292f;margin:0 0 16px;padding-bottom:10px;border-bottom:1px solid #f1f2f4}
/* 表单 */
.wk-label{font-size:13px;color:#57606a;margin:10px 0 5px;display:block}
.wk-input{width:100%;border:1px solid #d0d7de;border-radius:6px;padding:8px 12px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#24292f}
.wk-input:focus{border-color:#f97316;box-shadow:0 0 0 3px rgba(249,115,22,.12)}
.wk-row{display:flex;gap:12px}
.wk-row>.wk-field{flex:1}
/* 按钮 */
.wk-btn{background:#f97316;color:#fff;border:none;border-radius:6px;padding:9px 18px;font-size:14px;cursor:pointer;font-weight:500}
.wk-btn:hover{background:#ea580c}
.wk-btn.ghost{background:transparent;color:#57606a;border:1px solid #d0d7de}
.wk-btn.ghost:hover{background:#f6f8fa;color:#24292f}
.wk-btn.act{background:#1e293b;color:#fff;border:none}
.wk-btn.act:hover{background:#334155}
.wk-btn.danger{background:transparent;color:#cf222e;border:1px solid #ffd7d9}
.wk-btn.danger:hover{background:#ffebe9}
.wk-btn:disabled{opacity:.5;cursor:not-allowed}
.wk-btn.sm{padding:5px 12px;font-size:12px;border-radius:5px}
/* 列表 */
.wk-list{list-style:none;margin:0;padding:0}
.wk-list li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 6px;border-bottom:1px solid #f1f2f4}
.wk-list li:last-child{border-bottom:none}
.wk-list .name{font-size:14px;font-weight:600;color:#24292f}
.wk-list .meta{font-size:12px;color:#8b949e;margin-top:2px}
.wk-list .ops{display:flex;gap:8px;flex-shrink:0}
.wk-count{display:inline-block;background:#e8edf2;color:#57606a;font-size:12px;border-radius:10px;padding:1px 9px;margin-left:8px;vertical-align:middle}
/* 评论条目 */
.wk-comment{display:flex;gap:12px;padding:14px 6px;border-bottom:1px solid #f1f2f4}
.wk-comment:last-child{border-bottom:none}
.wk-comment .avatar{width:40px;height:40px;border-radius:50%;background:#eaeef2;flex-shrink:0;overflow:hidden}
.wk-comment .avatar img{width:100%;height:100%;object-fit:cover}
.wk-comment .nick{font-size:14px;font-weight:600;color:#24292f}
.wk-comment .mail{font-size:12px;color:#8b949e;margin-left:6px}
.wk-comment .path{font-size:12px;color:#8b949e;margin-left:8px;word-break:break-all}
.wk-comment .time{font-size:12px;color:#8b949e;margin-left:8px}
.wk-comment .body{margin-top:4px;font-size:14px;color:#24292f;word-break:break-word}
.wk-comment .status{display:inline-block;font-size:11px;padding:1px 8px;border-radius:10px;margin-left:8px;vertical-align:middle}
.wk-comment .status.waiting{background:#fff8c5;color:#9a6700}
.wk-comment .status.approved{background:#dafbe1;color:#1a7f37}
.wk-comment .status.spam{background:#ffebe9;color:#cf222e}
.wk-comment .ops{margin-top:6px;display:flex;gap:8px}
.wk-comment .ip{font-size:11px;color:#afb8c1;margin-left:4px}
/* 登录页 */
.wk-login{max-width:400px;margin:80px auto;background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,.06)}
.wk-login .logo{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:8px}
.wk-login .logo img{height:40px}
.wk-login h1{font-size:18px;text-align:center;margin:0 0 4px;color:#24292f}
.wk-login .sub{text-align:center;color:#8b949e;font-size:13px;margin-bottom:24px}
.wk-login .msg{font-size:13px;min-height:20px;margin-top:12px;white-space:pre-wrap}
#edt{min-height:420px;border:1px solid #d0d7de;border-radius:6px}
.hidden{display:none}
.badge{padding:2px 10px;border-radius:10px;font-size:12px}
.badge.new{background:#dafbe1;color:#1a7f37}
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:12px}
.empty{color:#8b949e;text-align:center;padding:32px 0;font-size:14px}
.filters{display:flex;gap:8px;flex-wrap:wrap}
.filters .wk-btn{padding:5px 14px;font-size:12px;border-radius:6px}
.filters .wk-btn.ghost{border:1px solid #d0d7de}
.filters .wk-btn.act{border:1px solid #1e293b}
`;

const SCRIPT = `
const API_BASE = '/admin/api';
const storage = {
  get: k => { try { return localStorage.getItem(k)||sessionStorage.getItem(k)||'' } catch(e){ return '' } },
  set: (k,v) => { try { localStorage.setItem(k,v) } catch(e){} }
};
let token = '';   // waline JWT
let loginEmail = '';
let editor = null;
let editingPath = ''; // 当前编辑的文章路径
let editorInited = false;

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const api = async (url, opt={}) => {
  const h = Object.assign({'Content-Type':'application/json'}, opt.headers||{});
  if (token) h['Authorization'] = 'Bearer ' + token;
  const r = await fetch(url, Object.assign({}, opt, {headers:h}));
  let d = null; try { d = await r.json(); } catch(e){}
  return { ok: r.ok, status: r.status, data: d };
};

function toast(msg, ok){
  const el = $('#msg'); if(!el) return;
  el.style.display='block';
  el.style.color = ok===false ? '#cf222e' : '#1a7f37';
  el.textContent = msg;
  setTimeout(()=>{ if(el) el.style.display='none'; }, 4000);
}

// ---------- 登录 ----------
async function doLogin(){
  const email = $('#email').value.trim();
  const pass = $('#pass').value;
  if(!email || !pass) return;
  $('#loginBtn').disabled = true; $('#loginMsg').textContent='登录中...';
  const r = await fetch('/waline/api/token', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});
  const d = await r.json().catch(()=>({}));
  $('#loginBtn').disabled = false;
  if(d.errno!==0 || !d.data || d.data.type!=='administrator'){
    $('#loginMsg').textContent = d.errmsg || '登录失败，请使用管理员账号';
    $('#loginMsg').style.color='#cf222e';
    if(d.data && d.data['2fa']) { $('#twofa').value=''; $('#twofaWrap').style.display='block'; }
    return;
  }
  token = d.data.token; loginEmail = d.data.email;
  storage.set('TOKEN', token); storage.set('WALINE_EMAIL', email);
  enterApp(d.data.display_name || '管理员');
}
async function doLogin2fa(){
  const code = $('#twofa').value.trim();
  if(!/^\\d{6}$/.test(code)) { $('#loginMsg').textContent='请输入 6 位验证码'; return; }
  const email = $('#email').value.trim(); const pass = $('#pass').value;
  const r = await fetch('/waline/api/token', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass,code})});
  const d = await r.json().catch(()=>({}));
  if(d.errno!==0 || !d.data || d.data.type!=='administrator'){
    $('#loginMsg').textContent = d.errmsg || '登录失败'; $('#loginMsg').style.color='#cf222e'; return;
  }
  token = d.data.token; loginEmail = d.data.email;
  storage.set('TOKEN', token); storage.set('WALINE_2FA', '1');
  enterApp(d.data.display_name || '管理员');
}
async function tryAutoLogin(){
  const saved = storage.get('TOKEN');
  if(!saved) return false;
  const r = await fetch('/waline/api/token', {headers:{Authorization:'Bearer '+saved}});
  const d = await r.json().catch(()=>({}));
  if(d.errno===0 && d.data && d.data.type==='administrator'){
    token = saved; loginEmail = d.data.email;
    enterApp(d.data.display_name||'管理员'); return true;
  }
  return false;
}
function enterApp(name){
  $('#loginView').classList.add('hidden');
  $('#navView').classList.remove('hidden');
  $('#appView').classList.remove('hidden');
  $('#userName').textContent = name || loginEmail || '管理员';
  switchTab('manage');
}
function logout(){ token=''; try{ localStorage.removeItem('TOKEN'); }catch(e){} location.reload(); }

// ---------- tab ----------
function showPage(name){
  $$('.wk-page').forEach(p=>p.classList.toggle('hidden', p.id!=='page-'+name));
}
function switchTab(name){
  $$('.wk-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  showPage(name);
  if(name==='manage') loadPosts();
  if(name==='write') ensureEditor();
  if(name==='comments') loadComments();
}

// ---------- 管理文章 ----------
async function loadPosts(){
  const list = $('#postList'); if(!list) return;
  list.innerHTML = '<li class="empty">加载中...</li>';
  const r = await api(API_BASE+'/posts');
  if(!r.ok){ list.innerHTML = '<li class="empty">加载失败：'+(r.data&&r.data.error||r.status)+'</li>'; return; }
  const posts = (r.data.posts||[]).slice().reverse();
  if(!posts.length){ list.innerHTML='<li class="empty">还没有文章，点击上方「添加新文章」开始写作</li>'; return; }
  list.innerHTML = '';
  posts.forEach(p=>{
    const li = document.createElement('li');
    const name = (p.name||'').replace(/\\.md$/,'');
    li.innerHTML = '<div><div class="name">'+esc(name)+'</div><div class="meta">'+esc(p.path)+'</div></div>' +
      '<div class="ops">' +
      '<button class="wk-btn ghost sm" data-a="edit" data-path="'+esc(p.path)+'">编辑</button>' +
      '<button class="wk-btn danger sm" data-a="del" data-path="'+esc(p.path)+'" data-name="'+esc(name)+'">删除</button>' +
      '</div>';
    list.appendChild(li);
  });
}
function onListClick(e){
  const btn = e.target.closest('button'); if(!btn) return;
  const path = btn.dataset.path, name = btn.dataset.name;
  if(btn.dataset.a==='edit'){ openEdit(path); }
  if(btn.dataset.a==='del'){ delPost(path, name); }
}
async function openEdit(path){
  editingPath = path;
  const r = await api(API_BASE+'/post?path='+encodeURIComponent(path));
  if(!r.ok){ toast('加载失败 '+r.status,'err'); return; }
  const p = r.data.post || {};
  $('#title').value = p.title || '';
  $('#date').value = (p.date||new Date().toISOString().slice(0,10)).slice(0,10);
  $('#tags').value = (p.tags||[]).join('，');
  $('#categories').value = (p.categories||[]).join('，');
  $('#editorTitle').textContent = '编辑文章：' + (p.title || nameOf(p.path));
  $('#saveBtn').textContent = '保存修改';
  preserveValue(p.body || '');
  showPage('write');
  ensureEditor();
  window.scrollTo(0,0);
}
function nameOf(path){ return String(path||'').split('/').pop().replace(/\\.md$/,'') || '未命名'; }
function newArticle(){
  editingPath='';
  $('#title').value=''; $('#date').value=new Date().toISOString().slice(0,10); $('#tags').value=''; $('#categories').value='';
  $('#editorTitle').textContent='发布新文章';
  $('#saveBtn').textContent='发布文章';
  preserveValue('');
  showPage('write');
  ensureEditor();
  window.scrollTo(0,0);
}
function backToManage(){ showPage('manage'); loadPosts(); }
// 供 openEdit/newArticle 在切换 tab 后填入 Vditor
let pendingEditorValue = '';
function preserveValue(v){ pendingEditorValue = v || ''; }
async function savePost(){
  const title = $('#title').value.trim();
  const content = editor ? editor.getValue() : '';
  if(!title){ toast('请填写标题','err'); return; }
  if(!content.trim()){ toast('请填写正文','err'); return; }
  const body = {
    title,
    content,
    date: $('#date').value||new Date().toISOString().slice(0,10),
    tags: $('#tags').value.split(/[,，\\s]+/).map(s=>s.trim()).filter(Boolean),
    categories: $('#categories').value.split(/[,，\\s]+/).map(s=>s.trim()).filter(Boolean),
  };
  if(editingPath) body.path = editingPath;
  const isUpd = !!editingPath;
  $('#saveBtn').disabled=true; $('#saveBtn').textContent='提交中...';
  const r = await api(API_BASE+'/post', {method: isUpd?'PUT':'POST', body:JSON.stringify(body)});
  $('#saveBtn').disabled=false; $('#saveBtn').textContent = isUpd?'保存修改':'发布文章';
  if(r.ok && r.data && r.data.ok){
    toast(isUpd?'保存成功，工作流将重建站点':'发布成功，工作流将重建站点');
    switchTab('manage'); loadPosts();
  } else {
    toast('保存失败：'+(r.data&&r.data.error||r.status),'err');
  }
}
async function delPost(path, name){
  if(!confirm('确认删除文章「'+name+'」？此操作会提交到 GitHub，工作流将重建站点。')) return;
  const r = await api(API_BASE+'/post?path='+encodeURIComponent(path), {method:'DELETE'});
  if(r.ok && r.data && r.data.ok){ toast('已删除'); loadPosts(); }
  else toast('删除失败：'+(r.data&&r.data.error||r.status),'err');
}

// ---------- Vditor 编辑器（参考 cp.802213.xyz）----------
function ensureEditor(){
  // 每次进入写文章页即初始化/聚焦，保证可直接输入
  if(!window.Vditor){ setTimeout(()=>ensureEditor(), 250); return; }
  if(!editorInited){
    initEditor(pendingEditorValue);
  } else if(editor){
    // 仅当有明确的待填值（打开/新建文章）才覆盖编辑器，避免清空正在输入的正文
    if(pendingEditorValue !== '' && editor.getValue()!==pendingEditorValue){
      editor.setValue(pendingEditorValue);
    }
    pendingEditorValue='';
    try{ editor.focus(); }catch(e){}
  }
}
function initEditor(value){
  const options = {
    height: 500,
    value: value || '',
    lang: 'zh-CN',
    mode: 'wysiwyg',                  // 所见即所得（与 ld246.com 官方默认一致，可切换分屏/即时渲染）
    theme: 'classic',
    icon: 'ant',
    outline: true,
    cache: { enable: false },
    preview: {
      mode: 'both',
      delay: 500,
      hljs: { lineNumber: true, style: 'github' },
      markdown: { toc: true, mark: true, math: true, codeBlockPreview: true, at: true, gfmAutoLink: true },
      tex: { inline: true, display: true },
      theme: { current: 'light', list: {}, path: 'https://cdn.jsdelivr.net/npm/vditor@3.11.1/dist/css/content-theme' }
    },
    previewTheme: 'light',
    toolbarConfig: { pin: true },
    toolbar: [
      'emoji','headings','bold','italic','strike','link','|',
      'list','ordered-list','check','outdent','indent','|',
      'quote','line','code','inline-code','insert-before','insert-after','|',
      'table','undo','redo','|','upload','record','|',
      'edit-mode','both','preview','fullscreen','outline','export'
    ],
    upload: { fieldName: 'file', max: 5, encoding: 'base64', insertTo: 2, linkToImgUrl: true },
    after: () => { editorInited = true; pendingEditorValue=''; }
  };
  editor = new Vditor('edt', options);
}

// ---------- 评论管理 ----------
let commentFilter = 'all';
function setCommentFilter(f){
  commentFilter = f;
  $$('#commentFilter .wk-btn').forEach(b=>b.classList.toggle('act', b.dataset.f===f));
  loadComments();
}
async function loadComments(){
  const box = $('#commentList'); if(!box) return;
  box.innerHTML = '<div class="empty">加载中...</div>';
  const qs = 'type=list&page=1&pageSize=100';
  const statusParam = commentFilter==='all'?'':('&status='+commentFilter);
  const r = await api('/waline/api/comment?'+qs+statusParam);
  if(r.status===401||r.status===403){ box.innerHTML='<div class="empty">无权限（需要管理员账号）</div>'; return; }
  const data = (r.data && r.data.data) || {};
  const items = data.data || [];
  if(!items.length){ box.innerHTML='<div class="empty">暂无评论</div>'; return; }
  box.innerHTML='';
  items.forEach(it=>{
    const el = document.createElement('div');
    el.className = 'wk-comment';
    const st = it.status==='approved'?'<span class="status approved">已通过</span>':(it.status==='spam'?'<span class="status spam">垃圾</span>':'<span class="status waiting">待审批</span>');
    const time = it.insertedAt ? new Date(it.insertedAt).toLocaleString('zh-CN',{hour12:false}) : '';
    let ops = '';
    if(it.status!=='approved') ops += '<button class="wk-btn sm" data-a="approve">通过</button>';
    if(it.status!=='spam') ops += '<button class="wk-btn act sm" data-a="spam">垃圾</button>';
    ops += '<button class="wk-btn danger sm" data-a="del">删除</button>';
    el.innerHTML = '<div class="avatar">'+(it.avatar?'<img src="'+esc(it.avatar)+'">':'')+'</div>'+
      '<div style="flex:1">'+
        '<div><span class="nick">'+esc(it.nick)+'</span><span class="mail">'+esc(it.mail||'')+'</span><span class="ip">'+esc(it.ip||'')+'</span><span class="path">'+esc(it.url||'')+'</span><span class="time">'+esc(time)+'</span>'+st+'</div>'+
        '<div class="body">'+ (it.comment||'') +'</div>'+
        '<div class="ops">'+ops+'</div>'+
      '</div>';
    el.dataset.id = it.objectId;
    box.appendChild(el);
  });
}
async function onCommentAction(e){
  const btn = e.target.closest('button'); if(!btn) return;
  const card = btn.closest('.wk-comment'); if(!card) return;
  const id = card.dataset.id; const a = btn.dataset.a; if(!id) return;
  if(a==='del'){ if(!confirm('确认删除该评论？')) return; }
  if(a==='approve'||a==='spam'){
    const status = a==='approve'?'approved':'spam';
    const r = await api('/waline/api/comment/'+id, {method:'PUT', body:JSON.stringify({status})});
    if(r.ok) loadComments(); else toast('操作失败','err');
  } else if(a==='del'){
    const r = await api('/waline/api/comment/'+id, {method:'DELETE'});
    if(r.ok) loadComments(); else toast('操作失败','err');
  }
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', ()=>{
  $('#loginBtn').onclick = doLogin;
  $('#twofaBtn').onclick = doLogin2fa;
  $('#loginView #email').addEventListener('keydown', e=>{ if(e.key==='Enter') $('#pass').focus(); });
  $('#loginView #pass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  $('#logoutBtn').onclick = logout;
  $('#saveBtn').onclick = savePost;
  $('#postList').addEventListener('click', onListClick);
  $('#commentList').addEventListener('click', onCommentAction);
  $$('#commentFilter .wk-btn').forEach(b=>b.onclick=()=>setCommentFilter(b.dataset.f));
  $$('.wk-tab').forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));
  const saved = storage.get('WALINE_EMAIL');
  if(saved) $('#email').value = saved;
  tryAutoLogin().catch(()=>{});
});
`;

export function renderAdminPage(siteUrl: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>博客管理后台</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="${VDIRTOR_CSS}">
<style>${STYLE}</style>
</head>
<body>
<!-- 顶栏 -->
<nav class="wk-nav hidden" id="navView">
  <div class="inner">
    <div class="brand">
      <img src="${WALINE_LOGO}" alt="">
      <span>博客后台</span>
    </div>
    <div class="spacer"></div>
    ${siteUrl ? '<a class="logout" href="' + siteUrl + '" target="_blank">查看站点</a>' : ''}
    <span class="user" id="userName"></span>
    <button class="logout" id="logoutBtn">退出</button>
  </div>
</nav>

<!-- 登录视图 -->
<div id="loginView">
  <div class="wk-login">
    <div class="logo"><img src="${WALINE_LOGO}" alt=""></div>
    <h1>博客管理后台</h1>
    <div class="sub">使用 Waline 管理员账号登录</div>
    <label class="wk-label">邮箱</label>
    <input class="wk-input" id="email" placeholder="admin@example.com" autocomplete="email">
    <label class="wk-label">密码</label>
    <input class="wk-input" type="password" id="pass" placeholder="••••••••" autocomplete="current-password">
    <div id="twofaWrap" class="hidden">
      <label class="wk-label">两步验证码</label>
      <input class="wk-input" id="twofa" placeholder="6 位验证码">
      <div class="toolbar" style="justify-content:flex-end;margin-top:6px"><button class="wk-btn sm" id="twofaBtn">提交</button></div>
    </div>
    <div class="msg" id="loginMsg" style="color:#cf222e"></div>
    <div style="margin-top:6px"><button class="wk-btn" id="loginBtn" style="width:100%">登录</button></div>
  </div>
</div>

<!-- 应用视图（导航 + 内容） -->
<div id="appView" class="hidden">
  <div class="wk-tabs">
    <button class="wk-tab active" data-tab="manage">管理文章</button>
    <button class="wk-tab" data-tab="comments">评论管理</button>
  </div>
  <div class="wk-wrap">

    <!-- 管理文章（默认首页） -->
    <div id="page-manage" class="wk-page">
      <div class="wk-card">
        <div class="toolbar" style="justify-content:space-between;align-items:center">
          <h3 class="wk-title" style="margin:0;border:none;padding:0">已有文章</h3>
          <button class="wk-btn sm" id="newBtn2" onclick="newArticle()">＋ 添加新文章</button>
        </div>
        <ul class="wk-list" id="postList"><li class="empty">加载中...</li></ul>
      </div>
    </div>

    <!-- 添加新文章 -->
    <div id="page-write" class="wk-page hidden">
      <div class="wk-card">
        <div class="toolbar" style="justify-content:space-between;align-items:center">
          <h3 class="wk-title" style="margin:0;border:none;padding:0" id="editorTitle">发布新文章</h3>
          <div style="display:flex;gap:8px">
            <button class="wk-btn ghost sm" onclick="backToManage()">← 返回管理文章</button>
            <button class="wk-btn ghost sm" onclick="newArticle()">清空重写</button>
          </div>
        </div>
        <label class="wk-label">标题</label>
        <input class="wk-input" id="title" placeholder="文章标题">
        <div class="wk-row">
          <div class="wk-field"><label class="wk-label">日期</label><input class="wk-input" type="date" id="date"></div>
          <div class="wk-field"><label class="wk-label">分类（逗号或顿号分隔）</label><input class="wk-input" id="categories" placeholder="如：技术、随笔"></div>
          <div class="wk-field"><label class="wk-label">标签（逗号或顿号分隔）</label><input class="wk-input" id="tags" placeholder="如：Cloudflare、前端"></div>
        </div>
        <label class="wk-label">正文（Markdown）</label>
        <div id="edt"></div>
        <div class="toolbar" style="justify-content:flex-end;margin-top:14px">
          <button class="wk-btn" id="saveBtn">发布文章</button>
        </div>
        <div class="msg" id="msg" style="display:none"></div>
      </div>
    </div>

    <!-- 评论管理 -->
    <div id="page-comments" class="wk-page hidden">
      <div class="wk-card">
        <div class="toolbar" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <h3 class="wk-title" style="margin:0;border:none;padding:0">评论管理</h3>
          <div id="commentFilter" class="filters">
            <button class="wk-btn act sm" data-f="all">全部</button>
            <button class="wk-btn ghost sm" data-f="waiting">待审批</button>
            <button class="wk-btn ghost sm" data-f="approved">已通过</button>
            <button class="wk-btn ghost sm" data-f="spam">垃圾</button>
          </div>
        </div>
        <div id="commentList"><div class="empty">切换到此页加载评论</div></div>
      </div>
    </div>

  </div>
</div>

<script>
${SCRIPT}
</script>
<script src="${VDIRTOR_JS}"></script>
</body>
</html>`;
}