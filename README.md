# 保德方言词典 (Baode Dialect Dictionary)

> 记录我们的乡音，留住黄河畔的方言记忆。

保德方言词典是一个开源的方言文化数字工具，用于记录、查询和传承山西保德方言。支持关键字搜索、分门别类浏览、每日方言推荐、图片分享，以及维护者后台管理与用户投稿审核。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| 后端 | Node.js + Express + better-sqlite3 (SQLite) |
| 地图 | 高德地图 JS API（需自行申请 Key） |
| 工具 | react-router-dom, html-to-image, multer, jsonwebtoken, bcryptjs |

## 项目结构

```
baode-dict/
├── package.json                # 根目录脚本
├── server/                     # 后端
│   ├── .env.example            # 环境变量模板
│   ├── src/
│   │   ├── index.js            # Express 入口（同时托管前端静态文件）
│   │   ├── config.js           # 配置读取
│   │   ├── db.js               # SQLite 连接
│   │   ├── migrate.js          # 建表 + FTS5 全文搜索
│   │   ├── seed.js             # 种子数据（9分类 + 6示例词条 + 管理员）
│   │   ├── middleware/         # auth(JWT) / upload(multer) / error
│   │   ├── routes/             # auth / words / categories / submissions / daily
│   │   └── services/           # daily.service(推荐算法)
│   ├── data/                   # SQLite 数据库（自动生成，已 gitignore）
│   └── uploads/audio/          # 音频文件（自动生成，已 gitignore）
└── web/                        # 前端
    ├── vite.config.ts
    └── src/
        ├── router.tsx          # 路由表
        ├── lib/                # api.ts / auth.tsx / utils.ts
        ├── types/dict.ts       # 类型定义
        ├── components/         # layout / word / ui(shadcn)
        └── pages/              # public(5页) + admin(7页)
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repo-url>
cd baode-dict
```

### 2. 安装依赖

```bash
# 后端依赖
cd server && npm install

# 前端依赖
cd ../web && npm install
```

### 3. 配置环境变量

```bash
cd server
cp .env.example .env
# 编辑 .env，修改 JWT_SECRET 和 ADMIN_DEFAULT_PASSWORD
```

### 4. 构建前端 & 启动

```bash
# 构建前端
cd web && npm run build

# 启动服务（后端托管前端 + API，单端口）
cd ../server && npm start
```

启动后（前端查询展示）访问 http://localhost:8787
（后台维护配置）访问 http://localhost:8787/admin/login 登录后进管理后台

> 开发阶段如需热更新：`cd web && npm run dev` 启动 Vite 开发服务器，然后修改 `vite.config.ts` 中的代理配置指向后端 8787 端口。

### 5. 默认管理员账号

```
用户名：admin
密码：见 server/.env 中的 ADMIN_DEFAULT_PASSWORD（默认 change-me-after-seed）
```

> 修改密码后需删除 `server/data/baode.db*` 并重启以重新 seed。

## 功能说明

### 用户端

| 页面 | 路径 | 功能 |
|---|---|---|
| 首页 | `/` | 每日方言推荐 + 搜索 + 分类入口 + 热门标签 + 最近收录 |
| 搜索 | `/search?q=` | 关键字全文搜索（FTS5）+ 标签筛选 |
| 词条详情 | `/word/:id` | 方言词 + 保德拼音 + 国际音标 + 音频播放 + 例句 + 词源 + 图片分享 |
| 分类浏览 | `/category/:slug` | 分门别类浏览，像翻词典 |
| 投稿 | `/submit` | 用户增补新词 / 对已有词条纠错 |

### 维护者后台

| 页面 | 路径 | 功能 |
|---|---|---|
| 仪表盘 | `/admin` | 统计卡片 + 快捷入口 |
| 词条管理 | `/admin/words` | 列表 + 搜索 + 新增/编辑/删除 + IPA音标选择器 + 录音/音频上传 |
| 分类管理 | `/admin/categories` | 分类 CRUD |
| 投稿审核 | `/admin/submissions` | 待审/已通过/已驳回 + 审核可微调数据 |
| 每日推荐 | `/admin/daily` | 手动指定每日推荐词条 |

### 核心特性

- **每日方言推荐**：手动指定优先，未指定时自动加权随机（偏好奇有音频的冷门词）
- **图片分享**：html-to-image 生成竖版卡片（宋体 + 赭石配色），适配微信/朋友圈分享
- **全文搜索**：SQLite FTS5，搜方言词、释义、例句、标签、拼音
- **浏览器录音**：支持直接录音（WebRTC）或上传 mp3/wav
- **IPA 音标选择器**：点选国际音标符号插入，含分类标注

## 数据库

SQLite 单文件，首次启动时自动建表并写入种子数据。重置方法：

```bash
rm server/data/baode.db*
cd server && node src/seed.js
```

## 生产部署

项目采用**单服务器模式**：Express 同时提供 API 和前端静态文件。

```bash
cd web && npm run build    # 构建前端
cd ../server && npm start   # 启动服务（端口 8787）
```

建议搭配 Nginx 反向代理，启用 HTTPS 和 gzip 压缩。

## License

MIT
