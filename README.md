# OpenWorks

社区驱动的讨论与创作平台，围绕 Spaces（社区）、Posts（帖子）、Wiki 和 Works（作品库）构建。

## Tech Stack

**Frontend** — Next.js 16 · React 19 · Tailwind CSS 4 · Ark UI · Portable Text · nuqs

**Backend** — Effect · Drizzle ORM · PostgreSQL · Typesense · RabbitMQ · Redis · S3

**Infra** — Nomad · Docker

## Features

- **Spaces** — 公开 / 受限 / 私密社区，角色权限管理，邀请制加入
- **Posts** — 文本 / 链接 / 图片 / 投票，置顶、锁定、Flair 标签
- **Comments** — 无限层级嵌套评论
- **Wiki** — 社区 Wiki 页面，完整编辑历史
- **Works** — 书影音游作品库，评分评价，用户收藏与书架
- **Messages** — 用户间私信
- **Moderation** — 举报系统，审计日志，封禁 / 静音
- **Search** — 基于 Typesense 的全文搜索

## Development

### Prerequisites

- [Nix](https://nixos.org/) + [devenv](https://devenv.sh/)（提供 Node.js 24、Yarn 4、Nomad、go-task）
- [Docker](https://www.docker.com/)

### Quick Start

```bash
git clone https://github.com/nmnmcc/OpenWorks.git
cd OpenWorks

# 进入开发环境
devenv shell

# 安装依赖
yarn

# 启动全部服务（PostgreSQL、Redis、RabbitMQ、Typesense、前后端）
task dev
```

### Commands

```bash
task dev            # 启动全栈开发环境
task dev:stop       # 停止所有服务
task dev:reset      # 销毁数据并重启
task typecheck      # TypeScript 类型检查
task lint           # ESLint
task format         # Prettier 格式化
```

## License

[FSL-1.1-ALv2](LICENSE.md) — 非竞争用途自由使用，两年后转为 Apache 2.0。
