/**
 * 统一后台页：/admin（独立于登录页 /admin/login）。
 * - 无大圆角、简约、适配深色模式、字号偏小
 * - 顶部标签：管理文章（默认首页）/ 评论管理；写作页从「＋ 添加新文章」按钮进入
 * - 登录态：由服务端 Cookie(wl_token) 判定是否返回本页；本页加载时读取 token，
 *   无效则跳转 /admin/login，刷新不再闪登录界面
 * - 编辑器：Vditor「分屏复杂模式」（SV，参考 cp.802213.xyz）
 * - 评论管理：全部 / 待审批 / 已通过 / 垃圾 + 通过/垃圾/删除
 */

const VDIRTOR_CSS = "https://cdn.jsdelivr.net/npm/vditor@3.11.1/dist/index.css";
const VDIRTOR_JS = "https://cdn.jsdelivr.net/npm/vditor@3.11.1/dist/index.min.js";
const WALINE_LOGO = "https://waline.js.org/logo.png";

const STYLE = `
:root{color-scheme:light dark;--accent:#f97316;--accent-h:#ea580c;
--bg:#f7f7f8;--card:#fff;--fg:#1f2328;--muted:#6b7280;--border:#e3e3e4;--nav:#16181d;
--nav-fg:#e5e7eb;--nav-active:#ffffff;--hover:#f0f0f1;--input-bg:#fff;--danger:#dc2626}
@media(prefers-color-scheme:dark){:root{
--bg:#0f1115;--card:#181b20;--fg:#e8e8e8;--muted:#9ca3af;--border:#2b2f36;--nav:#0a0c10;
--nav-fg:#a3a3a3;--nav-active:#ffffff;--hover:#23272e;--input-bg:#14161a;--danger:#f87171}}
*{box-sizing:border-box}
body{margin:0;font:13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',Helvetica,Arial,sans-serif;background:var(--bg);color:var(--fg)}
a{color:var(--accent);text-decoration:none}
/* 顶栏 */
.wk-nav{background:var(--nav);height:46px;display:flex;align-items:center;padding:0 20px;position:sticky;top:0;z-index:10}
.wk-nav .inner{max-width:1080px;margin:0 auto;width:100%;display:flex;align-items:center;gap:14px}
.wk-nav .brand{display:flex;align-items:center;gap:8px;color:var(--nav-active);font-size:14px;font-weight:600}
.wk-nav .brand img{width:20px;height:20px;filter:brightness(0) invert(1)}
.wk-nav .spacer{flex:1}
.wk-nav .user{color:var(--nav-fg);font-size:12px}
.wk-nav .logout{color:var(--nav-fg);font-size:12px;cursor:pointer;border:1px solid var(--border);padding:3px 10px;border-radius:3px;background:transparent}
.wk-nav .logout:hover{color:var(--nav-active);border-color:var(--nav-fg)}
.wk-nav a.site{color:var(--nav-fg);font-size:12px}
.wk-nav a.site:hover{color:var(--nav-active)}
/* 标签页 */
.wk-tabs{display:flex;gap:0;max-width:1080px;margin:14px auto 0;padding:0 16px;border-bottom:1px solid var(--border)}
.wk-tab{padding:8px 16px;font-size:13px;border:none;background:transparent;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent}
.wk-tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}
.wk-tab:hover{color:var(--fg)}
/* 内容容器 */
.wk-wrap{max-width:1080px;margin:14px auto;padding:0 16px}
/* 卡片（无大圆角） */
.wk-card{background:var(--card);border:1px solid var(--border);border-radius:2px;padding:16px}
.wk-card+.wk-card{margin-top:12px}
.wk-title{font-size:14px;font-weight:600;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)}
/* 表单 */
.wk-label{font-size:12px;color:var(--muted);margin:8px 0 4px;display:block}
.wk-input{width:100%;border:1px solid var(--border);border-radius:3px;padding:6px 10px;font-size:13px;font-family:inherit;outline:none;background:var(--input-bg);color:var(--fg)}
.wk-input:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(249,115,22,.12)}
.wk-row{display:flex;gap:12px}
.wk-row>.wk-field{flex:1}
/* 按钮 */
.wk-btn{background:var(--accent);color:#fff;border:none;border-radius:3px;padding:7px 14px;font-size:13px;cursor:pointer;font-weight:500}
.wk-btn:hover{background:var(--accent-h)}
.wk-btn.ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
.wk-btn.ghost:hover{background:var(--hover);color:var(--fg)}
.wk-btn.act{background:var(--nav);color:var(--nav-active);border:none}
.wk-btn.act:hover{background:var(--hover);color:var(--fg)}
.wk-btn.danger{background:transparent;color:var(--danger);border:1px solid var(--border)}
.wk-btn.danger:hover{background:var(--hover)}
.wk-btn:disabled{opacity:.5;cursor:not-allowed}
.wk-btn.sm{padding:3px 10px;font-size:12px;border-radius:3px}
/* 列表 */
.wk-list{list-style:none;margin:0;padding:0}
.wk-list li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 6px;border-bottom:1px solid var(--border)}
.wk-list li:last-child{border-bottom:none}
.wk-list .name{font-size:13px;font-weight:500}
.wk-list .meta{font-size:11px;color:var(--muted);margin-top:1px}
.wk-list .ops{display:flex;gap:6px;flex-shrink:0}
/* 评论条目 */
.wk-comment{display:flex;gap:10px;padding:10px 6px;border-bottom:1px solid var(--border)}
.wk-comment:last-child{border-bottom:none}
.wk-comment .avatar{width:32px;height:32px;border-radius:3px;background:var(--hover);flex-shrink:0;overflow:hidden}
.wk-comment .avatar img{width:100%;height:100%;object-fit:cover}
.wk-comment .nick{font-size:13px;font-weight:600}
.wk-comment .mail{font-size:11px;color:var(--muted);margin-left:6px}
.wk-comment .path{font-size:11px;color:var(--muted);margin-left:8px;word-break:break-all}
.wk-comment .time{font-size:11px;color:var(--muted);margin-left:8px}
.wk-comment .body{margin-top:3px;font-size:13px;word-break:break-word}
.wk-comment .status{display:inline-block;font-size:10px;padding:0 6px;border-radius:2px;margin-left:8px;vertical-align:middle}
.wk-comment .status.waiting{background:#fff3cd;color:#8a6d00}
.wk-comment .status.approved{background:#d1f5d3;color:#147d19}
.wk-comment .status.spam{background:#fde3e3;color:#d1241f}
.wk-comment .ops{margin-top:4px;display:flex;gap:6px}
.wk-comment .ip{font-size:10px;color:var(--muted);margin-left:4px}
/* 编辑区 */
#edt{min-height:480px;border:1px solid var(--border);border-radius:3px}
.hidden{display:none}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.empty{color:var(--muted);text-align:center;padding:26px 0;font-size:13px}
.filters{display:flex;gap:6px;flex-wrap:wrap}
.filters .wk-btn{padding:3px 12px;font-size:12px;border-radius:3px}
.msg{font-size:12px;min-height:18px}.msg.err{color:var(--danger)}.msg.ok{color:#1a7f37}
@media(prefers-color-scheme:dark){.msg.ok{color:#4ade80}}
`;

const SCRIPT = `
const API_BASE = '/admin/api';
const storage = {
  get: k => { try { return localStorage.getItem(k)||sessionStorage.getItem(k)||'' } catch(e){ return '' } },
  set: (k,v) => { try { localStorage.setItem(k,v) } catch(e){} }
};
let token = '';
let editor = null;
let editorInited = false;
let editingPath = '';
let pendingEditorValue = '';
let editorReadyWait = 0;

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

function toast(msg, isErr){
  const el = $('#msg'); if(!el) return;
  el.textContent = msg;
  el.className = 'msg ' + (isErr ? 'err' : 'ok');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ if(el) el.textContent=''; }, 4000);
}

// 读取登录态：Cookie 或 localStorage；非法则跳登录页（由 /admin 服务端已保证 Cookie 存在）
function getToken(){
  const c = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('wl_token='));
  if (c) { try { return decodeURIComponent(c.slice('wl_token='.length)); } catch(e){} }
  return storage.get('TOKEN');
}

// ---------- tab ----------
function showPage(name){ $$('.wk-page').forEach(p=>p.classList.toggle('hidden', p.id!=='page-'+name)); }
function switchTab(name){
  $$('.wk-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  showPage(name);
  if(name==='manage') loadPosts();
  if(name==='comments') loadComments();
}

// ---------- 管理文章 ----------
async function loadPosts(){
  const list = $('#postList'); if(!list) return;
  list.innerHTML = '<li class="empty">加载中...</li>';
  const r = await api(API_BASE+'/posts');
  if(r.status===401){ redirectLogin(); return; }
  if(!r.ok){ list.innerHTML = '<li class="empty">加载失败：'+(r.data&&r.data.error||r.status)+'</li>'; return; }
  const posts = (r.data.posts||[]).slice().reverse();
  if(!posts.length){ list.innerHTML='<li class="empty">还没有文章，点右上角「＋ 添加新文章」开始写作</li>'; return; }
  list.innerHTML='';
  posts.forEach(p=>{
    const li=document.createElement('li');
    const name=(p.name||'').replace(/\\.md$/,'');
    li.innerHTML = '<div><div class="name">'+esc(name)+'</div><div class="meta">'+esc(p.path)+'</div></div>'+
      '<div class="ops">'+
      '<button class="wk-btn ghost sm" data-a="edit" data-path="'+esc(p.path)+'">编辑</button>'+
      '<button class="wk-btn danger sm" data-a="del" data-path="'+esc(p.path)+'" data-name="'+esc(name)+'">删除</button>'+
      '</div>';
    list.appendChild(li);
  });
}
function onListClick(e){
  const btn=e.target.closest('button'); if(!btn) return;
  const path=btn.dataset.path, name=btn.dataset.name;
  if(btn.dataset.a==='edit') openEdit(path);
  if(btn.dataset.a==='del') delPost(path,name);
}
async function openEdit(path){
  editingPath=path;
  const r=await api(API_BASE+'/post?path='+encodeURIComponent(path));
  if(r.status===401){ redirectLogin(); return; }
  if(!r.ok){ toast('加载失败 '+r.status,true); return; }
  const p=r.data.post||{};
  $('#title').value=p.title||'';
  $('#date').value=(p.date||new Date().toISOString().slice(0,10)).slice(0,10);
  $('#tags').value=(p.tags||[]).join('，');
  $('#categories').value=(p.categories||[]).join('，');
  $('#editorTitle').textContent='编辑：'+(p.title||nameOf(p.path));
  $('#saveBtn').textContent='保存修改';
  pendingEditorValue=p.body||'';
  showPage('write');
  initEditorOnce();
  window.scrollTo(0,0);
}
function nameOf(path){ return String(path||'').split('/').pop().replace(/\\.md$/,'')||'未命名'; }
function newArticle(){
  editingPath='';
  $('#title').value=''; $('#date').value=new Date().toISOString().slice(0,10); $('#tags').value=''; $('#categories').value='';
  $('#editorTitle').textContent='发布新文章';
  $('#saveBtn').textContent='发布文章';
  pendingEditorValue='';
  showPage('write');
  initEditorOnce();
  window.scrollTo(0,0);
}
function backToManage(){ showPage('manage'); loadPosts(); }

async function savePost(){
  const title=$('#title').value.trim();
  const content=editor?editor.getValue():'';
  if(!title){ toast('请填写标题',true); return; }
  if(!content.trim()){ toast('请填写正文',true); return; }
  const body={ title, content,
    date:$('#date').value||new Date().toISOString().slice(0,10),
    tags:$('#tags').value.split(/[,，\\s]+/).map(s=>s.trim()).filter(Boolean),
    categories:$('#categories').value.split(/[,，\\s]+/).map(s=>s.trim()).filter(Boolean) };
  if(editingPath) body.path=editingPath;
  const isUpd=!!editingPath;
  $('#saveBtn').disabled=true; $('#saveBtn').textContent='提交中...';
  const r=await api(API_BASE+'/post',{method:isUpd?'PUT':'POST',body:JSON.stringify(body)});
  $('#saveBtn').disabled=false; $('#saveBtn').textContent=isUpd?'保存修改':'发布文章';
  if(r.status===401){ redirectLogin(); return; }
  if(r.ok&&r.data&&r.data.ok){
    toast(isUpd?'保存成功，工作流将重建站点':'发布成功，工作流将重建站点');
    switchTab('manage');
  } else toast('保存失败：'+(r.data&&r.data.error||r.status),true);
}
async function delPost(path,name){
  if(!confirm('确认删除文章「'+name+'」？工作流将重建站点。')) return;
  const r=await api(API_BASE+'/post?path='+encodeURIComponent(path),{method:'DELETE'});
  if(r.status===401){ redirectLogin(); return; }
  if(r.ok&&r.data&&r.data.ok){ toast('已删除'); loadPosts(); }
  else toast('删除失败：'+(r.data&&r.data.error||r.status),true);
}

// ---------- Vditor「分屏复杂模式」----------
function initEditorOnce(){
  // 等待 Vditor 脚本就绪
  if(!window.Vditor){ if(++editorReadyWait<200) setTimeout(initEditorOnce,250); return; }
  if(!editorInited){ initEditor(); }
  else if(editor){
    if(pendingEditorValue!=='' && editor.getValue()!==pendingEditorValue){
      editor.setValue(pendingEditorValue);
    }
    pendingEditorValue='';
    try{ editor.focus(); }catch(e){}
  }
}
function initEditor(){
  const opts={
    height: 540,
    lang: 'zh-CN',
    mode: 'sv',                       // 分屏预览「复杂模式」（cp.802213.xyz）
    theme: window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'classic',
    icon: 'ant',
    outline: true,
    counter: { enable: true, type: 'text' },
    cache: { enable: false },
    preview: {
      delay: 300,
      hljs: { enable:true, lineNumber:false, style: window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'atom-one-dark':'github' },
      markdown: { toc:true, mark:true, math:true, codeBlockPreview:true, at:true, gfmAutoLink:true, footnotes:true },
      tex: { inline:true, display:true },
      theme: { current: window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light' }
    },
    previewTheme: window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',
    codeTheme: 'github',
    toolbarConfig: { pin: true, hide: false },
    toolbar: [
      'emoji','headings','bold','italic','strike','link','|',
      'list','ordered-list','check','outdent','indent','|',
      'quote','line','code','inline-code','table','|',
      'undo','redo','|','upload','record','|',
      'edit-mode','both','preview','fullscreen','outline','export','br'
    ],
    upload: { fieldName:'file', encoding:'base64', insertTo:2, linkToImgUrl:true },
    input: (v)=>{},
    after: ()=>{ editorInited=true; if(editor&&pendingEditorValue!==''){ editor.setValue(pendingEditorValue); pendingEditorValue=''; } }
  };
  try {
    editor = new Vditor('edt', opts);
    // 若 after 未触发，兜底延迟注入正文
    setTimeout(()=>{ if(editor&&pendingEditorValue!==''){ editor.setValue(pendingEditorValue); pendingEditorValue=''; } }, 800);
  } catch(e){
    console.error('Vditor init error:', e);
    $('#edt').innerHTML='<textarea id="edtFallback" style="width:100%;min-height:480px;"></textarea>';
    if(pendingEditorValue!==''){ const ta=document.querySelector('#edtFallback'); if(ta) ta.value=pendingEditorValue; pendingEditorValue=''; }
  }
}

// ---------- 评论管理 ----------
let commentFilter='all';
function setCommentFilter(f){
  commentFilter=f;
  $$('#commentFilter .wk-btn').forEach(b=>b.classList.toggle('act', b.dataset.f===f));
  loadComments();
}
async function loadComments(){
  const box=$('#commentList'); if(!box) return;
  box.innerHTML='<div class="empty">加载中...</div>';
  const statusParam=commentFilter==='all'?'':('&status='+commentFilter);
  const r=await api('/waline/api/comment?type=list&page=1&pageSize=100'+statusParam);
  if(r.status===401||r.status===403){ redirectLogin(); return; }
  const data=(r.data&&r.data.data)||{};
  const items=data.data||[];
  if(!items.length){ box.innerHTML='<div class="empty">暂无评论</div>'; return; }
  box.innerHTML='';
  items.forEach(it=>{
    const el=document.createElement('div');
    el.className='wk-comment';
    const st=it.status==='approved'?'<span class="status approved">已通过</span>':(it.status==='spam'?'<span class="status spam">垃圾</span>':'<span class="status waiting">待审批</span>');
    const time=it.insertedAt?new Date(it.insertedAt).toLocaleString('zh-CN',{hour12:false}):'';
    let ops='';
    if(it.status!=='approved') ops+='<button class="wk-btn sm" data-a="approve">通过</button>';
    if(it.status!=='spam') ops+='<button class="wk-btn act sm" data-a="spam">垃圾</button>';
    ops+='<button class="wk-btn danger sm" data-a="del">删除</button>';
    el.innerHTML='<div class="avatar">'+(it.avatar?'<img src="'+esc(it.avatar)+'">':'')+'</div>'+
      '<div style="flex:1">'+
        '<div><span class="nick">'+esc(it.nick)+'</span><span class="mail">'+esc(it.mail||'')+'</span><span class="ip">'+esc(it.ip||'')+'</span><span class="path">'+esc(it.url||'')+'</span><span class="time">'+esc(time)+'</span>'+st+'</div>'+
        '<div class="body">'+(it.comment||'')+'</div>'+
        '<div class="ops">'+ops+'</div>'+
      '</div>';
    el.dataset.id=it.objectId;
    box.appendChild(el);
  });
}
async function onCommentAction(e){
  const btn=e.target.closest('button'); if(!btn) return;
  const card=btn.closest('.wk-comment'); if(!card) return;
  const id=card.dataset.id, a=btn.dataset.a; if(!id) return;
  if(a==='del'&&!confirm('确认删除该评论？')) return;
  if(a==='approve'||a==='spam'){
    const r=await api('/waline/api/comment/'+id,{method:'PUT',body:JSON.stringify({status:a==='approve'?'approved':'spam'})});
    if(r.ok) loadComments(); else toast('操作失败',true);
  } else if(a==='del'){
    const r=await api('/waline/api/comment/'+id,{method:'DELETE'});
    if(r.ok) loadComments(); else toast('操作失败',true);
  }
}

// ---------- init ----------
function redirectLogin(){ location.replace('/admin/login'); }
document.addEventListener('DOMContentLoaded', ()=>{
  token = getToken();
  if(!token){ redirectLogin(); return; }
  // 校验 token，无效跳登录页
  fetch('/waline/api/token',{headers:{Authorization:'Bearer '+token}})
    .then(r=>r.json()).then(d=>{
      if(d.errno!==0||!d.data||d.data.type!=='administrator'){ redirectLogin(); return; }
      $('#userName').textContent=d.data.display_name||'管理员';
      switchTab('manage');
    }).catch(()=>redirectLogin());

  $('#logoutBtn').onclick=()=>{
    document.cookie='wl_token=;path=/;max-age=0';
    try{ localStorage.removeItem('TOKEN'); }catch(e){}
    location.replace('/admin/login');
  };
  $('#newBtn').onclick=newArticle;
  $('#saveBtn').onclick=savePost;
  $('#postList').addEventListener('click',onListClick);
  $('#commentList').addEventListener('click',onCommentAction);
  $$('#commentFilter .wk-btn').forEach(b=>b.onclick=()=>setCommentFilter(b.dataset.f));
  $$('.wk-tab').forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));
});
`;

export function renderAdminPage(siteUrl: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>博客管理后台</title>
<link rel="stylesheet" href="${VDIRTOR_CSS}">
<style>${STYLE}</style>
</head>
<body>
<nav class="wk-nav">
  <div class="inner">
    <div class="brand">
      <img src="${WALINE_LOGO}" alt="">
      <span>博客后台</span>
    </div>
    <div class="spacer"></div>
    ${siteUrl ? '<a class="site" href="' + siteUrl + '" target="_blank">查看站点</a>' : ''}
    <span class="user" id="userName"></span>
    <button class="logout" id="logoutBtn">退出</button>
  </div>
</nav>

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
        <button class="wk-btn sm" id="newBtn">＋ 添加新文章</button>
      </div>
      <ul class="wk-list" id="postList"><li class="empty">加载中...</li></ul>
    </div>
  </div>

  <!-- 写作页 -->
  <div id="page-write" class="wk-page hidden">
    <div class="wk-card">
      <div class="toolbar" style="justify-content:space-between;align-items:center">
        <h3 class="wk-title" style="margin:0;border:none;padding:0" id="editorTitle">发布新文章</h3>
        <div style="display:flex;gap:6px">
          <button class="wk-btn ghost sm" onclick="backToManage()">← 返回管理文章</button>
          <button class="wk-btn ghost sm" onclick="newArticle()">清空重写</button>
        </div>
      </div>
      <label class="wk-label">标题</label>
      <input class="wk-input" id="title" placeholder="文章标题">
      <div class="wk-row">
        <div class="wk-field"><label class="wk-label">日期</label><input class="wk-input" type="date" id="date"></div>
        <div class="wk-field"><label class="wk-label">分类</label><input class="wk-input" id="categories" placeholder="逗号或顿号分隔"></div>
        <div class="wk-field"><label class="wk-label">标签</label><input class="wk-input" id="tags" placeholder="逗号或顿号分隔"></div>
      </div>
      <label class="wk-label">正文（Markdown，分屏预览）</label>
      <div id="edt"></div>
      <div class="toolbar" style="justify-content:flex-end;margin-top:12px">
        <button class="wk-btn" id="saveBtn">发布文章</button>
      </div>
      <div class="msg" id="msg" style="margin-top:8px"></div>
    </div>
  </div>

  <!-- 评论管理 -->
  <div id="page-comments" class="wk-page hidden">
    <div class="wk-card">
      <div class="toolbar" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
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

<script src="${VDIRTOR_JS}"></script>
<script>${SCRIPT}</script>
</body>
</html>`;
}