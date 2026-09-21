/**
 * Worker Settings Page — standalone admin page for non-standard Waline features.
 * Matches @waline/admin 0.34.0 design style with independent header, tabbed layout,
 * i18n support (zh-CN / en), and client-side auth.
 */

export function getCustomSettingsPage(requestUrl: string): string {
	const url = new URL(requestUrl);
	const apiBase = url.origin;

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Worker Settings</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}
body{margin:0;font:87.5%/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5;color:#333}
a{color:#f97316;text-decoration:none}a:hover{color:#ea580c}

/* Header — matching @waline/admin 0.34.0 */
.typecho-head-nav{background:#1e293b;padding:0 16px;height:52px;display:flex;align-items:center}
.typecho-head-nav .waline-header{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:1024px;margin:0 auto}
.typecho-head-nav .brand{display:flex;align-items:center;gap:10px;color:#fff;font-size:15px;font-weight:600}
.typecho-head-nav .brand-mark{display:inline-block;width:44px;height:44px;background:url('https://waline.js.org/logo.png') no-repeat center/cover;filter:brightness(0) saturate(100%) invert(55%) sepia(98%) saturate(2021%) hue-rotate(346deg) brightness(98%) contrast(97%)}
.typecho-head-nav .nav-links{display:flex;align-items:center;gap:12px}
.typecho-head-nav .nav-links a{color:#94a3b8;font-size:13px;padding:6px 14px;border-radius:6px;transition:background .15s}
.typecho-head-nav .nav-links a:hover{color:#e2e8f0;background:rgba(255,255,255,.08)}

/* Language toggle buttons */
.lang-toggle{display:flex;border-radius:6px;overflow:hidden;border:1px solid #475569}
.lang-toggle button{padding:4px 10px;font-size:12px;line-height:18px;border:none;background:#334155;color:#94a3b8;cursor:pointer;transition:all .15s}
.lang-toggle button.active{background:#f97316;color:#fff}
.lang-toggle button:hover:not(.active){color:#e2e8f0;background:rgba(255,255,255,.06)}

/* Content */
.container{max-width:1024px;margin:24px auto;padding:0 16px}

/* Tab bar */
.tabs{display:flex;gap:0;margin-bottom:-1px}
.tab-btn{padding:10px 20px;font-size:13px;border:none;background:#e2e8f0;color:#64748b;cursor:pointer;border-radius:8px 8px 0 0;transition:all .15s}
.tab-btn.active{background:#fff;color:#1e293b;font-weight:600;box-shadow:0 -2px 6px rgba(0,0,0,.04)}
.tab-btn:hover:not(.active){color:#334155;background:#cbd5e1}

/* Tab panels */
.tab-panel{background:#fff;border-radius:0 8px 8px 8px;padding:28px;display:none;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.tab-panel.active{display:block}

/* Section heading */
.section-heading{font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid #f1f5f9}

/* Form field */
.field{margin-bottom:22px}
.field-label{display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px}
.field-hint{font-size:12px;color:#94a3b8;margin-top:4px;line-height:1.5}
.field-hint code{background:#f1f5f9;padding:1px 6px;border-radius:4px;font-size:12px;color:#ea580c}

input[type="text"],input[type="url"],textarea,select{
  width:100%;max-width:480px;background:#fff;border:1px solid #e2e8f0;padding:8px 12px;
  border-radius:6px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s
}
input[type="text"]:focus,input[type="url"]:focus,textarea:focus,select:focus{border-color:#f97316}
input:disabled,select:disabled,textarea:disabled{background:#f8fafc;color:#94a3b8;cursor:not-allowed}
textarea{resize:vertical;min-height:80px;line-height:1.5}
select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27%3E%3Cpath d=%27M2 4l4 4 4-4%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%271.5%27/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px}

/* Version picker */
.version-row{display:flex;align-items:center;gap:8px}
.version-row input{flex:1;max-width:260px}
.version-row select{flex:0 0 auto;max-width:180px}
.version-row .btn{flex:0 0 auto}

/* Toggle */
.toggle-row{display:flex;align-items:center;gap:10px}
.toggle{position:relative;display:inline-block;width:38px;height:22px;cursor:pointer}
.toggle input{opacity:0;width:0;height:0}
.toggle-slider{position:absolute;inset:0;background:#cbd5e1;border-radius:22px;transition:.2s}
.toggle-slider:before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}
.toggle input:checked+.toggle-slider{background:#f97316}
.toggle input:checked+.toggle-slider:before{transform:translateX(16px)}
.toggle-label{font-size:13px;color:#475569}

/* Buttons */
.btn{padding:8px 16px;border:none;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer;transition:all .15s}
.btn-primary{background:#f97316;color:#fff}
.btn-primary:hover{background:#ea580c}
.btn-secondary{background:#f1f5f9;color:#475569}
.btn-secondary:hover{background:#e2e8f0}
.btn-xs{padding:4px 10px;font-size:12px}
.actions{margin-top:24px;display:flex;gap:10px}

/* Toast */
.toast{position:fixed;top:20px;right:20px;padding:10px 18px;border-radius:8px;font-size:13px;z-index:9999;animation:slideIn .25s ease;box-shadow:0 4px 12px rgba(0,0,0,.12)}
.toast-ok{background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
.toast-err{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

/* Spinner */
.spinner{display:inline-block;width:14px;height:14px;border:2px solid #e2e8f0;border-top-color:#f97316;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-left:6px}
@keyframes spin{to{transform:rotate(360deg)}}

/* Auth */
#auth-loading{display:flex;align-items:center;justify-content:center;height:200px;color:#94a3b8;font-size:14px;gap:8px}
/* Hide main content by class so inline style can override it */
#main-content.hidden{display:none}
</style>
</head>
<body>
<script>
window.__I18N = {
  'zh-CN': {
    title: 'Worker 设置',
    loading: '正在验证权限…',
    back: '← 返回管理面板',
    tabFrontend: '前端版本',
    tabComment: '评论策略',
    clientVersionLabel: '@waline/client CDN 版本',
    clientVersionHint: '输入版本号（如 <code>v3</code>），留空默认使用 <code>latest</code>。',
    adminVersionLabel: '@waline/admin CDN 版本',
    adminVersionHint: '输入版本号（如 <code>0.34.1</code>），留空默认使用 <code>latest</code>。',
    workerDisplayLabel: 'Worker 信息显示',
    workerDisplayAlways: '始终显示',
    workerDisplayAdmin: '仅管理员登录',
    workerDisplayDisabled: '禁用',
    workerDisplayHint: '控制 Waline on Worker 标识的可见性。「始终」对所有人可见，「仅管理员」仅管理员登录后可见，「禁用」完全隐藏。',
    defaultStatus: '默认状态',
    anonymousStatusLabel: '匿名评论默认状态',
    anonymousStatusHint: '未登录用户发表评论的默认状态。此设置优先于环境变量 AUDIT。',
    userStatusLabel: '已登录用户评论默认状态',
    userStatusHint: '已登录用户发表评论的默认状态。',
    approved: '直接通过 (approved)',
    waiting: '等待审核 (waiting)',
    spamReview: '反垃圾评论',
    spamModeLabel: '反垃圾模式',
    spamModeHint: '「关」不检测；「Akismet」使用 Akismet 服务；「LLM」使用大模型；「Mix」两者并用，任一判定为垃圾则标记。',
    spamOff: '关',
    akismetKeyLabel: 'Akismet API Key',
    akismetKeyHint: '在此输入密钥，或通过 <strong>AKISMET_KEY</strong> 环境变量（<code>wrangler secret put AKISMET_KEY</code>）设置。环境变量优先级高于此处填写的值。',
    llmSkipAdminLabel: '管理员跳过 LLM 审查',
    llmSkipAdminToggle: '管理员发表的评论跳过 LLM 审查（默认开启）',
    llmEndpointLabel: 'API Endpoint',
    llmEndpointHint: 'OpenAI 兼容的 Chat Completions 端点',
    llmKeyLabel: 'API Key',
    llmModelLabel: 'Model',
    llmPromptLabel: 'System Prompt',
    llmFallbackHint: 'LLM 调用失败时，将遵循对应的评论默认状态设置。',
    testBtn: '测试 LLM 连接',
    saveBtn: '保存设置',
    refreshBtn: '↻ 刷新',
    chooseVersion: '选择版本…',
    versionsRefreshed: '版本列表已刷新',
    adminVersionsRefreshed: 'Admin 版本列表已刷新',
    fetchFailed: '获取版本失败: {msg}',
    loadFailed: '加载设置失败',
    saveOk: '设置已保存！',
    saveFailed: '保存失败',
    unauthorized: '权限不足，正在跳转登录页…',
    authFailed: '验证失败，请刷新重试。',
    llmOk: 'LLM 连接正常！',
    llmFail: '失败: {code}',
    llmError: '错误: {msg}',
    envOverride: '此设置被环境变量 / wrangler secret 覆盖',
    akismetLink: '申请地址：',
  },
  en: {
    title: 'Worker Settings',
    loading: 'Verifying permissions…',
    back: '← Back to Dashboard',
    tabFrontend: 'Frontend Versions',
    tabComment: 'Comment Policy',
    clientVersionLabel: '@waline/client CDN Version',
    clientVersionHint: 'Enter a version (e.g. <code>v3</code>). Leave blank to use <code>latest</code>.',
    adminVersionLabel: '@waline/admin CDN Version',
    adminVersionHint: 'Enter a version (e.g. <code>0.34.1</code>). Leave blank to use <code>latest</code>.',
    workerDisplayLabel: 'Worker Branding',
    workerDisplayAlways: 'Always Visible',
    workerDisplayAdmin: 'Admin Only',
    workerDisplayDisabled: 'Disabled',
    workerDisplayHint: 'Controls visibility of the Waline on Worker badge.',
    defaultStatus: 'Default Status',
    anonymousStatusLabel: 'Anonymous Comment Default',
    anonymousStatusHint: 'Default status for comments from unauthenticated users. Takes precedence over the AUDIT env var.',
    userStatusLabel: 'Authenticated User Comment Default',
    userStatusHint: 'Default status for comments from logged-in users.',
    approved: 'Approved',
    waiting: 'Pending Review (waiting)',
    spamReview: 'Spam Review',
    spamModeLabel: 'Spam Detection Mode',
    spamModeHint: '"Off" — no detection; "Akismet" — Akismet only; "LLM" — LLM only; "Mix" — both, mark as spam if either flags it.',
    spamOff: 'Off',
    akismetKeyLabel: 'Akismet API Key',
    akismetKeyHint: 'Enter the key here, or set <strong>AKISMET_KEY</strong> env var (<code>wrangler secret put AKISMET_KEY</code>). Env var takes precedence.',
    llmSkipAdminLabel: 'Skip Admin LLM Review',
    llmSkipAdminToggle: 'Skip LLM review for admin comments (enabled by default)',
    llmEndpointLabel: 'API Endpoint',
    llmEndpointHint: 'OpenAI-compatible Chat Completions endpoint',
    llmKeyLabel: 'API Key',
    llmModelLabel: 'Model',
    llmPromptLabel: 'System Prompt',
    llmFallbackHint: 'If the LLM call fails, the corresponding default comment status is used.',
    testBtn: 'Test LLM Connection',
    saveBtn: 'Save Settings',
    refreshBtn: '↻ Refresh',
    chooseVersion: 'Choose version…',
    versionsRefreshed: 'Version list refreshed',
    adminVersionsRefreshed: 'Admin version list refreshed',
    fetchFailed: 'Failed to fetch versions: {msg}',
    loadFailed: 'Failed to load settings',
    saveOk: 'Settings saved!',
    saveFailed: 'Failed to save',
    unauthorized: 'Access denied. Redirecting to login…',
    authFailed: 'Verification failed. Please refresh.',
    llmOk: 'LLM connection OK!',
    llmFail: 'Failed: {code}',
    llmError: 'Error: {msg}',
    envOverride: 'Overridden by environment variable / wrangler secret',
    akismetLink: 'Get a key at ',
  }
};
</script>

<!-- Header -->
<header class="typecho-head-nav">
  <div class="waline-header">
    <div class="brand">
      <span class="brand-mark"></span>
      <span data-i18n="title">Worker Settings</span>
    </div>
    <div class="nav-links">
      <div class="lang-toggle">
        <button data-lang="zh-CN" class="active">中</button>
        <button data-lang="en">EN</button>
      </div>
      <a href="/ui" data-i18n="back">← Back to Dashboard</a>
    </div>
  </div>
</header>

<div id="auth-loading">
  <span class="spinner"></span>
  <span data-i18n="loading">Verifying permissions…</span>
</div>

<div id="main-content" class="hidden">
<div class="container">
  <div class="tabs" id="tabs">
    <button class="tab-btn active" data-tab="frontend" data-i18n="tabFrontend">Frontend Versions</button>
    <button class="tab-btn" data-tab="comment" data-i18n="tabComment">Comment Policy</button>
  </div>

  <div class="tab-panel active" id="tab-frontend">
    <div class="field">
      <label class="field-label" data-i18n="clientVersionLabel">@waline/client CDN Version</label>
      <div class="version-row">
        <input type="text" id="set-version" placeholder="v3" />
        <select id="version-select">
          <option value="">Choose version…</option>
          <option value="latest">latest</option>
        </select>
        <button class="btn btn-secondary btn-xs" id="refresh-versions" data-i18n-title="refreshBtn">↻ Refresh</button>
      </div>
      <p class="field-hint" data-i18n-html="clientVersionHint">Enter a version (e.g. <code>v3</code>). Leave blank to use <code>latest</code>.</p>
    </div>
    <div class="field">
      <label class="field-label" data-i18n="adminVersionLabel">@waline/admin CDN Version</label>
      <div class="version-row">
        <input type="text" id="set-admin-version" placeholder="latest" />
        <select id="admin-version-select">
          <option value="">Choose version…</option>
          <option value="latest">latest</option>
        </select>
        <button class="btn btn-secondary btn-xs" id="refresh-admin-versions" data-i18n-title="refreshBtn">↻ Refresh</button>
      </div>
      <p class="field-hint" data-i18n-html="adminVersionHint">Enter a version (e.g. <code>0.34.1</code>). Leave blank to use <code>latest</code>.</p>
    </div>
    <div class="field">
      <label class="field-label" data-i18n="workerDisplayLabel">Worker Branding</label>
      <select id="set-worker-display">
        <option value="always" data-i18n="workerDisplayAlways">Always Visible</option>
        <option value="admin" selected data-i18n="workerDisplayAdmin">Admin Only</option>
        <option value="disabled" data-i18n="workerDisplayDisabled">Disabled</option>
      </select>
      <p class="field-hint" data-i18n="workerDisplayHint">Controls visibility of the Waline on Worker badge.</p>
    </div>
  </div>

  <div class="tab-panel" id="tab-comment">
    <h4 class="section-heading" data-i18n="defaultStatus">Default Status</h4>
    <div class="field">
      <label class="field-label" data-i18n="anonymousStatusLabel">Anonymous Comment Default</label>
      <select id="set-comment-status">
        <option value="approved" data-i18n="approved">Approved</option>
        <option value="waiting" data-i18n="waiting">Pending Review (waiting)</option>
      </select>
      <p class="field-hint" data-i18n="anonymousStatusHint">Default status for comments from unauthenticated users.</p>
    </div>
    <div class="field">
      <label class="field-label" data-i18n="userStatusLabel">Authenticated User Comment Default</label>
      <select id="set-user-comment-status">
        <option value="approved" data-i18n="approved">Approved</option>
        <option value="waiting" data-i18n="waiting">Pending Review (waiting)</option>
      </select>
      <p class="field-hint" data-i18n="userStatusHint">Default status for comments from logged-in users.</p>
    </div>

    <h4 class="section-heading" data-i18n="spamReview">Spam Review</h4>
    <div class="field">
      <label class="field-label" data-i18n="spamModeLabel">Spam Detection Mode</label>
      <select id="set-spam-mode">
        <option value="off" data-i18n="spamOff">Off</option>
        <option value="akismet">Akismet</option>
        <option value="llm">LLM</option>
        <option value="mix">Mix (Akismet + LLM)</option>
      </select>
      <p class="field-hint" data-i18n="spamModeHint">Select the spam detection method.</p>
    </div>

    <div id="section-akismet" style="display:none">
      <div class="field">
        <label class="field-label" data-i18n="akismetKeyLabel">Akismet API Key</label>
        <input type="text" id="set-akismet-key" placeholder="xxxxxxxxxxxx" />
        <p class="field-hint"><span data-i18n="akismetKeyHint">Enter the key here.</span> <span data-i18n="akismetLink">Get a key at </span><a href="https://akismet.com" target="_blank" rel="noopener">akismet.com</a></p>
      </div>
    </div>

    <div id="section-llm" style="display:none">
      <div class="field">
        <label class="field-label" data-i18n="llmSkipAdminLabel">Skip Admin LLM Review</label>
        <div class="toggle-row">
          <label class="toggle"><input type="checkbox" id="set-llm-skip-admin" checked /><span class="toggle-slider"></span></label>
          <span class="toggle-label" data-i18n="llmSkipAdminToggle">Skip LLM review for admin comments</span>
        </div>
      </div>
      <div class="field">
        <label class="field-label" data-i18n="llmEndpointLabel">API Endpoint</label>
        <input type="url" id="set-llm-ep" placeholder="https://api.openai.com/v1/chat/completions" />
        <p class="field-hint" data-i18n="llmEndpointHint">OpenAI-compatible Chat Completions endpoint</p>
      </div>
      <div class="field">
        <label class="field-label" data-i18n="llmKeyLabel">API Key</label>
        <input type="text" id="set-llm-key" placeholder="sk-..." />
      </div>
      <div class="field">
        <label class="field-label" data-i18n="llmModelLabel">Model</label>
        <input type="text" id="set-llm-model" placeholder="gpt-4o-mini" />
      </div>
      <div class="field">
        <label class="field-label" data-i18n="llmPromptLabel">System Prompt</label>
        <textarea id="set-llm-prompt" rows="5" placeholder="You are a review bot. Output a single word: approved or spam."></textarea>
      </div>
      <p class="field-hint" style="margin-top:16px" data-i18n="llmFallbackHint">If the LLM call fails, the corresponding default comment status is used.</p>
      <div style="margin-top:12px">
        <button class="btn btn-secondary btn-xs" id="test-btn" data-i18n="testBtn">Test LLM Connection</button>
      </div>
    </div>
  </div>

  <div class="actions">
    <button class="btn btn-primary" id="save-btn" data-i18n="saveBtn">Save Settings</button>
  </div>
</div>
</div>

<script>
(function(){
  var API = ${JSON.stringify(apiBase)};

  var currentLang = 'zh-CN';
  var SETTINGS_DATA = null;

  function t(key) { return window.__I18N[currentLang][key] || key; }

  var langBtns = document.querySelectorAll('.lang-toggle button');
  function applyLang(lang) {
    currentLang = lang;
    langBtns.forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-lang') === lang); });
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var k = el.getAttribute('data-i18n');
      if (k && !el.hasAttribute('data-i18n-html')) el.textContent = t(k);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){
      var k = el.getAttribute('data-i18n-html');
      if (k) el.innerHTML = t(k);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){
      var k = el.getAttribute('data-i18n-title');
      if (k) el.title = t(k);
    });
    document.querySelectorAll('#version-select option:first-child').forEach(function(o){ o.textContent = t('chooseVersion'); });
    document.querySelectorAll('#admin-version-select option:first-child').forEach(function(o){ o.textContent = t('chooseVersion'); });
    // Re-populate form with settings data
    if (SETTINGS_DATA) populateForm(SETTINGS_DATA);
  }
  langBtns.forEach(function(b){ b.addEventListener('click', function(){ applyLang(b.getAttribute('data-lang')); }); });

  var navLang = (navigator.language || 'en').toLowerCase();
  applyLang(navLang.startsWith('zh') ? 'zh-CN' : 'en');

  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  function toast(msg, ok) {
    var el = document.createElement('div');
    el.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 3000);
  }

  // --- Auth gate ---
  var urlToken = new URLSearchParams(location.search).get('token');
  var token = urlToken || localStorage.getItem('TOKEN') || sessionStorage.getItem('TOKEN');

  function showUnauthorized() {
    document.getElementById('auth-loading').innerHTML = '<span style="color:#ef4444">' + t('unauthorized') + '</span>';
    setTimeout(function(){
      location.href = '/ui/login?redirect=' + encodeURIComponent('/ui/worker-setting');
    }, 1200);
  }

  if (!token) { showUnauthorized(); return; }

  fetch(API + '/api/token', { headers: { Authorization: 'Bearer ' + token } })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.errno !== 0 || !d.data || d.data.type !== 'administrator') {
        showUnauthorized(); return;
      }
      document.getElementById('auth-loading').style.display = 'none';
      document.getElementById('main-content').classList.remove('hidden');
      initPage();
    })
    .catch(function(){
      document.getElementById('auth-loading').innerHTML = '<span style="color:#ef4444">' + t('authFailed') + '</span>';
    });

  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(API + '/api' + path, Object.assign({}, opts, { headers: headers })).then(function(r){ return r.json(); });
  }

  function updateSpamSections(mode) {
    var showAkismet = mode === 'akismet' || mode === 'mix';
    var showLlm = mode === 'llm' || mode === 'mix';
    document.getElementById('section-akismet').style.display = showAkismet ? '' : 'none';
    document.getElementById('section-llm').style.display = showLlm ? '' : 'none';
  }

  // Select dropdown to match a saved version string (by text or by rebuilding options)
  function selectVersionInDropdown(sel, version) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === version) { sel.selectedIndex = i; return; }
    }
    // If not in dropdown (custom version), add it as an option
    if (version && version !== 'latest') {
      var opt = document.createElement('option');
      opt.value = version;
      opt.textContent = version;
      sel.appendChild(opt);
      sel.value = version;
    }
  }

  // Populate form fields from settings object (does NOT touch version dropdowns)
  function populateForm(s) {
    document.getElementById('set-version').value = s.waline_client_version || 'v3';
    document.getElementById('set-admin-version').value = s.waline_admin_version || '';
    document.getElementById('set-comment-status').value = s.comment_default_status || 'approved';
    document.getElementById('set-user-comment-status').value = s.user_comment_default_status || 'approved';
    document.getElementById('set-worker-display').value = s.worker_display || 'admin';
    var spamMode = s.spam_mode || ((s.llm_mode && s.llm_mode !== 'off') ? 'llm' : 'off');
    document.getElementById('set-spam-mode').value = spamMode;
    updateSpamSections(spamMode);
    document.getElementById('set-akismet-key').value = s.akismet_key || '';
    document.getElementById('set-llm-skip-admin').checked = s.llm_skip_admin !== '0';
    document.getElementById('set-llm-ep').value = s.llm_endpoint || '';
    document.getElementById('set-llm-key').value = s.llm_api_key || '';
    document.getElementById('set-llm-model').value = s.llm_model || 'gpt-4o-mini';
    document.getElementById('set-llm-prompt').value = s.llm_prompt || 'You are a review bot. Output a single word: approved or spam.';
  }

  // Reselect dropdowns after versions are loaded (called from fetchVersions success callback)
  function reselectVersions() {
    if (!SETTINGS_DATA) return;
    selectVersionInDropdown(document.getElementById('version-select'), SETTINGS_DATA.waline_client_version || 'v3');
    selectVersionInDropdown(document.getElementById('admin-version-select'), SETTINGS_DATA.waline_admin_version || '');
  }

  function initPage() {
    // Tab switching
    var tabs = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = this.getAttribute('data-tab');
        tabs.forEach(function(t){ t.classList.remove('active'); });
        this.classList.add('active');
        panels.forEach(function(p){ p.classList.remove('active'); });
        document.getElementById('tab-' + target).classList.add('active');
      });
    });

    function fetchVersions(packageName, btnId, selId, okMsg) {
      var btn = document.getElementById(btnId);
      var sel = document.getElementById(selId);
      if (!btn || !sel) return;
      btn.disabled = true;
      btn.innerHTML = '↻<span class="spinner"></span>';
      fetch('https://data.jsdelivr.com/v1/packages/npm/' + packageName)
        .then(function(r){ return r.json(); })
        .then(function(data) {
          sel.innerHTML = '<option value="">' + t('chooseVersion') + '</option><option value="latest">latest' +
            (data.tags && data.tags.latest ? ' (' + esc(data.tags.latest) + ')' : '') + '</option>';
          if (data.versions) {
            data.versions.slice(0, 30).forEach(function(v) {
              var opt = document.createElement('option');
              opt.value = v.version;
              opt.textContent = v.version;
              sel.appendChild(opt);
            });
          }
          reselectVersions();
          toast(okMsg, true);
        })
        .catch(function(e){ toast(t('fetchFailed').replace('{msg}', e.message), false); })
        .finally(function(){ btn.disabled = false; btn.textContent = t('refreshBtn'); });
    }

    document.getElementById('refresh-versions').addEventListener('click', function(){
      fetchVersions('@waline/client', 'refresh-versions', 'version-select', t('versionsRefreshed'));
    });
    document.getElementById('version-select').addEventListener('change', function() {
      if (this.value) document.getElementById('set-version').value = this.value;
    });
    document.getElementById('refresh-admin-versions').addEventListener('click', function(){
      fetchVersions('@waline/admin', 'refresh-admin-versions', 'admin-version-select', t('adminVersionsRefreshed'));
    });
    document.getElementById('admin-version-select').addEventListener('change', function() {
      if (this.value) document.getElementById('set-admin-version').value = this.value;
    });

    document.getElementById('set-spam-mode').addEventListener('change', function() {
      updateSpamSections(this.value);
    });

    // Load settings first, then fetch versions (which reselect after fetch completes)
    api('/settings').then(function(sr) {
      var s = sr.data || {};
      SETTINGS_DATA = s;
      populateForm(s);

      var overrides = sr.env_overrides || [];
      var overrideDisabledFields = ['akismet_key','spam_mode','llm_skip_admin','llm_endpoint','llm_api_key','llm_model','llm_prompt'];
      overrideDisabledFields.forEach(function(k) {
        if (overrides.indexOf(k) !== -1) {
          var el = document.getElementById('set-' + k) ||
                   document.getElementById('set-' + k.replace(/_/g, '-'));
          if (el) { el.disabled = true; el.title = t('envOverride'); }
        }
      });

      // Now that SETTINGS_DATA is populated, fetch versions (will reselect on complete)
      fetchVersions('@waline/client', 'refresh-versions', 'version-select', t('versionsRefreshed'));
      fetchVersions('@waline/admin', 'refresh-admin-versions', 'admin-version-select', t('adminVersionsRefreshed'));
    }).catch(function(){ toast(t('loadFailed'), false); });

    document.getElementById('save-btn').addEventListener('click', function() {
      var settings = {
        waline_client_version: document.getElementById('set-version').value.trim() || 'v3',
        waline_admin_version: document.getElementById('set-admin-version').value.trim() || '',
        comment_default_status: document.getElementById('set-comment-status').value,
        user_comment_default_status: document.getElementById('set-user-comment-status').value,
        worker_display: document.getElementById('set-worker-display').value,
        spam_mode: document.getElementById('set-spam-mode').value,
        akismet_key: document.getElementById('set-akismet-key').value.trim(),
        llm_skip_admin: document.getElementById('set-llm-skip-admin').checked ? '1' : '0',
        llm_endpoint: document.getElementById('set-llm-ep').value.trim(),
        llm_api_key: document.getElementById('set-llm-key').value.trim(),
        llm_model: document.getElementById('set-llm-model').value.trim(),
        llm_prompt: document.getElementById('set-llm-prompt').value.trim(),
      };
      api('/settings', { method: 'PUT', body: JSON.stringify(settings) }).then(function(r) {
        toast(r.errno ? (r.errmsg || t('saveFailed')) : t('saveOk'), !r.errno);
      }).catch(function(){ toast(t('saveFailed'), false); });
    });

    document.getElementById('test-btn').addEventListener('click', function() {
      var ep = document.getElementById('set-llm-ep').value.trim();
      var key = document.getElementById('set-llm-key').value.trim();
      var model = document.getElementById('set-llm-model').value.trim();
      if (!ep || !key) { toast(t('fetchFailed').replace('{msg}','Endpoint and Key required'), false); return; }
      fetch(ep, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+key },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [{ role:'user', content:'Hello, respond with OK' }], max_tokens:10 }) })
      .then(function(r) { toast(r.ok ? t('llmOk') : t('llmFail').replace('{code}',r.status), r.ok); })
      .catch(function(e) { toast(t('llmError').replace('{msg}',e.message), false); });
    });
  }
})();
</script>
</body>
</html>`;
}
