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

### 3. Worker 变量（`blog-worker/wrangler.toml`）—— 通常无需填写

这些变量 Worker 都能自动识别，`wrangler.toml` 里保持默认（注释状态）即可：

| 变量 | 是否要填 | 说明 |
| --- | --- | --- |
| `GH_REPO` | 不用 | 部署时由工作流自动注入 `${{ github.repository }}` |
| `PAGES_URL` | 不用 | 未配置时按 `GH_REPO` 推导为 `https://<owner>.github.io` |
| `SITE_URL` | 不用 | 未配置时自动取**当前请求的域名**；绑定好域名后即生效，邮件里的链接也用它 |
| `GH_BRANCH` | 不用 | 默认 `main` |
| `POSTS_DIR` | 不用 | 默认 `source/_posts` |

只有需要覆盖默认行为时，才在 `wrangler.toml` 的 `[vars]` 里手填。`GH_TOKEN`、`JWT_SECRET` 属于密钥，走 Secret 注入，**不要写进这个文件**。

> **SITE_URL 是干什么的？** 就是博客的对外域名，用在邮件订阅的退订链接、评论通知里的站点地址等。现在它会自动取请求域名，所以绑好域名后不用手动配。

### 4. 仓库变量 Variables（可选）

进入 **Settings → Secrets and variables → Actions → Variables**，可添加：

| Variable | 说明 |
| --- | --- |
| `SITE_URL` | 你的博客对外域名（如 `https://blog.example.com`）。设置后：构建时用它作站点地址、发布通知回调到它、评论 `SECURE_DOMAINS` 用它 |

不设置也能跑：站点地址会按仓库自动推导为 `https://<owner>.github.io`。

### 5. D1 数据库（自动创建，无需手填）

评论、访问量、订阅、站点设置都存在 D1。**部署时会自动查询/创建名为 `waline-db` 的数据库并回填 id**，`wrangler.toml` 里保持占位符即可：

```toml
[[d1_databases]]
binding       = "DB"
database_name = "waline-db"
database_id   = "00000000-0000-0000-0000-000000000000"   # 占位符，部署时自动替换
migrations_dir = "migrations"
```

> 如果你在 Cloudflare 已有同名库会自动复用；没有则自动新建。想换库名，改 `database_name` 即可。

### 6. 访问地址（workers.dev / 自定义域名）

`workers_dev = true`，所以部署后会自动获得一个 `https://blog-worker.<你的子域>.workers.dev` 地址，**不绑域名也能先用**。

要绑定自己的域名，二选一：

- Cloudflare 控制台 **Workers & Pages → blog-worker → Settings → Domains & Routes** 手动绑定；或
- 取消 `wrangler.toml` 里 `[[routes]]` 的注释并改成自己的域名，让部署时自动绑定。

> 若域名已解析到其他服务但未绑定到 Worker，访问接口可能返回 **522**（Cloudflare 连不上源站）。

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
  https://api.github.com/repos/<owner>/<repo>/actions/workflows/update-cf.yml/dispatches \
  -d '{"ref":"main"}'
```

### 三个工作流各自的用途

| 工作流 | 文件 | 做什么 | 何时用 |
| --- | --- | --- | --- |
| 完整部署：GH Pages + CF Worker | `deploy.yml` | 构建 Hexo → 推 gh-pages；部署 Waline Worker；部署 blog-worker | **首次部署**、或大改动需整体重建 |
| 仅更新 Cloudflare Worker | `update-cf.yml` | 只重新部署 blog-worker（含 D1 迁移） | 只改了 Worker 代码时（最常用） |
| 仅更新 GitHub Pages | `update-gh.yml` | 只重新构建 Hexo 并推 gh-pages | 只改了文章/主题时；后台「发布新文章」会自动带参数调用它 |

### 首次部署顺序（fork 后同样适用）

1. **Fork 本仓库**（或复制到你自己的仓库）。
2. 在**你自己的仓库**里添加 3 个必需 Secrets：`GH_TOKEN`、`CF_API_TOKEN`、`CF_ACCOUNT_ID`（见第 1、2 节）。
3. （可选）加仓库 Variable `SITE_URL` 指向你的博客域名。
4. 运行 **完整部署**（`deploy.yml`），等 job 全部 success。D1 会自动创建，Worker 会自动配置。
5. 记下日志里的 `*.workers.dev` 地址，或绑定自定义域名（见第 6 节）。
6. 打开 `<你的地址>/admin` → 首次会引导**创建管理员**账号。
7. 在后台「设置」里按需配置：SMTP 邮件、订阅模板、AI（接口地址 / 密钥 / 模型 / 权限）。

> **任何人 fork 后都能直接部署**：仓库名、Pages 地址、D1 数据库、站点地址、访问域名全部自动识别，只需填上面 3 个 Secret。

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
- **访问接口返回 522**：自定义域名没绑定到 Worker，或绑定后源站不可达；检查第 6 节的域名路由。
- **不想配域名**：`workers_dev = true`，直接用日志里的 `*.workers.dev` 地址即可访问。
- **登录态频繁失效**：未设置 `JWT_SECRET` 仓库 Secret，导致每次部署重新随机生成。
- **评论登录态失效**：同上，设置 `WALINE_JWT_SECRET`。