# 博客 + Cloudflare Worker 后台

基于 **Hexo** 的静态博客（部署到 GitHub Pages），配一个 **Cloudflare Worker** 作为后台与后端：

- `/admin` 管理后台：发文/改文、文件管理、部署状态、访问量、订阅、AI 助手、站点设置
- `/waline`：评论系统（数据存 Cloudflare D1）
- `/api/visit`、`/api/subscribe`：访问量统计、邮件订阅
- 其余请求反向代理到 GitHub Pages，实现自定义域名访问

---

## 一、目录结构

| 路径 | 说明 |
| --- | --- |
| `source/_posts/` | Hexo 文章目录（Markdown） |
| `_config.yml` | Hexo 站点配置（`url`、`deploy` 等） |
| `blog-worker/` | Cloudflare Worker 源码 |
| `blog-worker/wrangler.toml` | Worker 配置（变量、D1 绑定、路由） |
| `blog-worker/migrations/` | D1 数据库迁移 SQL |
| `.github/workflows/` | 部署工作流 |

---

## 二、需要配置的东西

### 1. GitHub 仓库 Secrets

进入 GitHub 仓库 → **Settings → Secrets and variables → Actions → New repository secret**，添加：

| Secret | 必填 | 用途 |
| --- | --- | --- |
| `GH_TOKEN` | 是 | GitHub PAT，Worker 读写仓库/发文/删文件、工作流推送 gh-pages、订阅发布通知校验 |
| `CF_API_TOKEN` | 是 | Cloudflare API Token，部署 Worker、执行 D1 迁移 |
| `CF_ACCOUNT_ID` | 是 | Cloudflare 账户 ID |
| `JWT_SECRET` | 否 | 后台登录 JWT 密钥。不填则首次部署自动随机生成并存到 Worker，之后保持不变 |
| `WALINE_JWT_SECRET` | 否 | Waline 评论 JWT 密钥。不填则每次部署随机生成（评论登录态会失效） |

> `GH_TOKEN` 需要仓库的 **Contents 读写** 权限（fine-grained 或 classic `repo` 均可）。

### 2. Cloudflare API Token 权限

创建 Token 时至少勾选：

- `Workers Scripts: Edit`
- `D1: Edit`
- `Account Settings: Read`

### 3. Worker 变量（`blog-worker/wrangler.toml`）

```toml
[vars]
GH_REPO   = "kf1145fan/kf1145fan.github.io"  # 仓库 owner/repo
GH_BRANCH = "main"                            # Hexo 源分支
POSTS_DIR = "source/_posts"                   # 文章目录
PAGES_URL = "https://kf1145fan.github.io"     # GitHub Pages 地址
SITE_URL  = "https://blog.902786.xyz"         # 博客对外域名
```

改仓库/域名时，改这里即可。`GH_TOKEN`、`JWT_SECRET` 属于密钥，走 Secret 注入，**不要写进这个文件**。

### 4. D1 数据库

评论、访问量、订阅、站点设置都存在 D1：

```toml
[[d1_databases]]
binding       = "DB"
database_name = "waline-db"
database_id   = "5edf90b0-98f2-4258-a7ae-15db7e2ba0f6"
migrations_dir = "migrations"
```

若换成自己的库：新建 D1 → 把 `database_id` 换成新库 ID，并执行迁移（见下）。

### 5. 自定义域名路由（重要）

Worker 访问地址由 wrangler.toml 的 `[[routes]]` 决定，当前默认是注释状态：

```toml
# [[routes]]
# pattern = "blog.902786.xyz"
# custom_domain = true
```

要让 `blog.902786.xyz` 走这个 Worker，二选一：

- 在 Cloudflare 控制台 **Workers & Pages → blog-worker → Settings → Domains & Routes** 手动绑定自定义域名；或
- 取消上面注释，让部署时自动绑定。

> 注意：`workers_dev = false`，所以不会生成 `*.workers.dev` 地址，必须绑定自定义域名才能访问。
> 若域名未绑定到 Worker，访问 `/api/visit/stats` 之类接口会返回 **522**（Cloudflare 连不上源站）。

---

## 三、工作流：安装与运行

工作流都在 `.github/workflows/`，全部为 **手动触发（workflow_dispatch）**，`git push` 不会自动部署。

推送代码后，去 GitHub 仓库 → **Actions** 页，左侧选择要跑的工作流 → 右侧 **Run workflow** → 选 `main` 分支 → Run。也可用命令行：

```bash
# 需要已安装并登录 gh CLI
gh workflow run "完整部署：GH Pages + CF Worker" --ref main
gh workflow run "仅更新 Cloudflare Worker" --ref main
gh workflow run "仅更新 GitHub Pages" --ref main
```

或走 GitHub API：

```bash
curl -X POST \
  -H "Authorization: Bearer <你的 GH_TOKEN>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/kf1145fan/kf1145fan.github.io/actions/workflows/update-cf.yml/dispatches \
  -d '{"ref":"main"}'
```

### 三个工作流各自的用途

| 工作流 | 文件 | 做什么 | 何时用 |
| --- | --- | --- | --- |
| 完整部署：GH Pages + CF Worker | `deploy.yml` | 构建 Hexo → 推 gh-pages；部署 Waline Worker；部署 blog-worker | **首次部署**、或大改动需整体重建 |
| 仅更新 Cloudflare Worker | `update-cf.yml` | 只重新部署 blog-worker（含 D1 迁移） | 只改了 Worker 代码时（最常用） |
| 仅更新 GitHub Pages | `update-gh.yml` | 只重新构建 Hexo 并推 gh-pages | 只改了文章/主题时；后台「发布新文章」会自动带参数调用它 |

### 首次部署顺序

1. 配好上面所有 Secrets 与 `wrangler.toml`。
2. 新建/确认 D1 数据库并把 `database_id` 填对。
3. 运行 **完整部署**（`deploy.yml`），等三个 job 全部 success。
4. 绑定自定义域名到 Worker（见上文第 5 点）。
5. 打开 `https://blog.902786.xyz/admin` → 首次会引导**创建管理员**账号（无用户时 `needConfirm` 自动切到创建表单）。
6. 在后台「设置」里按需配置：SMTP 邮件、订阅模板、AI（接口地址 / 密钥 / 模型 / 权限）。

---

## 四、本地开发

```bash
# 1) 博客（仓库根目录）
npm install
npx hexo server          # http://localhost:4000
npx hexo generate        # 构建到 public/

# 2) Worker
cd blog-worker
npm install
npx wrangler dev         # 本地起 Worker，需本地 D1（wrangler dev 会自动建）
npx wrangler deploy      # 手动部署（需先 wrangler login）

# 3) 执行 D1 迁移（远程库）
npx wrangler d1 migrations apply waline-db --remote
```

---

## 五、常用地址

| 地址 | 说明 |
| --- | --- |
| `/admin` | 管理后台 |
| `/admin/login` | 登录 / 首次创建管理员 |
| `/api/health` | 健康检查（返回 jwt_set、gh_token_set） |
| `/api/visit/stats` | 访问量统计（今日 / 总量） |
| `/waline` | 评论服务 |

---

## 六、常见问题

- **改了代码但页面没变**：两个工作流都是手动触发，`push` 不会自动部署，需要去 Actions 手动运行 `update-cf.yml`。
- **访问接口返回 522**：自定义域名没绑定到 Worker，或绑定后源站不可达；检查第 2.5 节的域名路由。
- **登录态频繁失效**：未设置 `JWT_SECRET` 仓库 Secret，导致每次部署重新随机生成。
- **评论登录态失效**：同上，设置 `WALINE_JWT_SECRET`。