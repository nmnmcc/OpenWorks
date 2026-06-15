# AGENTS.md

> 本文件是给 AI 编码助手的项目指令，`CLAUDE.md` 为其符号链接。
>
> AI 编码助手在协作中收到的规矩、约定与纠正，须及时落实到本文件中。

## 通用规范

- **调试产生的临时文件一律存放于 `.dev/`**。禁止在项目其他位置创建临时文件。

## 代码正确性与风格一致性

- 编写或修改任何代码前，**始终**先参考项目现有代码与 `references/` 下的参考实现，确保代码的**完全正确性**与风格的**完全一致性**。
- `references/effect-smol` 是 Effect（`Effect-TS/effect-smol`）的源码参考，作为 API 用法、类型签名与编码风格的权威来源。涉及 Effect 相关写法时一律以其为准，不要凭记忆臆造 API。
- **谨慎使用 `as` 类型断言**。始终先测试不加 `as` 类型检查能否通过；绝不防御性地添加，绝不用 `as` 逃避类型错误。只有在确认无法通过类型系统正确表达时才可使用。
- **优先使用 Drizzle Queries API**（`db.query.*`）。能用 relational query 表达的查询就不用 query builder（`db.select().from()...`）写法。
- **禁止用条件展开模拟可选属性**。不要写 `...(x ? { key: x } : {})`，直接赋值：`key: x ?? undefined` 或 `key: x ? value : undefined`。
- **禁止无意义的浅拷贝展开**。Drizzle 返回的是普通对象，`new Post({ ...row })` 应写成 `new Post(row)`。
- **Yieldable 错误不要包装 `Effect.fail`**。`Schema.TaggedErrorClass` 等 yieldable 错误直接 `yield* new XxxError()`，不写 `yield* Effect.fail(new XxxError())`。
- **`database` 始终使用全称**，不简写为 `db`。
- **`index.ts` 是目录的入口模块，可含实现代码**。不要拆成纯转导出的 `index.ts` + 同名实现文件（如 `api/api.ts` + `api/index.ts`）。同目录内的其他文件不得从本目录的 `index.ts` 导入（防止循环依赖）。
- **超过三行的三元表达式用 `Match` 代替**。三元嵌套超过三行时，改用 Effect 的 `Match` API。
- **禁止使用 `switch/case`，一律用 Effect `Match` 代替**。所有基于值的多分支选择统一使用 `Match.value(...).pipe(Match.when(...), ..., Match.orElse(...))` 或 `Match.exhaustive`。
- **废除只使用一次的函数**。只用过一次的函数直接内联到调用处，只有被多处调用的才有提取成函数的资格。
- **布尔变量必须使用 `is`/`has`/`should`/`can` 前缀或形容词/过去分词形式**。裸动词+名词（如 `showResults`）读起来像函数调用，应改写为 `shouldShowResults` 或 `resultsVisible`。
- **优先使用 `export * from "..."` 简化转导出**。barrel 文件（`index.ts` 等）中转导出整个模块的公开 API 时，用 `export * from "./xxx"` 代替逐个列出 `export { A, B, C } from "./xxx"`。仅在需要筛选或重命名导出项时才使用具名转导出。
- **禁止直接访问 `._tag` 字段，使用相应模块的函数**。`Exit.isSuccess()`/`Exit.isFailure()`、`Option.isSome()`/`Option.isNone()`、`Either.isLeft()`/`Either.isRight()`；自定义可辨识联合用 `Data.TaggedEnum` 的 `$is`/`$match` 或 `Match` 模块。唯一例外：对 `unknown` 类型做 duck-typing 检查时（如通用错误翻译函数）无模块函数可用，允许直接检查 `_tag`。

## 后端规范（`packages/backend/`）

- **所有常量都在 Config 服务（`services/config/index.ts`）中定义**。分页限制、缓存时长、上传大小、CORS 来源、搜索索引名、Kafka consumer group、邀请令牌参数等任何行为参数都必须通过 `Config` 集中管理，不得在业务代码中直接写死魔法数字或配置字符串。

## 前端规范（`packages/frontend/`）

- **`components/ui/` 下的所有组件来自 `@shark` registry（`components.json` 中配置），是生成文件，禁止手动编辑**。更新一律通过 `env -u HTTP_PROXY -u HTTPS_PROXY npx shadcn add @shark/<name> --overwrite -c ./packages/frontend` 从上游拉取（须取消代理环境变量，否则 TLS 握手失败）。`components.json` 的 `style` 必须为 `"radix-nova"`——`@shark` 组件基于 Ark UI（`asChild` 模式），`"base-*"` style 会触发 shadcn CLI 的 `transformAsChild` codemod 将 `asChild` 错误转换为 `render` prop（`@base-ui/react` 专用），导致类型错误。
- **能用服务端组件就不用客户端组件**。只有确实需要浏览器 API、状态或交互时才标注 `"use client"`。
- **从不重复造轮子**。如果存在可靠的库或组件能满足需求，直接使用，不自行实现。
- **每个有图形设计的页面/组件必须在导出前用 TSDoc 注释描述预期设计**。注释体的 ASCII art 使用纯英文（保证等宽字体对齐），其余说明文字使用中文；**必须包含四档断点的设计草图**：Mobile（<640px）、Tablet（640px–1023px）、Desktop（1024px–1535px）、Ultra-wide（≥1536px），分别展示该断点下的布局、元素排列、导航形态与间距变化。实现必须与 TSDoc 描述的设计完美一致。纯逻辑包裹组件（如 Providers、纯 context wrapper）不加无意义注释。
- **所有页面与组件必须适配四档屏幕宽度**。移动端（<640px）、平板端（640px–1023px）、桌面端（1024px–1535px）、超宽屏（≥1536px）四档均须显式考虑交互逻辑与布局差异——包括但不限于：导航收折/展开、侧边栏显隐、网格列数变化、触控与指针的交互差异、内容区最大宽度约束。不得假设某档与另一档表现相同而跳过处理。
- **必须处理所有尺寸极端情况**。每个组件须考虑内容为空、单行、超长文本、极窄视口（320px）、极宽视口（≥2560px）等边界条件，不得遗漏。
- **样式与 HTML 结构必须最简**。如果一个 class、wrapper 或属性的有无不影响渲染结果，则必须删除。零冗余，无死代码。
- **URL 搜索参数一律用 [nuqs](https://nuqs.dev) 管理**。使用 `useQueryState`/`useQueryStates` 代替 `next/navigation` 的 `useSearchParams`。`NuqsAdapter` 已集成在 `Providers` 中。跨页面导航时构造完整 URL（如 `router.push("/path?key=...")` ）不受此限。

## 前端交互铁律（`packages/frontend/`）

- **永远不要求用户手动操作 ID**。任何需要用户指定实体（用户、社区、帖子等）的交互，一律提供搜索/选择界面（搜索弹窗、combobox、自动补全），禁止要求用户粘贴或输入裸 ID。实体选择器以 `components/shared/UserPicker.tsx` / `SpacePicker.tsx` 为范本（Ark Combobox + 后端搜索端点 + 防抖）。
- **始终考虑列表数量爆炸**。所有渲染列表的地方必须假设数据量可无限增长。分页、虚拟滚动、搜索过滤三者至少取其一；下拉选择器的选项超出合理上限时必须改用搜索型选择器（combobox）。侧边栏、收件箱、管理列表等无一例外。列表分页统一使用 `components/shared/PagedList.tsx`（每页 `PAGE_SIZE` 条 + 末页满载显示"加载更多"，表格经 `renderContainer` 接入），对应后端列表端点必须提供 `limit`/`offset` 参数（默认值与上限由 Config `pagination` 管理）。
- **禁止为查单条状态拉取全量列表**。判断"当前用户是否已收藏/隐藏/加入"等单点状态时，必须使用按目标过滤的查询（如 `saved.list?postId=…&limit=1`、`GET /spaces/:id/membership`），禁止取回完整列表再在客户端 `find`/`some`。菜单内的状态查询置于懒挂载的 `MenuContent` 中，仅在打开时发起。
- **页面上下文已确立的信息不得在子元素中重复**。实体详情页（社区页、用户页、作品页等）的页头已声明了当前上下文，页内列表项不得再标注该上下文（社区页的帖子卡片不显示所属社区名，用户主页的帖子不显示作者名）。共享列表组件（如 `PostCard`）必须提供按上下文隐藏冗余字段的 prop，聚合流（首页、搜索）才显示完整归属信息。
- **同一事实在一屏内只展示一次**。任何统计或属性（成员数、创建时间、帖子数等）在同一页面内只允许出现在一个位置；页头与侧栏简介之间分工明确，不得各自重复同一字段。需要在多处提示同一事实时，保留信息层级最合理的一处，其余删除。
- **同一动作在一屏内只保留一个入口**。功能完全相同的按钮/链接（如"发帖"）不得在全局导航与页面局部同时出现；局部入口若存在（如预填当前社区的发帖按钮），全局入口须在该页面隐藏或降级，二者必须有行为差异才允许共存。每新增一个动作入口前，必须先检查当前页面已有入口并说明差异，"两处都放更顺手"不构成理由。

## 前端布局铁律（`packages/frontend/`）

> 事故背景一：`globals.css` 将 `body` 与所有 `main` 设为 flex column。flex 项的 auto margin
> 会取消 `align-items: stretch`，于是缺 `w-full` 的 `mx-auto max-w-*` 容器塌缩为
> fit-content——宽视口下整页收缩偏移；塌缩后左右留白依然对称，"看上去居中"完全不能
> 说明没塌。
>
> 事故背景二：弹窗的"body 滚动、footer 钉底"靠 `DialogContent`（`flex flex-col max-h-full`）
> 与 `DialogBody`/`DialogFooter` 之间**直接的** flex 父子链实现。一只裸 `<form>`（display:
> block）插在中间即断链：`flex-1`/`h-full` 在块级父亲下失效，body 失去滚动能力；内容一旦
> 超过卡片高度，footer 就被推出圆角卡片之外，悬在遮罩上、被视口底边裁切。该写法被复制进
> 全部 11 个表单弹窗，只因多数弹窗内容矮才长期潜伏——高视口下看不出任何异常。
>
> 以下规则没有例外，违反任何一条即视为任务未完成。

- **先认上下文，后写样式**。写或改任何涉及宽度/居中/拉伸的 class 前，必须先确认元素实际所处的格式化上下文（父级的 display 与 align-items，含 `globals.css` 的全局规则），并按该上下文的规则推导出最终几何。禁止凭块流直觉套用习惯写法，禁止"加上试试看"。
- **居中容器三件套**：`w-full max-w-* mx-auto` 三者必须同时出现，缺一不可。`mx-auto` 与 `max-w-*` 同用而缺 `w-full` 即为违规，见到即当场补齐，无论父级当前是否 flex。仅收缩居中（徽章、按钮等）可用 `w-fit mx-auto`，且此时不得出现 `max-w-*`。
- **宽度必须可静态推导**。每个容器的最终宽度必须能仅凭其 class 列表与父内容宽唯一确定（如 `w-full max-w-6xl mx-auto` ⇒ min(父内容宽, 72rem) 且居中）。若结果还取决于内容刚好多宽、或父级恰好是什么 display，该写法即违规，必须改写成可推导的形式。
- **包裹层不是几何中立的，断开约束链即违规**。`DialogContent` ↔ `DialogBody`/`DialogFooter` 这类成对组件靠**直接** flex 父子关系传递高度约束（`flex flex-col max-h-*` ↔ `flex-1`/`h-full` + `min-h-0` + `overflow-auto`）。在两者之间插入任何产生 DOM 节点的元素（最典型是 `<form>`，任何 `<div>` 同罪）都会把约束链断成块流——`flex-1`/`h-full` 静默失效，溢出转嫁给视觉层。插入者必须显式接链，把父级的角色完整演下去：`<form className="flex min-h-0 flex-col">`。不产生 DOM 节点的 `Suspense`/`ErrorBoundary` 不断链，无须处理，但其 fallback 元素同样身处该 flex 上下文，几何照样要按上下文推导。
- **同行并列元素必须同时给出窄、宽两端的处置方案，并画进 ASCII 预览**。凡一行内并列多个元素（flex row、单行 grid、inline 序列），必须显式回答两个问题并落实到 class：**宽度不足时**——谁收缩截断（flex 子项默认 `min-width: auto` 不会收缩，截断项必须 `min-w-0` + `truncate` 才真正生效）、谁换行（`flex-wrap`）、谁降级隐藏（`hidden sm:inline`）、谁滚动（`overflow-x-auto`），不参与收缩的固定项（图标、按钮、计数、头像）必须 `shrink-0`；**宽度过大时**——谁伸展吃掉多余空间（`flex-1`/`w-full`/`justify-between`）、谁封顶（`max-w-*`）、多余留白落在哪里。两个答案都必须体现在 TSDoc 四档 ASCII 预览中：Mobile 草图标注截断/换行/隐藏项（如 `LongSpaceNam..` 或 `^truncate`、`(wraps)`、`"+Post" label hidden`），Ultra-wide 草图标注伸展/封顶项（如 `^-- flex-1 --^`、`max-w-md`）。"内容目前不长所以放得下"不构成处置方案。
- **同行并列的控件必须等高，同列堆叠的等价元素必须等宽**。同一行内并列的可交互控件（按钮、输入框、选择器、触发器、头像按钮）必须落在同一高度档位——同一 size 档或显式同 `h-*`，不得 `sm`（h-7）按钮与 `md`（h-8）输入框混排；文本与控件混排时用 `items-center`/`items-baseline` 显式声明对齐。同一列纵向堆叠的等价元素（堆叠按钮、表单控件、列表卡片）必须等宽——`w-full`、同一定宽或由列上下文 stretch，参差即违规。等高/等宽必须可静态推导（直接读 class 列表即可验证），并体现在 ASCII 预览或其标注中。
- **高度轴与宽度轴同权，浮层必须实测溢出行为**。凡内容高度可变的浮层（对话框、抽屉、popover，尤其内含富文本编辑器、动态列表、可增行表单的），除四档宽度外还必须在矮视口（≤700px 高）实际渲染并目检：浮层整体在视口内、footer 始终贴在圆角卡片内侧底部、body 在卡片内部出现滚动、圆角边界之外无任何内容。内容恰好放得下不算验证过溢出——必须制造超高内容（或压低视口）让滚动真实发生后才许声称完成。
- **四档视口实测后才许声称完成**。任何影响布局的改动，必须在 320px（Mobile）、768px（Tablet）、1280px（Desktop）与 ≥2560px（Ultra-wide）四档视口下实际渲染并目检：整页骨架居中、留白对称、`main` 占满分配宽度、无水平溢出、导航/侧边栏形态与 TSDoc 设计一致。只在单一常用宽度下看过不算验证；无法实测时必须如实声明未验证，不得宣称完成。

## API 层规范（`packages/backend/src/services/api/`）

- **禁止使用 `Effect.die` / `Effect.orDie`**。对于无法归类的错误，一律 map 到 `HttpApiError.InternalServerError`。
- **错误映射必须逐个 `Effect.catchTag`**。禁止编写任何辅助函数（如 `const mapXxxError = Effect.mapError(...)`），也禁止直接 `Effect.mapError` 一揽子映射所有错误。始终手写每个 tag 的 catch。
- **禁止使用 `let` 等可变数据结构**。完全采用不可变数据流，所有绑定均使用 `const`。
- `interfaces/` 与 `implementations/` 中的每个文件代表一个 API group，两个目录之间保持**一一对应**。

## Portable Text

- **整个项目端到端采用 [Portable Text](https://www.portabletext.org/)，严格遵循官方推荐做法**。所有用户创作的富文本内容（帖子正文、评论、Wiki 页面、私信等）从编辑、传输、校验到存储均为 Portable Text，任何环节不得引入纯文本/Markdown/HTML 中间层。
- 后端以 `libraries/portable-text.ts` 中的 Effect Schema（`PortableText`）为唯一校验来源：API 入参经它校验，数据库以 `jsonb` 列存储其 `Type`。该 schema 须与规范一致——markDef 条目除 `_key`/`_type` 外**允许并保留任意附加属性**（如 link 的 `href`），不得在校验中剥除。
- 前端编辑一律使用官方编辑器 **`@portabletext/editor`**（工具栏用 `@portabletext/toolbar` hooks，快捷键用 `@portabletext/keyboard-shortcuts`），统一封装在 `components/shared/PortableTextEditor.tsx`；展示一律用 `@portabletext/react`（`components/shared/PortableTextView.tsx`）。禁止手写纯文本→Portable Text 转换（`textToPortableText` 之类）。
- 前端提交前用后端同一 schema（`@openworks/backend/portable-text` 导出）decode，保证两端校验同源。
- 块/列表/标记命名遵循规范默认集：style `normal`/`h1`…/`blockquote`，list `bullet`/`number`，decorator `strong`/`em`/`underline`/`strike-through`/`code`，annotation `link`（字段 `href`）。
- **Markdown 仅作为编辑器内的输入手势，不是存储/传输格式**（不违反"无中间层"原则——编辑器状态与提交内容始终是 Portable Text）：输入时快捷转换用官方 `@portabletext/plugin-markdown-shortcuts`；粘贴纯文本经 `deserialize.data` behavior 用 `@portabletext/markdown` 的 `markdownToPortableText` 解析（schema 感知，超出 schema 的语法自动降级为纯文本块）。两者的类型映射一律按 schema 名称查找，不硬编码。
- 全文搜索索引存储纯文本，入库/同步时统一用 `portableTextToPlainText()` 转换。

## 数据库 Schema（`packages/backend/src/services/database/schema/`）

- **`auth.ts` 是生成文件，禁止手动编辑**（含注释）。由 `task auth:gen`（better-auth CLI）从 `services/auth/make.ts` 的配置生成。生成后唯一允许的手动修正：`relations` 的导入改为 `drizzle-orm/_relations`（drizzle-orm v1 主入口已不导出旧版 `relations`）。
- 用户表的扩展字段（如 `displayName`/`bio`/`banner`）通过 `make.ts` 的 `user.additionalFields` 声明，使生成输出包含它们，而不是事后改生成文件。
- `make.ts` 的 `generateId` 须保持 `"uuid"` 字面量，id 由数据库默认值 `gen_random_uuid()` 生成，生成器据此输出 `uuid` 列。改回自定义函数会使生成器输出 `text` 列，与全库 `uuid` 外键列类型不兼容（PostgreSQL 外键两端类型必须一致）。
