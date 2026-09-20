import { Hono } from "hono";

type Bindings = {
  GH_TOKEN?: string;
  GH_REPO?: string;
  GH_BRANCH?: string;
  POSTS_DIR?: string;
  ADMIN_USER?: string;
  ADMIN_PASS?: string;
  PAGES_URL?: string;
  WALINE_SERVER?: string;
  SITE_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// 简单 Basic Auth 校验
function checkAuth(req: Request, env: Bindings): boolean {
  const h = req.headers.get("authorization") || "";
  const [scheme, b64] = h.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !b64) return false;
  try {
    const [user, pass] = atob(b64).split(":");
    return user === (env.ADMIN_USER || "admin") && pass === (env.ADMIN_PASS || "");
  } catch {
    return false;
  }
}

// ---------- 核心：代理 GitHub Pages 静态站点 ----------
app.all("*", async (c) => {
  const env = c.env;
  const path = new URL(c.req.url).pathname;
  const pagesBase = (env.PAGES_URL || "https://kf1145fan.github.io").replace(/\/$/, "");

  // 后台与接口不走代理
  if (path === "/admin" || path.startsWith("/admin/")) {
    return c.html(renderAdmin());
  }
  if (path === "/ui" || path.startsWith("/ui/")) {
    return c.html(renderWalineUI(env.WALINE_SERVER || "https://waline.wn5.top"));
  }
  if (path === "/api/login") {
    return json({ ok: checkAuth(c.req.raw, env) }, checkAuth(c.req.raw, env) ? 200 : 401);
  }
  if (path === "/api/posts") {
    return await handleListPosts(env);
  }
  if (path === "/api/publish" && c.req.method === "POST") {
    return await handlePublish(c.req.raw, env);
  }
  if (path === "/api/health") {
    return json({ ok: true, worker: "blog-worker" });
  }

  // 其余路径：代理到 GitHub Pages
  const target = new URL(path || "/", pagesBase);
  if (path.endsWith("/")) {
    target.pathname = `${path}index.html`;
  }
  try {
    const resp = await fetch(target.toString());
    // 404 时回退到站点根
    if (resp.status === 404 && path !== "/") {
      const root = await fetch(pagesBase + "/");
      return new Response(root.body, { status: 200, headers: root.headers });
    }
    return new Response(resp.body, { status: resp.status, headers: resp.headers });
  } catch (e) {
    return new Response("Worker proxy error: " + String(e), { status: 502 });
  }
});

// ---------- 后台：发文章 ----------
async function handlePublish(req: Request, env: Bindings) {
  if (!checkAuth(req, env)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  const token = env.GH_TOKEN;
  if (!token) {
    return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  }
  const repo = env.GH_REPO || "kf1145fan/kf1145fan.github.io";
  const branch = env.GH_BRANCH || "main";
  const postsDir = env.POSTS_DIR || "source/_posts";

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }
  const title = String(body.title || "").trim();
  const content = String(body.content || "");
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];
  const categories = Array.isArray(body.categories) ? body.categories.map(String) : [];
  const date = String(body.date || new Date().toISOString().slice(0, 10));

  if (!title) return json({ ok: false, error: "title required" }, 400);
  if (!content) return json({ ok: false, error: "content required" }, 400);

  // 生成文件名：date-title.md（与 hexo scaffold 一致）
  const slug = title
    .replace(/[^\w\u4e00-\u9fa5\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const filename = `${date}-${slug || "post"}.md`;

  // front matter
  const fm: string[] = ["---", `title: '${title.replace(/'/g, "\\'")}'`, `date: ${date} 00:00:00`];
  if (categories.length) fm.push(`categories:\n  ${categories.map((x: string) => `- ${x}`).join("\n  ")}`);
  if (tags.length) fm.push(`tags:\n  ${tags.map((x: string) => `- ${x}`).join("\n  ")}`);
  fm.push("---", "");
  const fileContent = fm.join("\n") + content + "\n";

  // 通过 GitHub Contents API 写入，触发工作流自动重建
  const path = `${postsDir}/${filename}`;
  const rawApi = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "user-agent": "blog-worker",
    "content-type": "application/json",
  };

  // 检查是否已存在，获取 sha
  let sha: string | undefined;
  try {
    const exist = await fetch(rawApi, { headers });
    if (exist.ok) {
      sha = (await exist.json() as any).sha;
    }
  } catch {}

  const commitInfo = sha
    ? { message: `docs: update post ${filename}`, content: btoa(unescape(encodeURIComponent(fileContent))), sha }
    : { message: `docs: add post ${filename}`, content: btoa(unescape(encodeURIComponent(fileContent))) };

  try {
    const res = await fetch(rawApi, {
      method: "PUT",
      headers,
      body: JSON.stringify({ ...commitInfo, branch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json({ ok: false, error: "github error: " + (data as any).message || res.status }, 502);
    }
    return json({ ok: true, filename, path, message: "已提交，工作流会自动重建博客" });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

// ---------- 列出已有文章 ----------
async function handleListPosts(env: Bindings) {
  const token = env.GH_TOKEN;
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  const repo = env.GH_REPO || "kf1145fan/kf1145fan.github.io";
  const postsDir = env.POSTS_DIR || "source/_posts";
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${postsDir}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "blog-worker" },
    });
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    const data = await res.json() as any[];
    const posts = data.map((f) => ({ name: f.name, path: f.path, sha: f.sha, size: f.size }));
    return json({ ok: true, posts });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

// ---------- 管理后台 UI ----------
function renderAdmin(): string {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>博客管理后台</title>
<style>
:root{--bg:#0f172a;--card:#1e293b;--line:#334155;--txt:#e2e8f0;--muted:#94a3b8;--pri:#38bdf8;--ok:#4ade80;--err:#f87171}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;min-height:100vh}
.wrap{max-width:860px;margin:0 auto;padding:24px}h1{font-size:22px;margin:0 0 4px}.sub{color:var(--muted);font-size:13px;margin-bottom:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:16px}
.hidden{display:none}label{display:block;font-size:13px;color:var(--muted);margin:10px 0 4px}
input[type=text],input[type=password],input[type=date],textarea{width:100%;background:#0b1220;border:1px solid var(--line);border-radius:8px;color:var(--txt);padding:10px;font-size:14px;outline:none}
textarea{min-height:320px;font-family:ui-monospace,Menlo,monospace;resize:vertical}
input:focus,textarea:focus{border-color:var(--pri)}
.row{display:flex;gap:10px}.btn{background:var(--pri);color:#04121f;border:0;border-radius:8px;padding:11px 16px;font-size:14px;font-weight:600;cursor:pointer}
.btn:hover{filter:brightness(1.1)}.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--line)}
.msg{margin-top:12px;font-size:13px}.ok{color:var(--ok)}.err{color:var(--err)}
.post-list{list-style:none;margin:0;padding:0}.post-list li{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);font-size:14px}
.post-list li .name{color:var(--txt)}.post-list li a{color:var(--pri);text-decoration:none}
.badge{display:inline-block;background:#0b1220;border:1px solid var(--line);color:var(--muted);border-radius:6px;padding:4px 8px;font-size:12px;margin-left:6px}
</style></head><body><div class="wrap">
<h1>博客管理后台</h1><div class="sub">blog-worker · 发文章自动触发 GitHub 工作流</div>

<div class="card" id="loginCard">
  <div class="row"><input type="text" id="user" placeholder="账号"/></div>
  <div style="margin-top:10px"><input type="password" id="pass" placeholder="密码"/></div>
  <div style="margin-top:14px"><button class="btn" id="loginBtn">登录</button></div>
  <div class="msg" id="loginMsg"></div>
</div>

<div class="card hidden" id="panel">
  <div class="row" style="align-items:center;justify-content:space-between">
    <div style="font-weight:600">发布新文章</div>
    <button class="btn btn-ghost" id="logoutBtn">退出</button>
  </div>
  <label>标题</label><input type="text" id="title" placeholder="文章标题"/>
  <div class="row">
    <div style="flex:1"><label>日期</label><input type="date" id="date"/></div>
    <div style="flex:1"><label>分类（逗号分隔）</label><input type="text" id="categories" placeholder="分类"/></div>
  </div>
  <label>标签（逗号分隔）</label><input type="text" id="tags" placeholder="标签"/>
  <label>正文（Markdown）</label><textarea id="content" placeholder="# 标题&#10;&#10;正文内容..."></textarea>
  <div style="margin-top:14px"><button class="btn" id="pubBtn">发布文章</button></div>
  <div class="msg" id="pubMsg"></div>

  <label style="margin-top:24px">已有文章</label>
  <ul class="post-list" id="postList"></ul>
</div>

</div>
<script>
const b64u=u=>btoa(unescape(encodeURIComponent(u)));
let auth='';
const setMsg=(el,t,ok)=>{el.textContent=t;el.className='msg '+(ok?'ok':'err');};
document.getElementById('loginBtn').onclick=async()=>{
  const user=document.getElementById('user').value,pass=document.getElementById('pass').value;
  auth='Basic '+b64u(user+':'+pass);
  const r=await fetch('/api/login',{headers:{authorization:auth}});
  if(r.ok){document.getElementById('loginCard').classList.add('hidden');document.getElementById('panel').classList.remove('hidden');
    document.getElementById('date').value=new Date().toISOString().slice(0,10);loadPosts();}
  else setMsg(document.getElementById('loginMsg'),'登录失败，账号或密码错误',false);
};
document.getElementById('logoutBtn').onclick=()=>{auth='';location.reload();};
document.getElementById('pubBtn').onclick=async()=>{
  const title=document.getElementById('title').value.trim();
  const content=document.getElementById('content').value;
  const tags=document.getElementById('tags').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  const categories=document.getElementById('categories').value.split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  const date=document.getElementById('date').value;
  const msg=document.getElementById('pubMsg');
  if(!title||!content){setMsg(msg,'请填写标题和正文',false);return;}
  setMsg(msg,'正在提交并触发工作流...',true);
  const r=await fetch('/api/publish',{method:'POST',headers:{authorization:auth,'content-type':'application/json'},body:JSON.stringify({title,content,tags,categories,date})});
  const d=await r.json();
  if(d.ok){setMsg(msg,'发布成功：'+d.filename+'（工作流会自动重建，约1-2分钟后生效）',true);
    document.getElementById('title').value='';document.getElementById('content').value='';loadPosts();}
  else setMsg(msg,'发布失败：'+(d.error||r.status),false);
};
async function loadPosts(){
  const ul=document.getElementById('postList');ul.innerHTML='';
  const r=await fetch('/api/posts',{headers:{authorization:auth}});
  if(!r.ok)return;
  const d=await r.json();
  (d.posts||[]).slice().reverse().forEach(p=>{
    const li=document.createElement('li');
    li.innerHTML='<span class="name">'+p.name+'</span><a href="/" target="_blank">查看站点</a>';
    ul.appendChild(li);
  });
}
</script></body></html>`;
}

// ---------- Waline 评论 UI ----------
function renderWalineUI(server: string): string {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>评论</title>
<style>body{margin:0;background:#fff;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:20px}h1{font-size:18px}</style>
<link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css"/>
</head><body><div class="wrap">
<h1>博客评论</h1>
<div id="wl-comment"></div>
<script type="module">
import { init } from 'https://unpkg.com/@waline/client@v3/dist/waline.js';
init({el:'#wl-comment',serverURL:${JSON.stringify(server)},lang:'zh-CN',dark:'auto',path:location.pathname.replace(/index\\.html$/,'')});
</script>
</div></body></html>`;
}

export default app;