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
/* 构建状态横幅 */
.build-banner{margin:10px 0 0;padding:8px 12px;font-size:12px;border:1px solid var(--border);border-radius:3px;background:var(--hover)}
.build-banner.ok{color:#1a7f37;background:#d1f5d3;border-color:transparent}
.build-banner.err{color:var(--danger);background:rgba(220,38,38,.08);border-color:transparent}
@media(prefers-color-scheme:dark){.build-banner.ok{color:#4ade80;background:rgba(74,222,128,.12)}}
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
@media(max-width:640px){.wk-row{flex-direction:column;gap:0}.wk-row>.wk-field{flex-basis:auto;width:100%}}
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
.wk-list .chip{display:inline-block;font-size:11px;color:var(--accent);background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.25);border-radius:3px;padding:1px 7px;margin-top:4px;margin-right:6px}
.wk-list .chipTag{color:var(--muted);background:var(--hover);border-color:var(--border)}
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
.hidden{display:none!important}
.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.empty{color:var(--muted);text-align:center;padding:26px 0;font-size:13px}
.filters{display:flex;gap:6px;flex-wrap:wrap}
.filters .wk-btn{padding:3px 12px;font-size:12px;border-radius:3px}
.msg{font-size:12px;min-height:18px}.msg.err{color:var(--danger)}.msg.ok{color:#1a7f37}
@media(prefers-color-scheme:dark){.msg.ok{color:#4ade80}}
/* 部署历史 */
/* 分类/标签历史建议（浏览器原生 datalist，可输入或选择） */
/* 访问量统计卡片 */
.stats-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:12px}
.stats{display:flex;gap:12px;min-width:max-content}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:2px;padding:14px 22px;min-width:130px}
.stat-card .num{font-size:22px;font-weight:700;color:var(--accent);line-height:1.3}
.stat-card .lbl{font-size:11px;color:var(--muted)}
/* 访问趋势折线图 */
#visitChart{position:relative}
.chart-svg{max-width:100%}
.chart-svg .cl-grid{stroke:var(--border);stroke-width:1}
.chart-svg .cl-ytxt{fill:var(--muted);font-size:11px}
.chart-svg .cl-xtxt{fill:var(--muted);font-size:11px}
.chart-svg .cl-line{fill:none;stroke:var(--accent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.chart-svg .cl-area{fill:var(--accent);opacity:.1;stroke:none}
.chart-svg .cl-dot{fill:var(--accent)}
.chart-svg .cl-cross{stroke:var(--muted);stroke-width:1;stroke-dasharray:3 3;pointer-events:none}
.chart-svg .cl-mark{fill:var(--card);stroke:var(--accent);stroke-width:2;pointer-events:none}
.chart-tip{position:absolute;transform:translate(-50%,0);background:var(--nav);color:var(--nav-active);font-size:12px;line-height:1.4;padding:4px 8px;border-radius:3px;white-space:nowrap;pointer-events:none;z-index:5}
@media(max-width:640px){.chart-svg .cl-ytxt,.chart-svg .cl-xtxt{font-size:15px}}
/* 顶部标签栏：移动端横向滑动 */
.wk-tabs{display:flex;gap:0;max-width:1080px;margin:14px auto 0;padding:0 16px;border-bottom:1px solid var(--border);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.wk-tabs::-webkit-scrollbar{display:none}
.wk-tab{padding:8px 16px;font-size:13px;border:none;background:transparent;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;flex:0 0 auto}
/* 部署记录表格：移动端横向滚动 */
.table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.wk-build-table{width:100%;border-collapse:collapse;font-size:12px;min-width:600px}
.wk-build-table th,.wk-build-table td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--border);vertical-align:middle;white-space:nowrap}
.wk-build-table code{background:var(--hover);padding:1px 5px;border-radius:2px;font-size:11px}
.wk-badge{display:inline-block;font-size:11px;padding:1px 8px;border-radius:2px;white-space:nowrap}
.wk-badge.success{background:#d1f5d3;color:#147d19}
.wk-badge.fail{background:#fde3e3;color:#d1241f}
.wk-badge.running{background:#fff3cd;color:#8a6d00}
.wk-badge.wait{background:var(--hover);color:var(--muted)}
@media(prefers-color-scheme:dark){.wk-badge.success{color:#4ade80;background:rgba(74,222,128,.12)}.wk-badge.fail{color:#f87171;background:rgba(248,113,113,.12)}.wk-badge.running{color:#fbbf24;background:rgba(251,191,36,.12)}}
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
let activePage = 'manage';

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
  let el = $('#msg');
  if(!el || el.offsetParent===null){
    // 全局兜底：当前激活页没有可见的 #msg 时，用一个全局浮层
    el = $('#wk-toast');
    if(!el){
      el = document.createElement('div');
      el.id='wk-toast';
      el.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2000;padding:8px 16px;font-size:13px;border-radius:3px;color:#fff;background:#111827;box-shadow:0 2px 8px rgba(0,0,0,.2);max-width:80vw';
      document.body.appendChild(el);
    }
    el.style.background = isErr ? '#dc2626' : '#111827';
  }
  el.textContent = msg;
  el.className = 'msg ' + (isErr ? 'err' : 'ok') + (el.id==='wk-toast' ? ' wk-toast' : '');
  el.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>{ el.style.opacity='0'; }, 2400);
}

// 读取登录态：Cookie 或 localStorage；非法则跳登录页（由 /admin 服务端已保证 Cookie 存在）
function getToken(){
  const c = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('wl_token='));
  if (c) { try { return decodeURIComponent(c.slice('wl_token='.length)); } catch(e){} }
  return storage.get('TOKEN');
}

// ---------- tab（独立路由 /admin/xxx，SPA 切换：仅改地址栏，绝不刷新）----------
const TAB_NAMES=['manage','comments','files','build','visit','subscribe','write'];
function showPage(name){ activePage=name; $$('.wk-page').forEach(p=>p.classList.toggle('hidden', p.id!=='page-'+name)); }
// 进入写作页（新建/编辑共用）：首次初始化编辑器与草稿
let writeInited=false;
function enterWritePage(){
  if(!writeInited){
    writeInited=true;
    if(!editingPath){
      if(!loadDraft()) $('#date').value=new Date().toISOString().slice(0,10);
      restoreDraft();
    }
    initEditorOnce();
    loadTaxonomySuggest();
  }
  showPage('write');
  window.scrollTo(0,0);
}
// 统一切换：先显示页面，再更新地址栏（replaceState 不新增历史，稳定不刷新）
function go(name){
  name=TAB_NAMES.includes(name)?name:'manage';
  $$('.wk-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  if(name==='write'){ enterWritePage(); }
  else {
    showPage(name);
    if(name==='manage'){ loadPosts(); initBuildStatus(); }
    if(name==='comments') loadComments();
    if(name==='files') loadFiles();
    if(name==='build') loadBuildHistory();
    if(name==='visit'){ loadVisit(); loadVisitSettings(); }
    window.scrollTo(0,0);
  }
  try{ history.replaceState(null,'','/admin/'+name); }catch(e){}
}
function switchTab(name){ go(name); }

// ---------- 访问量（仅管理员可见）----------
let visitDays = 30;

// 折线图：用内联 SVG 绘制最近 N 天访问量
function renderVisitChart(series){
  const el = $('#visitChart');
  if(!el) return;
  if(!series || !series.length){ el.innerHTML = '<div class="empty">暂无数据</div>'; return; }
  const W = 800, H = 260, padL = 46, padR = 16, padT = 16, padB = 30;
  const iw = W - padL - padR, ih = H - padT - padB;
  const n = series.length;
  const max = Math.max(1, ...series.map(p => Number(p.count) || 0));
  const X = i => padL + (n === 1 ? iw / 2 : iw * i / (n - 1));
  const Y = v => padT + ih - ih * (v / max);
  let grid = '';
  for(let t = 0; t <= 4; t++){
    const v = max * t / 4, yy = Y(v);
    grid += '<line class="cl-grid" x1="'+padL+'" y1="'+yy.toFixed(1)+'" x2="'+(W-padR)+'" y2="'+yy.toFixed(1)+'"/>';
    grid += '<text class="cl-ytxt" x="'+(padL-6)+'" y="'+(yy+3).toFixed(1)+'" text-anchor="end">'+Math.round(v)+'</text>';
  }
  const pts = series.map((p,i) => X(i).toFixed(1)+','+Y(Number(p.count)||0).toFixed(1)).join(' ');
  const area = '<polygon class="cl-area" points="'+padL+','+(padT+ih)+' '+pts+' '+(W-padR)+','+(padT+ih)+'"/>';
  const line = '<polyline class="cl-line" points="'+pts+'"/>';
  let dots = '';
  if(n <= 62){
    dots = series.map((p,i) => '<circle class="cl-dot" cx="'+X(i).toFixed(1)+'" cy="'+Y(Number(p.count)||0).toFixed(1)+'" r="2.5"><title>'+esc(p.day)+'：'+esc(p.count)+'</title></circle>').join('');
  }
  const step = Math.ceil(n / 6);
  let xl = '';
  series.forEach((p,i) => {
    if(i % step === 0 || i === n - 1){
      xl += '<text class="cl-xtxt" x="'+X(i).toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle">'+esc(String(p.day).slice(5))+'</text>';
    }
  });
  const cross = '<line class="cl-cross" y1="'+padT+'" y2="'+(padT+ih)+'" style="opacity:0"/>';
  const mark = '<circle class="cl-mark" r="4" style="opacity:0"/>';
  el.innerHTML = '<div class="chart-tip hidden"></div><svg viewBox="0 0 '+W+' '+H+'" class="chart-svg" style="width:100%;height:auto;display:block">'+grid+area+line+dots+cross+mark+xl+'</svg>';
  const svg = el.querySelector('svg');
  el.__geo = {
    W:W, H:H, padL:padL, padT:padT, iw:iw, ih:ih, n:n, series:series, X:X, Y:Y,
    cross: svg.querySelector('.cl-cross'),
    mark: svg.querySelector('.cl-mark'),
    tip: el.querySelector('.chart-tip')
  };
  // 鼠标悬停：显示该点对应的日期与访问量（补齐「列」的提示）
  el.onmousemove = function(ev){
    const g = el.__geo;
    if(!g || !g.tip) return;
    const rect = el.getBoundingClientRect();
    if(!rect.width) return;
    const px = (ev.clientX - rect.left) * (g.W / rect.width);
    let i = g.n === 1 ? 0 : Math.round((px - g.padL) / (g.iw / (g.n - 1)));
    i = Math.max(0, Math.min(g.n - 1, i));
    const p = g.series[i] || {};
    const cx = g.X(i), cy = g.Y(Number(p.count) || 0);
    g.cross.setAttribute('x1', cx.toFixed(1));
    g.cross.setAttribute('x2', cx.toFixed(1));
    g.cross.style.opacity = '1';
    g.mark.setAttribute('cx', cx.toFixed(1));
    g.mark.setAttribute('cy', cy.toFixed(1));
    g.mark.style.opacity = '1';
    g.tip.textContent = String(p.day || '') + '：' + (Number(p.count) || 0) + ' 次';
    g.tip.classList.remove('hidden');
    const tx = Math.max(34, Math.min(rect.width - 34, (cx / g.W) * rect.width));
    const ty = Math.max(0, (cy / g.H) * rect.height - 36);
    g.tip.style.left = tx + 'px';
    g.tip.style.top = ty + 'px';
  };
  el.onmouseleave = function(){
    const g = el.__geo;
    if(!g) return;
    g.cross.style.opacity = '0';
    g.mark.style.opacity = '0';
    if(g.tip) g.tip.classList.add('hidden');
  };
}

// 读取今日/总访问量 + 最近 N 天趋势
async function loadVisit(){
  const today = $('#statToday'), total = $('#statTotal');
  if(today) today.textContent = '-';
  if(total) total.textContent = '-';
  try{
    const r = await api('/api/visit/stats');
    if(r.ok){
      const d = r.data || {};
      if(today) today.textContent = (d.today == null ? '-' : d.today);
      if(total) total.textContent = (d.total == null ? '-' : d.total);
    }
  }catch(e){}
  const chart = $('#visitChart'), sumEl = $('#visitRangeSum');
  if(chart) chart.innerHTML = '<div class="empty">加载中...</div>';
  try{
    const r = await api('/admin/api/visit/daily?days=' + visitDays);
    if(r.ok && r.data){
      renderVisitChart(r.data.series || []);
      if(sumEl) sumEl.textContent = (r.data.sum == null ? '-' : r.data.sum);
    } else {
      if(chart) chart.innerHTML = '<div class="empty">加载失败</div>';
      if(sumEl) sumEl.textContent = '-';
    }
  }catch(e){
    if(chart) chart.innerHTML = '<div class="empty">加载失败</div>';
    if(sumEl) sumEl.textContent = '-';
  }
  const ld = $('#visitDaysLabel');
  if(ld) ld.textContent = visitDays;
}

// 快捷按钮：7/30/90/365
function setVisitDays(n){ visitDays = n; const i = $('#visitDays'); if(i) i.value = n; loadVisit(); }
// 自定义天数
function applyVisitDays(){
  const i = $('#visitDays');
  const n = parseInt((i && i.value) || '', 10);
  if(!Number.isFinite(n) || n < 1 || n > 3650){ toast('显示天数需为 1-3650 的整数', true); return; }
  visitDays = n; loadVisit();
}

// 数据保留天数（默认 365，可调）
async function loadVisitSettings(){
  try{
    const r = await api('/admin/api/visit/settings');
    const i = $('#retentionDays');
    if(r.ok && r.data && i) i.value = r.data.retention_days;
  }catch(e){}
}
async function saveVisitSettings(){
  const i = $('#retentionDays');
  const n = parseInt((i && i.value) || '', 10);
  if(!Number.isFinite(n) || n < 1 || n > 3650){ toast('保留天数需为 1-3650 的整数', true); return; }
  const r = await api('/admin/api/visit/settings', { method:'PUT', body: JSON.stringify({ retention_days: n }) });
  if(r.ok) toast('已保存：数据保留 ' + n + ' 天');
  else toast('保存失败' + (r.data && r.data.error ? '：' + r.data.error : ''), true);
}

// ---------- 管理文章 ----------
// 用历史分类/标签填充输入框浏览器原生 datalist（可输入或从历史下拉选择）
function wireTaxonomySuggest(d){
  const ac=d&&d.allCategories||[], at=d&&d.allTags||[];
  const cl=$('#catList'), tl=$('#tagList');
  if(cl){ cl.innerHTML=''; ac.forEach(x=>{ const o=document.createElement('option'); o.value=x; cl.appendChild(o); }); }
  if(tl){ tl.innerHTML=''; at.forEach(x=>{ const o=document.createElement('option'); o.value=x; tl.appendChild(o); }); }
}
// 独立拉取历史分类/标签，填充写作页下拉建议（管理页由 loadPosts 调用；写作页单独调用）
async function loadTaxonomySuggest(){
  const r=await api(API_BASE+'/posts');
  if(r.ok&&r.data) wireTaxonomySuggest(r.data);
}
async function loadPosts(){
  const list = $('#postList'); if(!list) return;
  list.innerHTML = '<li class="empty">加载中...</li>';
  const r = await api(API_BASE+'/posts');
  if(r.status===401){ redirectLogin(); return; }
  if(!r.ok){ list.innerHTML = '<li class="empty">加载失败：'+(r.data&&r.data.error||r.status)+'</li>'; return; }
  const posts = (r.data.posts||[]).slice().sort((a,b)=> (b.date||'').localeCompare(a.date||'') || String(b.name||'').localeCompare(String(a.name||'')));
  if(!posts.length){ list.innerHTML='<li class="empty">还没有文章，点右上角「＋ 添加新文章」开始写作</li>'; return; }
  wireTaxonomySuggest(r.data);
  list.innerHTML='';
  posts.forEach(p=>{
    const li=document.createElement('li');
    const name=(p.name||'').replace(/\\.md$/,'');
    const cat=(p.categories||[]).map(esc).join(' / ');
    const tag=(p.tags||[]).map(esc).join(' · ');
    const taxo='<div class="meta">'+esc(p.path)+'</div>'+(cat?'<span class="chip">'+cat+'</span>':'')+(tag?'<span class="chip chipTag">'+tag+'</span>':'');
    li.innerHTML = '<div><div class="name">'+esc(name)+'</div>'+taxo+'</div>'+
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
  hideBuildBanner();
  pendingEditorValue=p.body||'';
  go('write');
  initEditorOnce();
  loadTaxonomySuggest(); // 编辑页也需要分类/标签历史建议（SPA 切换不会重新加载页面）
}
function nameOf(path){ return String(path||'').split('/').pop().replace(/\\.md$/,'')||'未命名'; }
function backToManage(){ go('manage'); }

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
    toast(isUpd?'保存成功，已触发部署':'发布成功，已触发部署');
    clearDraft();
    await launchDeploy('已发布，部署工作流正在重建站点…');
    go('manage');
  } else toast('保存失败：'+(r.data&&r.data.error||r.status),true);
}
async function delPost(path,name){
  if(!confirm('确认删除文章「'+name+'」？')) return;
  const r=await api(API_BASE+'/post?path='+encodeURIComponent(path),{method:'DELETE'});
  if(r.status===401){ redirectLogin(); return; }
  if(r.ok&&r.data&&r.data.ok){
    toast('已删除');
    loadPosts();
    await launchDeploy('已删除「'+name+'」，工作流正在重建站点…');
  }
  else toast('删除失败：'+(r.data&&r.data.error||r.status),true);
}
// 触发部署工作流并轮询进度（保存/删除文章时自动发布；文件保存不调用）
async function launchDeploy(msg){
  const r=await api(API_BASE+'/build/trigger',{method:'POST'});
  if(r.ok&&r.data&&r.data.ok){
    showBuildBanner(msg||'已触发部署工作流，正在重建站点…');
    setTimeout(pollBuild, 3000);
    return true;
  } else {
    showBuildBanner('代码已推送到 GitHub，但自动触发部署失败，请点「运行工作流」手动部署','err');
    return false;
  }
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
    lang: 'zh_CN',
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
    input: (v)=>{ saveDraft(); },
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

// ---------- 构建状态横幅 ----------
let buildTimer=null;
// 进入管理页时：若已有构建在跑，则显示进度横幅并开始轮询（此前刚发布/删除会跳到这里）
async function initBuildStatus(){
  const r=await api(API_BASE+'/build');
  const d=r.data||{};
  if(r.ok&&d&&d.running){
    showBuildBanner('部署工作流正在重建站点…');
    pollBuild();
  }
}
function showBuildBanner(msg, cls){
  [$('#buildBanner'), $('#buildBannerBuild')].forEach((b)=>{
    if(!b) return;
    b.className='build-banner '+(cls||'');
    b.textContent=msg;
    b.classList.remove('hidden');
  });
}
function hideBuildBanner(){
  [$('#buildBanner'), $('#buildBannerBuild')].forEach((b)=>{ if(b) b.classList.add('hidden'); });
}
function pollBuild(){
  if(buildTimer) clearInterval(buildTimer);
  let tries=0;
  buildTimer=setInterval(async ()=>{
    tries++;
    const r=await api(API_BASE+'/build');
    const d=r.data||{};
    if(!d.ok){
      if(tries>=12){ clearInterval(buildTimer); buildTimer=null; showBuildBanner('暂时无法获取构建状态，请稍后刷新页面查看站点','err'); return; }
      return;
    }
    const runs=d.runs||[];
    const multi=runs.length>1?'（当前共 '+runs.length+' 次构建）':'';
    if(d.running){
      showBuildBanner('正在重建站点'+multi+'，已等待约 '+(tries*5)+' 秒…');
      if(tries>=24){ clearInterval(buildTimer); buildTimer=null; showBuildBanner('重建仍在进行，稍后可刷新站点查看'+multi,'err'); return; }
      return;
    }
    clearInterval(buildTimer); buildTimer=null;
    if(d.conclusion==='success'||d.conclusion==='completed'){
      showBuildBanner('站点已更新完成，可以刷新首页查看'+multi,'ok');
    } else {
      showBuildBanner('工作流结束（'+(d.conclusion||d.status||'未知')+'），可能未成功，请到 '+esc(d.html_url||'')+' 查看详情'+multi,'err');
    }
  }, 5000);
}

// ---------- 手动运行工作流 + 部署记录 ----------
async function triggerBuild(){
  // 先检测是否已有构建在跑/排队，避免手动触发叠加出重复构建
  const st=await api(API_BASE+'/build');
  if(st.ok&&st.data&&st.data.running){
    const n=(st.data.runs||[]).length;
    if(!confirm('已有一个部署正在进行中'+(n>1?'（最近有 '+n+' 次构建）':'')+'，再触发一个会造成重复构建。确定还要运行吗？')) return;
  }
  if(!confirm('确定运行部署工作流吗？将重建整个站点。')) return;
  const r=await api(API_BASE+'/build/trigger',{method:'POST'});
  if(r.status===401){ redirectLogin(); return; }
  if(r.ok&&r.data&&r.data.ok){
    toast('已触发部署工作流，稍候开始构建');
    showBuildBanner('已触发部署工作流，正在重建站点…');
    // 触发后 run 需几秒才出现，稍作延迟后开始轮询与刷新历史
    setTimeout(pollBuild, 3000);
    setTimeout(()=>{ const box=$('#buildHistory'); if(box) loadBuildHistory(); }, 4000);
  } else {
    toast('触发失败：'+(r.data&&r.data.error||r.status),true);
    if(r.data&&r.data.detail) toast(r.data.detail,true);
  }
}
function buildBadge(status, conclusion){
  if(conclusion==='success') return '<span class="wk-badge success">成功</span>';
  if(conclusion==='failure') return '<span class="wk-badge fail">失败</span>';
  if(conclusion==='cancelled') return '<span class="wk-badge fail">已取消</span>';
  if(conclusion==='timed_out') return '<span class="wk-badge fail">超时</span>';
  if(status==='completed') return '<span class="wk-badge wait">'+(conclusion||'结束')+'</span>';
  return '<span class="wk-badge running">运行中</span>';
}
async function loadBuildHistory(){
  const box=$('#buildHistory'); if(!box) return;
  box.innerHTML='<div class="empty">加载中...</div>';
  const r=await api(API_BASE+'/build/history');
  if(r.status===401){ redirectLogin(); return; }
  if(!r.ok){ box.innerHTML='<div class="empty">加载失败：'+(r.data&&r.data.error||r.status)+'</div>'; return; }
  const runs=r.data.runs||[];
  if(!runs.length){ box.innerHTML='<div class="empty">暂无部署记录</div>'; return; }
  let html='<table class="wk-build-table"><thead><tr><th>#</th><th>时间</th><th>提交</th><th>状态</th><th>日志</th></tr></thead><tbody>';
  runs.forEach(rn=>{
    const t=rn.created_at?new Date(rn.created_at).toLocaleString('zh-CN',{hour12:false}):'';
    html+='<tr><td><a href="'+esc(rn.html_url)+'" target="_blank" rel="noopener">#'+esc(rn.id)+'</a></td>'+
      '<td>'+esc(t)+'</td><td><code>'+esc(rn.head_sha)+'</code></td>'+
      '<td>'+buildBadge(rn.status,rn.conclusion)+'</td>'+
      '<td><a class="wk-btn ghost sm" href="'+esc(rn.html_url)+'" target="_blank" rel="noopener">查看日志 ↗</a></td></tr>';
  });
  html+='</tbody></table>';
  box.innerHTML=html;
}

// ---------- 文件管理 ----------
let filePath='';
let fileBranch='';
let branchesLoaded=false;
function curBranch(){ return fileBranch || 'main'; }
function fileApi(url){
  const sep=url.indexOf('?')>=0?'&':'?';
  return url+sep+'branch='+encodeURIComponent(curBranch());
}
function fmtSize(n){
  n=n||0;
  if(n<1024) return n+' B';
  if(n<1024*1024) return (n/1024).toFixed(1)+' KB';
  return (n/1024/1024).toFixed(1)+' MB';
}
function upLevel(){
  const parts=filePath.split('/').filter(Boolean);
  parts.pop();
  filePath=parts.join('/');
  loadFiles();
}
function renderCrumb(){
  const c=$('#fileCrumb'); if(!c) return;
  const parts=filePath.split('/').filter(Boolean);
  let html='<a href="javascript:;" data-dir="">根目录</a>';
  let cur='';
  parts.forEach((p,i)=>{
    cur=cur?cur+'/'+p:p;
    html+=' / <a href="javascript:;" data-dir="'+esc(cur)+'">'+esc(p)+'</a>';
  });
  c.innerHTML=html;
  $$('#fileCrumb a').forEach(a=>a.onclick=()=>{ filePath=a.dataset.dir; loadFiles(); });
}
async function loadBranches(selectCur){
  const sel=$('#branchSel'); if(!sel) return;
  const r=await api(API_BASE+'/branches');
  if(!r.ok||!r.data){ return; }
  const branches=r.data.branches||[];
  if(selectCur) fileBranch=r.data.current||'main';
  sel.innerHTML='';
  branches.forEach(b=>{
    const o=document.createElement('option'); o.value=b; o.textContent=b; sel.appendChild(o);
  });
  sel.value=fileBranch||(r.data.current||'main');
  if(!fileBranch||!sel.value) fileBranch=sel.value||'main';
  branchesLoaded=true;
}
async function loadFiles(){
  const list=$('#fileList'); if(!list) return;
  list.innerHTML='<li class="empty">加载中...</li>';
  const r=await api(fileApi(API_BASE+'/files?path='+encodeURIComponent(filePath)));
  if(r.status===401){ redirectLogin(); return; }
  if(!r.ok){ list.innerHTML='<li class="empty">加载失败：'+(r.data&&r.data.error||r.status)+'</li>'; return; }
  const items=(r.data&&r.data.items)||[];
  renderCrumb();
  list.innerHTML='';
  if(!items.length){ list.innerHTML='<li class="empty">空目录</li>'; return; }
  items.forEach(f=>{
    const li=document.createElement('li');
    const isDir=f.type==='dir';
    const isZip=/\.zip$/i.test(f.name||'');
    li.style.cursor=isDir?'pointer':'default';
    // 文件夹：整行点击进入
    if(isDir){
      li.innerHTML='<div class="name">📁 '+esc(f.name)+'</div>'+
        '<div class="ops"><button class="wk-btn danger sm" data-a="del">删除</button></div>';
    } else {
      let ops='<button class="wk-btn ghost sm" data-a="edit">编辑</button>'+
              '<button class="wk-btn ghost sm" data-a="dl">下载</button>'+
              '<button class="wk-btn danger sm" data-a="del">删除</button>';
      if(isZip) ops='<button class="wk-btn act sm" data-a="zip">解压</button>'+ops;
      li.innerHTML='<div class="name">📄 '+esc(f.name)+' · '+fmtSize(f.size)+'</div>'+
        '<div class="ops">'+ops+'</div>';
    }
    li.dataset.type=f.type; li.dataset.path=f.path; li.dataset.name=f.name;
    list.appendChild(li);
  });
}
async function onFileClick(e){
  const btn=e.target.closest('button'); if(!btn) return;
  const li=btn.closest('li'); if(!li) return;
  const path=li.dataset.path, name=li.dataset.name, a=btn.dataset.a;
  if(a==='zip'){
    if(!confirm('解压「'+name+'」到当前目录？')) return;
    const r=await api(API_BASE+'/unzip-path',{method:'POST',body:JSON.stringify({path,branch:curBranch()})});
    if(r.status===401){ redirectLogin(); return; }
    if(r.ok&&r.data&&r.data.ok) toast(r.data.message||'解压完成');
    else toast('解压失败：'+(r.data&&r.data.error||r.status),true);
    loadFiles();
    return;
  }
  if(a==='del'){
    if(!confirm('确认删除「'+name+'」？目录会递归删除。')) return;
    const r=await api(fileApi(API_BASE+'/file?path='+encodeURIComponent(path)),{method:'DELETE'});
    if(r.status===401){ redirectLogin(); return; }
    if(r.ok&&r.data&&r.data.ok) toast(r.data.message||'已删除');
    else toast('删除失败：'+(r.data&&r.data.error||r.status),true);
    loadFiles();
    return;
  }
  if(a==='edit'){
    const r=await api(fileApi(API_BASE+'/file?path='+encodeURIComponent(path)));
    if(r.status===401){ redirectLogin(); return; }
    if(!r.ok){ toast('读取失败：'+(r.data&&r.data.error||r.status),true); return; }
    const d=r.data||{};
    if(d.binary){ toast('二进制文件暂不支持在线编辑，请下载后修改再上传',true); return; }
    fileEditPath=path;
    $('#fileEditPath').textContent=path;
    $('#fileEditArea').value=d.content||'';
    $('#fileEditor').classList.remove('hidden');
    return;
  }
  if(a==='dl'){
    const repo='__REPO__';
    const url=repo?('https://raw.githubusercontent.com/'+repo+'/'+curBranch()+'/'+encodeURIComponent(path)):('#');
    if(!repo){ toast('仓库未配置',true); return; }
    window.open(url,'_blank');
  }
}
async function onFileListClick(e){
  // 文件夹整行点击进入
  const li=e.target.closest('li'); if(!li||li.dataset.type!=='dir') return;
  if(e.target.closest('button')) return; // 点击按钮时交给 onFileClick
  filePath=li.dataset.path;
  loadFiles();
}
async function saveFileEdit(){
  const content=$('#fileEditArea').value;
  const r=await api(API_BASE+'/file',{method:'PUT',body:JSON.stringify({path:fileEditPath,content,branch:curBranch()})});
  if(r.status===401){ redirectLogin(); return; }
  if(r.ok&&r.data&&r.data.ok){
    toast('已保存到 GitHub 仓库，如需部署请点击「运行工作流」');
    $('#fileEditor').classList.add('hidden');
    loadFiles();
  } else toast('保存失败：'+(r.data&&r.data.error||r.status),true);
}
async function doUpload(files){
  if(!files.length) return;
  const fd=new FormData();
  fd.append('path', filePath);
  fd.append('branch', curBranch());
  files.forEach(f=>fd.append('files', f));
  const r=await fetch(API_BASE+'/upload',{method:'POST',body:fd,headers:{Authorization:'Bearer '+token}});
  let d=null; try{ d=await r.json(); }catch(e){}
  if(r.status===401){ redirectLogin(); return; }
  if(d&&d.ok) toast(d.message||'上传成功');
  else toast('上传失败：'+(d&&d.error||r.status),true);
  loadFiles();
}
function newFolder(){
  const name=prompt('输入文件夹名称：');
  if(!name||!name.trim()) return;
  const target=(filePath?filePath+'/':'')+name.trim();
  const r=api(fileApi(API_BASE+'/file'),{method:'PUT',body:JSON.stringify({path:target+'/.gitkeep',content:'',branch:curBranch()})});
  r.then(res=>{
    if(res.ok&&res.data&&res.data.ok){ toast('已创建 '+name.trim()); loadFiles(); }
    else toast('创建失败',true);
  });
}

// ---------- 写作页草稿自动保存（刷新后恢复，参考 cp.802213.xyz）----------
// 仅「发布新文章」页（/admin/write）自动保存；编辑已有文章不覆盖草稿。
const DRAFT_KEY='wk_draft_v1';
function loadDraft(){
  try{
    const raw=localStorage.getItem(DRAFT_KEY);
    if(!raw) return null;
    const d=JSON.parse(raw);
    return d&&typeof d==='object'?d:null;
  }catch(e){ return null; }
}
function saveDraft(){
  if(activePage!=='write'||editingPath) return;
  const d={
    title:$('#title').value,
    date:$('#date').value,
    tags:$('#tags').value,
    categories:$('#categories').value,
    content:editor?editor.getValue():'',
    ts:Date.now()
  };
  try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); }catch(e){}
}
function clearDraft(){
  try{ localStorage.removeItem(DRAFT_KEY); }catch(e){}
}
function restoreDraft(){
  const d=loadDraft();
  if(!d) return;
  $('#title').value=d.title||'';
  $('#date').value=(d.date||new Date().toISOString().slice(0,10)).slice(0,10);
  $('#tags').value=d.tags||'';
  $('#categories').value=d.categories||'';
  if(d.content){ pendingEditorValue=d.content; $('#editorTitle').textContent='发布新文章（已恢复草稿）'; }
  toast('已恢复上次未发布的草稿');
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
      if(window.__INITIAL__==='write'){
        enterWritePage();
      } else {
        switchTab(window.__INITIAL__||'manage');
      }
    }).catch(()=>redirectLogin());

  $('#logoutBtn').onclick=()=>{
    document.cookie='wl_token=;path=/;max-age=0';
    try{ localStorage.removeItem('TOKEN'); }catch(e){}
    location.replace('/admin/login');
  };
  // 新建文章：重置表单后 SPA 进入写作页（不刷新）
  $('#newBtn').onclick=()=>{
    editingPath='';
    ['title','date','tags','categories'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    $('#date').value=new Date().toISOString().slice(0,10);
    $('#editorTitle').textContent='发布新文章';
    $('#saveBtn').textContent='发布文章';
    pendingEditorValue='';
    try{ if(editor) editor.setValue(''); }catch(e){}
    go('write');
  };
  $('#saveBtn').onclick=savePost;
  // 写作页表单：输入即自动保存草稿；关闭/刷新前兜底保存
  ['title','date','tags','categories'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener('input',saveDraft);
  });
  window.addEventListener('beforeunload', saveDraft);
  $('#postList').addEventListener('click',onListClick);
  $('#commentList').addEventListener('click',onCommentAction);
  $$('#commentFilter .wk-btn').forEach(b=>b.onclick=()=>setCommentFilter(b.dataset.f));
  $('#fileList').addEventListener('click',onFileClick);
  $('#fileList').addEventListener('click',onFileListClick);
  $('#fileEditSave').onclick=saveFileEdit;
  $('#fileEditBack').onclick=()=>$('#fileEditor').classList.add('hidden');
  $('#upBtn').onclick=()=>$('#upInput').click();
  $('#upInput').onchange=e=>{ doUpload(Array.from(e.target.files||[])); e.target.value=''; };
  $('#upDirBtn').onclick=upLevel;
  $('#branchSel').onchange=e=>{ fileBranch=e.target.value||'main'; filePath=''; loadFiles(); };
  $('#newFolderBtn').onclick=newFolder;
  loadBranches(true);
  $$('.wk-tab').forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));
});
`;

export function renderAdminPage(siteUrl: string, ghRepo?: string, initial = "manage"): string {
  const repo = String(ghRepo || "");
  const INITIAL = ["manage","comments","files","build","visit","subscribe","write"].includes(initial)
    ? initial
    : "manage";
  // 服务端就直接渲染出正确的初始页面，避免先闪一下「管理文章」再切过去
  const pageCls = (name: string) => "wk-page" + (INITIAL === name ? "" : " hidden");
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

<div class="wk-tabs" ${INITIAL === "write" ? 'style="display:none"' : ""}>
  <button class="wk-tab ${INITIAL === "manage" ? "active" : ""}" data-tab="manage">管理文章</button>
  <button class="wk-tab ${INITIAL === "comments" ? "active" : ""}" data-tab="comments">评论管理</button>
  <button class="wk-tab ${INITIAL === "files" ? "active" : ""}" data-tab="files">文件管理</button>
  <button class="wk-tab ${INITIAL === "build" ? "active" : ""}" data-tab="build">部署记录</button>
  <button class="wk-tab ${INITIAL === "visit" ? "active" : ""}" data-tab="visit">访问量</button>
  <button class="wk-tab ${INITIAL === "subscribe" ? "active" : ""}" data-tab="subscribe">订阅管理</button>
</div>

<div class="wk-wrap">

  <!-- 管理文章（默认首页） -->
  <div id="page-manage" class="${pageCls("manage")}">
    <div id="buildBanner" class="build-banner hidden" style="margin-bottom:0"></div>
    <div class="wk-card">
      <div class="toolbar" style="justify-content:space-between;align-items:center">
        <h3 class="wk-title" style="margin:0;border:none;padding:0">已有文章</h3>
        <button class="wk-btn sm" id="newBtn">＋ 添加新文章</button>
      </div>
      <ul class="wk-list" id="postList"><li class="empty">加载中...</li></ul>
    </div>
  </div>

  <!-- 写作页 -->
  <div id="page-write" class="${pageCls("write")}">
    <div class="wk-card">
      <div class="toolbar" style="justify-content:space-between;align-items:center">
        <h3 class="wk-title" style="margin:0;border:none;padding:0" id="editorTitle">发布新文章</h3>
        <div style="display:flex;gap:6px">
          <button class="wk-btn ghost sm" onclick="go('manage')">← 返回管理文章</button>
        </div>
      </div>
      <label class="wk-label">标题</label>
      <input class="wk-input" id="title" placeholder="文章标题">
      <div class="wk-row">
        <div class="wk-field"><label class="wk-label">日期</label><input class="wk-input" type="date" id="date"></div>
        <div class="wk-field"><label class="wk-label">分类</label><input class="wk-input" id="categories" list="catList" placeholder="可输入或从历史下拉选择，多个用逗号分开"></div>
        <div class="wk-field"><label class="wk-label">标签</label><input class="wk-input" id="tags" list="tagList" placeholder="可输入或从历史下拉选择，多个用逗号分开"></div>
      </div>
      <datalist id="catList"></datalist>
      <datalist id="tagList"></datalist>
      <label class="wk-label">正文（Markdown，分屏预览）</label>
      <div id="edt"></div>
      <div class="toolbar" style="justify-content:flex-end;margin-top:12px">
        <button class="wk-btn" id="saveBtn">发布文章</button>
      </div>
      <div class="msg" id="msg" style="margin-top:8px"></div>
    </div>
  </div>

  <!-- 评论管理 -->
  <div id="page-comments" class="${pageCls("comments")}">
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

  <!-- 文件管理 -->
  <div id="page-files" class="${pageCls("files")}">
    <div class="wk-card">
      <div class="toolbar" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
        <div style="display:flex;align-items:center;gap:10px">
          <h3 class="wk-title" style="margin:0;border:none;padding:0">文件管理</h3>
          <select class="wk-input" id="branchSel" style="width:auto;min-width:120px;padding:4px 8px" title="切换分支">
            <option value="">加载分支...</option>
          </select>
        </div>
        <div class="filters" id="fileOps">
          <button class="wk-btn ghost sm" id="upDirBtn" title="返回上一级">← 上一级</button>
          <button class="wk-btn sm" id="upBtn">上传</button>
          <button class="wk-btn ghost sm" id="newFolderBtn">新建文件夹</button>
        </div>
        <input type="file" id="upInput" multiple style="display:none">
      </div>
      <div class="breadcrumb" id="fileCrumb" style="font-size:12px;color:var(--muted);padding:8px 6px 4px;word-break:break-all"></div>
      <ul class="wk-list" id="fileList"><li class="empty">加载中...</li></ul>
    </div>
    <!-- 全屏文本编辑器 -->
    <div id="fileEditor" class="hidden" style="position:fixed;inset:0;background:var(--bg);z-index:100;display:flex;flex-direction:column">
      <div class="wk-nav" style="position:static;height:46px">
        <div class="inner">
          <button class="logout" id="fileEditBack" style="color:var(--nav-fg);border:1px solid var(--border);background:transparent;padding:3px 10px;border-radius:3px;cursor:pointer">← 返回</button>
          <span class="brand" style="font-size:12px;color:var(--nav-fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" id="fileEditPath"></span>
          <div class="spacer"></div>
          <button class="logout" id="fileEditSave" style="color:#fff;background:var(--accent);border:none;padding:4px 14px;border-radius:3px;cursor:pointer">保存</button>
        </div>
      </div>
      <textarea id="fileEditArea" style="flex:1;width:100%;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;border:none;border-radius:0;padding:14px;background:var(--input-bg);color:var(--fg);outline:none;resize:none"></textarea>
    </div>
  </div>

  <!-- 部署记录 -->
  <div id="page-build" class="${pageCls("build")}">
    <div id="buildBannerBuild" class="build-banner hidden" style="margin-bottom:10px"></div>
    <div class="wk-card">
      <div class="toolbar" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
        <h3 class="wk-title" style="margin:0;border:none;padding:0">部署记录</h3>
        <button class="wk-btn act sm" onclick="triggerBuild()">▶ 手动运行工作流</button>
      </div>
      <p class="wk-label" style="margin-top:0">改完文件后点「运行工作流」即可手动触发部署，无需推送代码。点击「查看日志」可跳转 GitHub Actions 查看完整构建日志。</p>
      <div class="table-scroll"><div id="buildHistory" class="empty">加载中...</div></div>
    </div>
  </div>

  <!-- 访问量（仅管理员可见） -->
  <div id="page-visit" class="${pageCls("visit")}">
    <div class="stats-scroll"><div class="stats">
      <div class="stat-card"><div class="num" id="statToday">-</div><div class="lbl">今日访问数</div></div>
      <div class="stat-card"><div class="num" id="statTotal">-</div><div class="lbl">总访问量</div></div>
    </div></div>

    <div class="wk-card">
      <h3 class="wk-title">访问趋势（最近 <span id="visitDaysLabel">30</span> 天）</h3>
      <div class="filters" style="margin:0 0 10px">
        <button class="wk-btn ghost sm" onclick="setVisitDays(7)">7 天</button>
        <button class="wk-btn ghost sm" onclick="setVisitDays(30)">30 天</button>
        <button class="wk-btn ghost sm" onclick="setVisitDays(90)">90 天</button>
        <button class="wk-btn ghost sm" onclick="setVisitDays(365)">365 天</button>
        <input class="wk-input" id="visitDays" type="number" min="1" max="3650" value="30" style="width:88px" placeholder="自定义">
        <button class="wk-btn sm" onclick="applyVisitDays()">应用</button>
      </div>
      <div id="visitChart"><div class="empty">加载中...</div></div>
      <p class="wk-label" style="margin:8px 0 0">图中区间合计：<b id="visitRangeSum">-</b>（仅展示所选天数，不改变数据保留策略）</p>
    </div>

    <div class="wk-card">
      <h3 class="wk-title">数据保留</h3>
      <p class="wk-label" style="margin-top:0">默认保留 365 天，可设置更长或更短；超期数据会自动清理。</p>
      <div class="filters" style="margin:0">
        <input class="wk-input" id="retentionDays" type="number" min="1" max="3650" style="width:110px" placeholder="365">
        <span class="wk-label" style="margin:0">天</span>
        <button class="wk-btn sm" onclick="saveVisitSettings()">保存</button>
      </div>
    </div>

    <div class="wk-card">
      <h3 class="wk-title">API 说明</h3>
      <ul class="wk-list">
        <li>
          <div>
            <div class="name"><span class="chip">POST</span> /api/visit</div>
            <div class="meta">记录一次访问（前台调用）。同一访客同一天只计一次，刷新不重复。返回 {ok, counted, today, total}</div>
          </div>
        </li>
        <li>
          <div>
            <div class="name"><span class="chip">GET</span> /api/visit/stats</div>
            <div class="meta">查询访问量。返回 {ok, today, total}，today 按东八区计算</div>
          </div>
        </li>
        <li>
          <div>
            <div class="name"><span class="chip">GET</span> /admin/api/visit/daily?days=30</div>
            <div class="meta">按天趋势（需管理员登录）。days 取值 1-3650，返回 {ok, days, sum, series:[{day,count}]}</div>
          </div>
        </li>
        <li>
          <div>
            <div class="name"><span class="chip">GET</span> /admin/api/visit/settings</div>
            <div class="meta">读取数据保留天数（需管理员登录）。返回 {ok, retention_days}</div>
          </div>
        </li>
        <li>
          <div>
            <div class="name"><span class="chip">PUT</span> /admin/api/visit/settings</div>
            <div class="meta">保存数据保留天数（需管理员登录）。请求体 {"retention_days": 365}，取值 1-3650</div>
          </div>
        </li>
      </ul>
    </div>
  </div>

  <!-- 订阅管理（空界面，功能开发中） -->
  <div id="page-subscribe" class="${pageCls("subscribe")}">
    <div class="wk-card">
      <h3 class="wk-title" style="margin:0 0 12px">订阅管理</h3>
      <div class="empty">订阅管理功能建设中，敬请期待。</div>
    </div>
  </div>

</div>

<script src="${VDIRTOR_JS}"></script>
<script>var __INITIAL__='${INITIAL}';</script>
<script>${SCRIPT.replace(/__REPO__/g, repo)}</script>
</body>
</html>`;
}