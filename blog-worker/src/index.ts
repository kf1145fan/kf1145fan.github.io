import { Hono } from "hono";
import type { Env, UserInfo, Variables } from "./waline/env.js";
import walineApp from "./waline/subapp.js";
import { auth } from "./waline/middleware/auth.js";
import { unzipSync } from "fflate";
import { renderAdminPage } from "./admin-ui.js";
import { renderAdminLoginPage } from "./admin-login.js";

// 整合后的完整 Bindings：博客文章(gh + D1 评论) + Waline(JWT/D1)
type Bindings = Env & {
  DB: D1Database;
  JWT_SECRET?: string;
  SITE_URL?: string;
  // 文章发布
  GH_TOKEN?: string;
  GH_REPO?: string;
  GH_BRANCH?: string;
  POSTS_DIR?: string;
  PAGES_URL?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// ---------- 1. 统一鉴权（复用 Waline 管理员 JWT）----------
function isAdmin(user?: UserInfo): boolean {
  return !!user && user.type === "administrator";
}

// ---------- 2. Waline 评论系统挂载到 /waline/* ----------
// 主题中 serverURL 设为 blog.902786.xyz/waline，客户端会自动拼接 /api/xxx
app.route("/waline", walineApp);

// ---------- 3. 健康检查 ----------
app.get("/api/health", async (c) => {
  const env = c.env as Bindings;
  const jwtSet = !!env.JWT_SECRET;
  return json({
    ok: true,
    worker: "blog-worker",
    waline: true,
    ver: "1.0.0",
    jwt_set: jwtSet,
    gh_token_set: !!env.GH_TOKEN,
  });
});

// ---------- 4. 文章管理 API（需 Waline 管理员 JWT）----------
app.use("/admin/api/*", auth);

app.get("/admin/api/posts", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleListPosts(c.env as Bindings);
});

app.get("/admin/api/post", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  const path = c.req.query("path") || "";
  if (!path) return json({ error: "path required" }, 400);
  return handleGetPost(c.env as Bindings, path);
});

app.post("/admin/api/post", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleWritePost(c.env as Bindings, await c.req.json(), false);
});

app.put("/admin/api/post", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleWritePost(c.env as Bindings, await c.req.json(), true);
});

app.delete("/admin/api/post", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  const path = c.req.query("path") || "";
  if (!path) return json({ error: "path required" }, 400);
  return handleDeletePost(c.env as Bindings, path);
});

// 部署工作流状态：/admin/api/build
app.get("/admin/api/build", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleBuildStatus(c.env as Bindings);
});

// ---------- 文件管理（GitHub Contents API）----------
app.get("/admin/api/branches", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleListBranches(c.env as Bindings);
});

app.get("/admin/api/files", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  const path = c.req.query("path") || "";
  const branch = c.req.query("branch") || "";
  return handleListFiles(c.env as Bindings, path, branch || undefined);
});

app.get("/admin/api/file", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  const path = c.req.query("path") || "";
  if (!path) return json({ error: "path required" }, 400);
  const branch = c.req.query("branch") || "";
  return handleGetFile(c.env as Bindings, path, branch || undefined);
});

app.put("/admin/api/file", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleSaveFile(c.env as Bindings, await c.req.json());
});

app.delete("/admin/api/file", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  const path = c.req.query("path") || "";
  if (!path) return json({ error: "path required" }, 400);
  const branch = c.req.query("branch") || "";
  return handleDeleteFile(c.env as Bindings, path, branch || undefined);
});

app.post("/admin/api/upload", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleUploadFile(c.env as Bindings, c.req.raw);
});

app.post("/admin/api/unzip", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleUnzipFile(c.env as Bindings, c.req.raw);
});

app.post("/admin/api/unzip-path", async (c) => {
  if (!isAdmin(c.get("userInfo"))) return json({ error: "unauthorized" }, 401);
  return handleUnzipByPath(c.env as Bindings, await c.req.json());
});

// ---------- 5. /admin 统一管理后台（Waline 风格 + Vditor）----------
// 独立登录页：未登录跳转到 /admin/login；已登录访问 /admin 直接渲染后台，不做跳转
app.get("/admin/login", (c) => c.html(renderAdminLoginPage(c.env.SITE_URL || "")));
app.get("/admin/login/", (c) => c.html(renderAdminLoginPage(c.env.SITE_URL || "")));
app.get("/admin", (c) => c.html(renderAdminPage(c.env.SITE_URL || "", c.env.GH_REPO || "")));
app.get("/admin/", (c) => c.html(renderAdminPage(c.env.SITE_URL || "", c.env.GH_REPO || "")));

// ---------- 6. 其余路径：反向代理 GitHub Pages 静态站点 ----------
app.all("*", async (c) => {
  const env = c.env as Bindings;
  const url = new URL(c.req.url);
  const path = url.pathname;

  // /ui（原 waline 后台）并入统一后台 /admin
  if (path === "/ui" || path.startsWith("/ui/")) {
    return Response.redirect(`${url.origin}/admin`, 302);
  }

  const pagesBase = (env.PAGES_URL || "https://kf1145fan.github.io").replace(
    /\/$/,
    "",
  );
  const target = new URL(path || "/", pagesBase);
  if (path.endsWith("/")) {
    target.pathname = `${path}index.html`;
  }
  try {
    const resp = await fetch(target.toString());
    if (resp.status === 404 && path !== "/") {
      const root = await fetch(pagesBase + "/");
      return new Response(root.body, {
        status: 200,
        headers: root.headers,
      });
    }
    return new Response(resp.body, { status: resp.status, headers: resp.headers });
  } catch (e) {
    return new Response("Worker proxy error: " + String(e), { status: 502 });
  }
});

// ==================== GitHub 文章 CRUD 逻辑 ====================

function ghConfig(env: Bindings) {
  const token = env.GH_TOKEN;
  const repo = env.GH_REPO || "kf1145fan/kf1145fan.github.io";
  const branch = env.GH_BRANCH || "main";
  const postsDir = env.POSTS_DIR || "source/_posts";
  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "user-agent": "blog-worker",
    "content-type": "application/json",
  };
  return { token, repo, branch, postsDir, headers };
}

async function handleListPosts(env: Bindings): Promise<Response> {
  const { token, repo, postsDir, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${postsDir}`,
      { headers },
    );
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    const data = (await res.json()) as any[];
    const posts = (data || [])
      .filter((f) => f.name?.endsWith(".md"))
      .map((f) => ({ name: f.name, path: f.path, sha: f.sha, size: f.size }))
      .sort((a, b) => String(b.name).localeCompare(String(a.name)));
    return json({ ok: true, posts });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

async function handleGetPost(env: Bindings, path: string): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`,
      { headers },
    );
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    const data = (await res.json()) as any;
    const raw = decodeURIComponent(escape(atob(data.content)));
    const parsed = parseFrontMatter(raw);
    return json({
      ok: true,
      post: { path: data.path, sha: data.sha, content: raw, ...parsed },
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

async function handleWritePost(
  env: Bindings,
  body: any,
  isUpdate: boolean,
): Promise<Response> {
  const { token, repo, branch, postsDir, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);

  const title = String(body.title || "").trim();
  const content = String(body.content || "");
  const tags = Array.isArray(body.tags) ? body.tags.map((x: any) => String(x)) : [];
  const categories = Array.isArray(body.categories)
    ? body.categories.map((x: any) => String(x))
    : [];
  const date = String(body.date || new Date().toISOString().slice(0, 10));
  const targetPath = String(body.path || "").trim();

  if (!title) return json({ ok: false, error: "title required" }, 400);
  if (!content) return json({ ok: false, error: "content required" }, 400);

  const slug = title
    .replace(/[^\w\u4e00-\u9fa5\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const filename = isUpdate && targetPath ? targetPath.split("/").pop()! : `${date}-${slug || "post"}.md`;
  const path = isUpdate && targetPath ? targetPath : `${postsDir}/${filename}`;

  // front matter
  const fm: string[] = ["---", `title: '${title.replace(/'/g, "\\'")}'`, `date: ${date} 00:00:00`];
  if (categories.length) fm.push(`categories:\n  ${categories.map((x: any) => `- ${x}`).join("\n  ")}`);
  if (tags.length) fm.push(`tags:\n  ${tags.map((x: any) => `- ${x}`).join("\n  ")}`);
  fm.push("---", "");
  const fileContent = fm.join("\n") + (isUpdate ? stripFrontMatter(content) : content) + "\n";

  const rawApi = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`;
  let sha: string | undefined;
  try {
    const exist = await fetch(rawApi, { headers });
    if (exist.ok) sha = ((await exist.json()) as any).sha;
  } catch {}

  const payload: any = {
    message: isUpdate ? `docs: update post ${filename}` : `docs: add post ${filename}`,
    content: btoa(unescape(encodeURIComponent(fileContent))),
    branch,
  };
  if (sha) payload.sha = sha;

  try {
    const res = await fetch(rawApi, { method: "PUT", headers, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json({ ok: false, error: "github error: " + (data as any).message || res.status }, 502);
    return json({ ok: true, path, filename, message: "已提交，工作流会自动重建博客" });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

async function handleDeletePost(env: Bindings, path: string): Promise<Response> {
  const { token, repo, branch, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const rawApi = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}`;
    const exist = await fetch(rawApi, { headers });
    if (!exist.ok) return json({ ok: false, error: "not found" }, 404);
    const sha = ((await exist.json()) as any).sha;
    const res = await fetch(rawApi, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ sha, message: `docs: delete post ${path}`, branch }),
    });
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    return json({ ok: true, message: "已删除" });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

// ---------- front matter 解析 ----------
function parseFrontMatter(raw: string): {
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  body: string;
} {
  let title = "";
  const categories: string[] = [];
  const tags: string[] = [];
  let date = "";
  let body = raw;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (m) {
    const fm = m[1];
    body = m[2];
    const is = fm.match(/^title:\s*['"]?(.*?)['"]?\s*$/m);
    const ds = fm.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
    const cs = fm.match(/^categories:\s*([^\r\n]*)(?:\r?\n([\s\S]*?))?(?=\r?\n[a-zA-Z0-9_]+:|$)/im);
    const ts = fm.match(/^tags:\s*([^\r\n]*)(?:\r?\n([\s\S]*?))?(?=\r?\n[a-zA-Z0-9_]+:|$)/im);
    if (is) title = is[1].trim();
    if (ds) date = ds[1];
    const parseList = (inline: string | undefined, multi: string | undefined): string[] => {
      const out: string[] = [];
      if (inline && inline.trim()) {
        out.push(...inline.replace(/[[\]"]/g, "").split(",").map((s) => s.trim()).filter(Boolean));
      }
      if (multi) {
        for (const line of multi.split("\n")) {
          const v = line.trim().replace(/^-\s*/, "").trim();
          if (v) out.push(v);
        }
      }
      return out;
    };
    if (cs) categories.push(...parseList(cs[1], cs[2]));
    if (ts) tags.push(...parseList(ts[1], ts[2]));
  }
  return { title, date, categories, tags, body: body.replace(/<!--\s*more\s*-->[\s\S]*$/, "").trimStart() };
}

function stripFrontMatter(content: string): string {
  const m = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return (m ? m[1] : content).trimStart();
}

// ---------- 部署工作流状态 ----------
async function handleBuildStatus(env: Bindings): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    // 查询仓库最近一次 workflow run（deploy.yml 由 push 触发）
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/runs?per_page=1`,
      { headers },
    );
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    const data = (await res.json()) as any;
    const run = ((data.workflow_runs || []) as any[])[0];
    if (!run) return json({ ok: true, running: false, status: "none", conclusion: "none" });
    const running = run.status === "in_progress" || run.status === "queued" || run.status === "pending" || run.status === "waiting";
    return json({
      ok: true,
      running,
      status: run.status,
      conclusion: run.conclusion || "",
      name: run.name || run.display_title || "",
      started: run.created_at || "",
      html_url: run.html_url || "",
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

// ---------- 文件管理 ----------
function ghPath(path: string): string {
  return String(path || "").replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

async function handleListBranches(env: Bindings): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/branches?per_page=100`, { headers });
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    const data = (await res.json()) as any[];
    const branches = (data || []).map((b: any) => b.name).filter(Boolean);
    const current = ghConfig(env).branch;
    return json({ ok: true, branches, current });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

async function handleListFiles(env: Bindings, path: string, branch?: string): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  const useBranch = branch || ghConfig(env).branch;
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const clean = String(path || "").replace(/^\/+|\/+$/g, "");
    const url = clean
      ? `https://api.github.com/repos/${repo}/contents/${ghPath(clean)}?ref=${encodeURIComponent(useBranch)}`
      : `https://api.github.com/repos/${repo}/contents/?ref=${encodeURIComponent(useBranch)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 404) return json({ ok: false, error: "目录不存在" }, 404);
      return json({ ok: false, error: "github error " + res.status }, 502);
    }
    const data = (await res.json()) as any[];
    const items = (data || []).map((f: any) => ({
      name: f.name,
      path: f.path,
      type: f.type,
      size: f.size || 0,
    }));
    return json({ ok: true, path: clean, branch: useBranch, items });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

async function handleGetFile(env: Bindings, path: string, branch?: string): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  const useBranch = branch || ghConfig(env).branch;
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${ghPath(path)}?ref=${encodeURIComponent(useBranch)}`, { headers });
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    const d = (await res.json()) as any;
    if (d.type !== "file") return json({ ok: false, error: "不是文件" }, 400);
    // 二进制文件（图片等）仅返回元信息
    const raw = decodeURIComponent(escape(atob(d.content)));
    const isBinary = /[\x00-\x08\x0e-\x1f]/.test(raw.slice(0, 4096));
    return json({
      ok: true,
      path: d.path,
      sha: d.sha,
      size: d.size,
      content: isBinary ? "" : raw,
      binary: isBinary,
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

async function handleSaveFile(env: Bindings, body: any): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  const useBranch = String(body.branch || "").trim() || ghConfig(env).branch;
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  const path = String(body.path || "").trim();
  const content = String(body.content ?? "");
  if (!path) return json({ ok: false, error: "path required" }, 400);
  try {
    const rawApi = `https://api.github.com/repos/${repo}/contents/${ghPath(path)}`;
    let sha: string | undefined;
    const exist = await fetch(`${rawApi}?ref=${encodeURIComponent(useBranch)}`, { headers });
    if (exist.ok) sha = ((await exist.json()) as any).sha;
    const payload: any = {
      message: `docs: update ${path}`,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: useBranch,
    };
    if (sha) payload.sha = sha;
    const res = await fetch(rawApi, { method: "PUT", headers, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json({ ok: false, error: "github error: " + ((data as any).message || res.status) }, 502);
    return json({ ok: true, path, branch: useBranch, message: "已保存" });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

// 递归删除文件/目录（GitHub 目录需逐个删文件）
async function deletePath(env: Bindings, path: string, branch?: string): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  const useBranch = branch || ghConfig(env).branch;
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const rawApi = `https://api.github.com/repos/${repo}/contents/${ghPath(path)}`;
    const exist = await fetch(`${rawApi}?ref=${encodeURIComponent(useBranch)}`, { headers });
    if (!exist.ok) return json({ ok: false, error: "未找到 " + path }, 404);
    const data = (await exist.json()) as any;
    if (Array.isArray(data)) {
      for (const f of data as any[]) {
        const r = await deletePath(env, f.path, useBranch);
        const rr = (await r.json()) as { ok?: boolean };
        if (!rr.ok) return r;
      }
      return json({ ok: true, message: "已删除目录 " + path });
    }
    const res = await fetch(rawApi, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ sha: data.sha, message: `docs: delete ${path}`, branch: useBranch }),
    });
    if (!res.ok) return json({ ok: false, error: "github error " + res.status }, 502);
    return json({ ok: true, message: "已删除 " + path });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

async function handleDeleteFile(env: Bindings, path: string, branch?: string): Promise<Response> {
  return deletePath(env, path, branch);
}

// 上传文件（multipart：path=目标目录, branch=分支, files=多个文件）
async function handleUploadFile(env: Bindings, req: Request): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const form = await req.formData();
    const dir = String((form.get("path") || "") as string).replace(/^\/+|\/+$/g, "");
    const useBranch = String((form.get("branch") || "") as string).trim() || ghConfig(env).branch;
    const files = (form.getAll("files") as any[]).filter((f) => f && typeof f === "object") as File[];
    if (!files.length) return json({ ok: false, error: "没有文件" }, 400);
    const saved: string[] = [];
    for (const f of files) {
      const name = f.name.split("/").pop() || "";
      const target = dir ? `${dir}/${name}` : name;
      const buf = new Uint8Array(await f.arrayBuffer());
      const content = bytesToBase64(buf);
      const rawApi = `https://api.github.com/repos/${repo}/contents/${ghPath(target)}`;
      let sha: string | undefined;
      const exist = await fetch(`${rawApi}?ref=${encodeURIComponent(useBranch)}`, { headers });
      if (exist.ok) sha = ((await exist.json()) as any).sha;
      const payload: any = { message: `docs: upload ${target}`, content, branch: useBranch };
      if (sha) payload.sha = sha;
      const res = await fetch(rawApi, { method: "PUT", headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return json({ ok: false, error: `上传 ${name} 失败: ${(d as any).message || res.status}` }, 502);
      }
      saved.push(target);
    }
    return json({ ok: true, saved, message: `已上传 ${saved.length} 个文件` });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

// 解压 zip（multipart：path=目标目录, branch=分支, zip=zip 文件）
async function handleUnzipFile(env: Bindings, req: Request): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  try {
    const form = await req.formData();
    const dir = String((form.get("path") || "") as string).replace(/^\/+|\/+$/g, "");
    const useBranch = String((form.get("branch") || "") as string).trim() || ghConfig(env).branch;
    const zipFile = form.get("zip") as File | null;
    if (!zipFile) return json({ ok: false, error: "没有 zip 文件" }, 400);
    const buf = new Uint8Array(await zipFile.arrayBuffer());
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(buf);
    } catch {
      return json({ ok: false, error: "zip 解析失败，请确认是有效的 zip 文件" }, 400);
    }
    const saved: string[] = [];
    const failed: string[] = [];
    const names = Object.keys(entries || {}).filter((n) => n && !n.endsWith("/"));
    for (const name of names) {
      const target = dir ? `${dir}/${name}` : name;
      const rawApi = `https://api.github.com/repos/${repo}/contents/${ghPath(target)}`;
      let sha: string | undefined;
      const exist = await fetch(`${rawApi}?ref=${encodeURIComponent(useBranch)}`, { headers });
      if (exist.ok) sha = ((await exist.json()) as any).sha;
      const payload: any = { message: `docs: unzip ${target}`, content: bytesToBase64(entries[name]), branch: useBranch };
      if (sha) payload.sha = sha;
      const res = await fetch(rawApi, { method: "PUT", headers, body: JSON.stringify(payload) });
      if (!res.ok) { failed.push(name); continue; }
      saved.push(target);
    }
    return json({
      ok: true,
      saved,
      failed,
      message: `解压完成：成功 ${saved.length} 个` + (failed.length ? `，失败 ${failed.length} 个（${failed.slice(0, 3).join("、")}）` : ""),
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

// 解压仓库内的已在目录里的 zip 文件到当前目录（不要求再上传）
async function handleUnzipByPath(env: Bindings, body: any): Promise<Response> {
  const { token, repo, headers } = ghConfig(env);
  const useBranch = String(body.branch || "").trim() || ghConfig(env).branch;
  const zipPath = String(body.path || "").trim();
  if (!token) return json({ ok: false, error: "GH_TOKEN not configured" }, 500);
  if (!zipPath) return json({ ok: false, error: "path required" }, 400);
  try {
    // 1) 读取 zip 原始字节
    const dRes = await fetch(`https://api.github.com/repos/${repo}/contents/${ghPath(zipPath)}?ref=${encodeURIComponent(useBranch)}`, { headers });
    if (!dRes.ok) return json({ ok: false, error: "读取 zip 失败 " + dRes.status }, 502);
    const meta = (await dRes.json()) as any;
    if (meta.type !== "file") return json({ ok: false, error: "不是文件" }, 400);
    const base64 = meta.content.replace(/\s/g, "");
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    // 2) 解压
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(bytes);
    } catch {
      return json({ ok: false, error: "zip 解析失败，请确认是有效的 zip 文件" }, 400);
    }
    // 3) 目标目录 = zip 所在目录
    const dir = zipPath.split("/").filter(Boolean).slice(0, -1).join("/");
    const saved: string[] = [];
    const failed: string[] = [];
    const names = Object.keys(entries || {}).filter((n) => n && !n.endsWith("/"));
    for (const name of names) {
      const target = dir ? `${dir}/${name}` : name;
      const rawApi = `https://api.github.com/repos/${repo}/contents/${ghPath(target)}`;
      let sha: string | undefined;
      const exist = await fetch(`${rawApi}?ref=${encodeURIComponent(useBranch)}`, { headers });
      if (exist.ok) sha = ((await exist.json()) as any).sha;
      const payload: any = { message: `docs: unzip ${target}`, content: bytesToBase64(entries[name]), branch: useBranch };
      if (sha) payload.sha = sha;
      const res = await fetch(rawApi, { method: "PUT", headers, body: JSON.stringify(payload) });
      if (!res.ok) { failed.push(name); continue; }
      saved.push(target);
    }
    return json({
      ok: true,
      saved,
      failed,
      message: `解压完成：成功 ${saved.length} 个` + (failed.length ? `，失败 ${failed.length} 个（${failed.slice(0, 3).join("、")}）` : ""),
    });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export default app;