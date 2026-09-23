import { Hono } from "hono";
import type { Env, UserInfo, Variables } from "./waline/env.js";
import walineApp from "./waline/subapp.js";
import { auth } from "./waline/middleware/auth.js";
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

// ---------- 5. /admin 统一管理后台（Waline 风格 + Vditor）----------
// 独立登录页：未登录跳转到 /admin/login；已登录访问 /admin 直接渲染后台，不做跳转
app.get("/admin/login", (c) => c.html(renderAdminLoginPage(c.env.SITE_URL || "")));
app.get("/admin/login/", (c) => c.html(renderAdminLoginPage(c.env.SITE_URL || "")));
app.get("/admin", (c) => c.html(renderAdminPage(c.env.SITE_URL || "")));
app.get("/admin/", (c) => c.html(renderAdminPage(c.env.SITE_URL || "")));

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
      .map((f) => ({ name: f.name, path: f.path, sha: f.sha, size: f.size }));
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

export default app;