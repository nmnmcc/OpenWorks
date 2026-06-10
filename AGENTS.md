# AGENTS.md

> 本文件是给 AI 编码助手的项目指令，`CLAUDE.md` 为其符号链接。
>
> AI 编码助手在协作中收到的规矩、约定与纠正，须及时落实到本文件中。

## 代码正确性与风格一致性

- 编写或修改任何代码前，**始终**先参考项目现有代码与 `references/` 下的参考实现，确保代码的**完全正确性**与风格的**完全一致性**。
- `references/effect-smol` 是 Effect（`Effect-TS/effect-smol`）的源码参考，作为 API 用法、类型签名与编码风格的权威来源。涉及 Effect 相关写法时一律以其为准，不要凭记忆臆造 API。
- **谨慎使用 `as` 类型断言**。始终先测试不加 `as` 类型检查能否通过；绝不防御性地添加，绝不用 `as` 逃避类型错误。只有在确认无法通过类型系统正确表达时才可使用。
- **优先使用 Drizzle Queries API**（`db.query.*`）。能用 relational query 表达的查询就不用 query builder（`db.select().from()...`）写法。
- **禁止用条件展开模拟可选属性**。不要写 `...(x ? { key: x } : {})`，直接赋值：`key: x ?? undefined` 或 `key: x ? value : undefined`。
- **禁止无意义的浅拷贝展开**。Drizzle 返回的是普通对象，`new Post({ ...row })` 应写成 `new Post(row)`。
- **Yieldable 错误不要包装 `Effect.fail`**。`Schema.TaggedErrorClass` 等 yieldable 错误直接 `yield* new XxxError()`，不写 `yield* Effect.fail(new XxxError())`。
- **`database` 始终使用全称**，不简写为 `db`。

## API 层规范（`packages/backend/src/services/api/`）

- **禁止使用 `Effect.die` / `Effect.orDie`**。对于无法归类的错误，一律 map 到 `HttpApiError.InternalServerError`。
- **错误映射必须逐个 `Effect.catchTag`**。禁止编写任何辅助函数（如 `const mapXxxError = Effect.mapError(...)`），也禁止直接 `Effect.mapError` 一揽子映射所有错误。始终手写每个 tag 的 catch。
- **禁止使用 `let` 等可变数据结构**。完全采用不可变数据流，所有绑定均使用 `const`。
- `interfaces/` 与 `implementations/` 中的每个文件代表一个 API group，两个目录之间保持**一一对应**。

## 数据库 Schema（`packages/backend/src/services/database/schema/`）

- **`auth.ts` 是生成文件，禁止手动编辑**（含注释）。由 `task auth:gen`（better-auth CLI）从 `services/auth/make.ts` 的配置生成。生成后唯一允许的手动修正：`relations` 的导入改为 `drizzle-orm/_relations`（drizzle-orm v1 主入口已不导出旧版 `relations`）。
- 用户表的扩展字段（如 `displayName`/`bio`/`banner`）通过 `make.ts` 的 `user.additionalFields` 声明，使生成输出包含它们，而不是事后改生成文件。
- `make.ts` 的 `generateId` 须保持 `"uuid"` 字面量，id 由数据库默认值 `gen_random_uuid()` 生成，生成器据此输出 `uuid` 列。改回自定义函数会使生成器输出 `text` 列，与全库 `uuid` 外键列类型不兼容（PostgreSQL 外键两端类型必须一致）。
