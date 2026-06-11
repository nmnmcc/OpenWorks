"use client";

import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverBody, PopoverContent } from "@/components/ui/popover";
import { useT } from "@/lib/i18n/locale";
import type { PortableTextContent } from "@/lib/portable-text";
import { cn } from "@/lib/utils";
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
  type RenderAnnotationFunction,
  type RenderDecoratorFunction,
  type RenderPlaceholderFunction,
  type RenderStyleFunction,
} from "@portabletext/editor";
import { defineBehavior, raise } from "@portabletext/editor/behaviors";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import { bold, code, italic, link, strikeThrough, underline } from "@portabletext/keyboard-shortcuts";
import { markdownToPortableText } from "@portabletext/markdown";
import { MarkdownShortcutsPlugin, type MarkdownShortcutsPluginProps } from "@portabletext/plugin-markdown-shortcuts";
import {
  useAnnotationButton,
  useDecoratorButton,
  useHistoryButtons,
  useListButton,
  useStyleSelector,
  useToolbarSchema,
  type ExtendAnnotationSchemaType,
  type ExtendDecoratorSchemaType,
  type ExtendListSchemaType,
  type ToolbarAnnotationSchemaType,
  type ToolbarDecoratorSchemaType,
  type ToolbarListSchemaType,
  type ToolbarStyleSchemaType,
} from "@portabletext/toolbar";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  Redo2Icon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

/**
 * Portable Text schema definition shared by all editing surfaces.
 * Names follow the names recommended by the specification so that
 * `@portabletext/react` renders the stored content with its defaults.
 */
const schemaDefinition = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }, { name: "underline" }, { name: "strike-through" }, { name: "code" }],
  styles: [{ name: "normal" }, { name: "h1" }, { name: "h2" }, { name: "h3" }, { name: "blockquote" }],
  lists: [{ name: "bullet" }, { name: "number" }],
  annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
  inlineObjects: [],
  blockObjects: [],
});

/**
 * Markdown 输入快捷转换（`# ` 标题、`> ` 引用、`- `/`1. ` 列表、
 * `**粗体**`、`[文字](url)` 等）。全部按 schema 名称查找，与
 * schemaDefinition 解耦。
 */
const markdownShortcutsProps: MarkdownShortcutsPluginProps = {
  boldDecorator: ({ context }) => context.schema.decorators.find((decorator) => decorator.name === "strong")?.name,
  italicDecorator: ({ context }) => context.schema.decorators.find((decorator) => decorator.name === "em")?.name,
  codeDecorator: ({ context }) => context.schema.decorators.find((decorator) => decorator.name === "code")?.name,
  strikeThroughDecorator: ({ context }) =>
    context.schema.decorators.find((decorator) => decorator.name === "strike-through")?.name,
  linkObject: ({ context, props }) => {
    const schemaType = context.schema.annotations.find((annotation) => annotation.name === "link");
    const hrefField = schemaType?.fields.find((field) => field.name === "href" && field.type === "string");
    if (!schemaType || !hrefField) {
      return undefined;
    }
    return { _type: schemaType.name, [hrefField.name]: props.href };
  },
  defaultStyle: ({ context }) => context.schema.styles[0]?.value,
  headingStyle: ({ context, props }) => context.schema.styles.find((style) => style.name === `h${props.level}`)?.name,
  blockquoteStyle: ({ context }) => context.schema.styles.find((style) => style.name === "blockquote")?.name,
  unorderedList: ({ context }) => context.schema.lists.find((list) => list.name === "bullet")?.name,
  orderedList: ({ context }) => context.schema.lists.find((list) => list.name === "number")?.name,
};

/**
 * 粘贴纯文本时按 Markdown 解析为 Portable Text。转换是 schema 感知的：
 * schema 之外的语法（围栏代码块、分隔线、表格等）自动降级为纯文本块，
 * 普通无标记文本则原样成段，因此对非 Markdown 粘贴行为不变。
 */
function MarkdownPastePlugin() {
  const editor = useEditor();

  useEffect(() => {
    return editor.registerBehavior({
      behavior: defineBehavior({
        on: "deserialize.data",
        guard: ({ snapshot, event }) => {
          if (event.mimeType !== "text/plain") {
            return false;
          }
          const blocks = markdownToPortableText(event.data, {
            schema: snapshot.context.schema,
            keyGenerator: snapshot.context.keyGenerator,
          });
          return blocks.length === 0 ? false : { blocks };
        },
        actions: [({ event }, { blocks }) => [raise({ ...event, type: "deserialization.success", data: blocks })]],
      }),
    });
  }, [editor]);

  return null;
}

const renderStyle: RenderStyleFunction = (props) => {
  if (props.schemaType.value === "h1") {
    return <h1 className="my-1 text-2xl font-semibold">{props.children}</h1>;
  }
  if (props.schemaType.value === "h2") {
    return <h2 className="my-1 text-xl font-semibold">{props.children}</h2>;
  }
  if (props.schemaType.value === "h3") {
    return <h3 className="my-1 text-lg font-semibold">{props.children}</h3>;
  }
  if (props.schemaType.value === "blockquote") {
    return <blockquote className="text-muted-foreground my-1 border-s-2 ps-3">{props.children}</blockquote>;
  }
  return <>{props.children}</>;
};

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === "strong") {
    return <strong>{props.children}</strong>;
  }
  if (props.value === "em") {
    return <em>{props.children}</em>;
  }
  if (props.value === "underline") {
    return <u>{props.children}</u>;
  }
  if (props.value === "strike-through") {
    return <del>{props.children}</del>;
  }
  if (props.value === "code") {
    return <code className="bg-muted rounded px-1 font-mono text-[0.9em]">{props.children}</code>;
  }
  return <>{props.children}</>;
};

const renderAnnotation: RenderAnnotationFunction = (props) => {
  if (props.schemaType.name === "link") {
    return <span className="text-primary underline">{props.children}</span>;
  }
  return <>{props.children}</>;
};

function DecoratorButton({ schemaType }: { readonly schemaType: ToolbarDecoratorSchemaType }) {
  const button = useDecoratorButton({ schemaType });

  return (
    <Button
      aria-label={schemaType.title}
      disabled={button.snapshot.matches("disabled")}
      onClick={() => button.send({ type: "toggle" })}
      size="icon-sm"
      title={schemaType.title}
      type="button"
      variant={button.snapshot.matches({ enabled: "active" }) ? "secondary" : "ghost"}
    >
      {schemaType.icon && <schemaType.icon />}
    </Button>
  );
}

function ListButton({ schemaType }: { readonly schemaType: ToolbarListSchemaType }) {
  const button = useListButton({ schemaType });

  return (
    <Button
      aria-label={schemaType.title}
      disabled={button.snapshot.matches("disabled")}
      onClick={() => button.send({ type: "toggle" })}
      size="icon-sm"
      title={schemaType.title}
      type="button"
      variant={button.snapshot.matches({ enabled: "active" }) ? "secondary" : "ghost"}
    >
      {schemaType.icon && <schemaType.icon />}
    </Button>
  );
}

function AnnotationButton({ schemaType }: { readonly schemaType: ToolbarAnnotationSchemaType }) {
  const [t] = useT();
  const button = useAnnotationButton({ schemaType });
  const [href, setHref] = useState("");

  const isActive = button.snapshot.matches({ enabled: "active" });
  const isDialogShown = button.snapshot.matches({ enabled: { inactive: "showing dialog" } });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    button.send({ type: "add", annotation: { value: { href } } });
    setHref("");
  }

  return (
    <Popover
      modal={false}
      onOpenChange={(details) => {
        if (!details.open) {
          button.send({ type: "close dialog" });
        }
      }}
      open={isDialogShown}
    >
      <PopoverAnchor asChild>
        <Button
          aria-label={isActive ? t.editor.removeLink : schemaType.title}
          disabled={button.snapshot.matches("disabled")}
          onClick={() => button.send({ type: isActive ? "remove" : "open dialog" })}
          size="icon-sm"
          title={isActive ? t.editor.removeLink : schemaType.title}
          type="button"
          variant={isActive ? "secondary" : "ghost"}
        >
          {schemaType.icon && <schemaType.icon />}
        </Button>
      </PopoverAnchor>
      <PopoverContent>
        <PopoverBody>
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <Input
              aria-label={t.editor.linkHref}
              className="w-56"
              onChange={(event) => setHref(event.target.value)}
              placeholder="https://"
              required
              size="sm"
              type="url"
              value={href}
            />
            <Button size="sm" type="submit">
              {t.editor.addLink}
            </Button>
          </form>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

function StyleSelect({ schemaTypes }: { readonly schemaTypes: ReadonlyArray<ToolbarStyleSchemaType> }) {
  const [t] = useT();
  const selector = useStyleSelector({ schemaTypes: [...schemaTypes] });

  return (
    <SimpleSelect
      ariaLabel={t.editor.style}
      className="h-7 w-32"
      disabled={selector.snapshot.matches("disabled")}
      items={schemaTypes.map((style) => ({ value: style.name, label: style.title ?? style.name }))}
      onChange={(style) => selector.send({ type: "toggle", style })}
      value={selector.snapshot.context.activeStyle ?? "normal"}
    />
  );
}

function HistoryButtons() {
  const [t] = useT();
  const buttons = useHistoryButtons();
  const isDisabled = buttons.snapshot.matches("disabled");

  return (
    <>
      <Button
        aria-label={t.editor.undo}
        disabled={isDisabled}
        onClick={() => buttons.send({ type: "history.undo" })}
        size="icon-sm"
        title={t.editor.undo}
        type="button"
        variant="ghost"
      >
        <Undo2Icon />
      </Button>
      <Button
        aria-label={t.editor.redo}
        disabled={isDisabled}
        onClick={() => buttons.send({ type: "history.redo" })}
        size="icon-sm"
        title={t.editor.redo}
        type="button"
        variant="ghost"
      >
        <Redo2Icon />
      </Button>
    </>
  );
}

function Toolbar() {
  const [t] = useT();

  const extendDecorator: ExtendDecoratorSchemaType = (decorator) => {
    if (decorator.name === "strong") {
      return { ...decorator, icon: BoldIcon, shortcut: bold, title: t.editor.bold };
    }
    if (decorator.name === "em") {
      return { ...decorator, icon: ItalicIcon, shortcut: italic, title: t.editor.italic };
    }
    if (decorator.name === "underline") {
      return { ...decorator, icon: UnderlineIcon, shortcut: underline, title: t.editor.underline };
    }
    if (decorator.name === "strike-through") {
      return { ...decorator, icon: StrikethroughIcon, shortcut: strikeThrough, title: t.editor.strikethrough };
    }
    return { ...decorator, icon: CodeIcon, shortcut: code, title: t.editor.code };
  };

  const extendAnnotation: ExtendAnnotationSchemaType = (annotation) => ({
    ...annotation,
    icon: LinkIcon,
    shortcut: link,
    title: t.editor.link,
  });

  const extendList: ExtendListSchemaType = (list) =>
    list.name === "bullet"
      ? { ...list, icon: ListIcon, title: t.editor.bulletList }
      : { ...list, icon: ListOrderedIcon, title: t.editor.numberedList };

  const styleTitles: Record<string, string> = {
    normal: t.editor.styleNormal,
    h1: t.editor.styleH1,
    h2: t.editor.styleH2,
    h3: t.editor.styleH3,
    blockquote: t.editor.styleQuote,
  };

  const toolbarSchema = useToolbarSchema({
    extendDecorator,
    extendAnnotation,
    extendList,
    extendStyle: (style) => ({ ...style, title: styleTitles[style.name] ?? style.name }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
      <HistoryButtons />
      {toolbarSchema.styles && <StyleSelect schemaTypes={toolbarSchema.styles} />}
      {toolbarSchema.decorators?.map((decorator) => (
        <DecoratorButton key={decorator.name} schemaType={decorator} />
      ))}
      {toolbarSchema.lists?.map((list) => (
        <ListButton key={list.name} schemaType={list} />
      ))}
      {toolbarSchema.annotations?.map((annotation) => (
        <AnnotationButton key={annotation.name} schemaType={annotation} />
      ))}
    </div>
  );
}

interface PortableTextEditorProps {
  readonly id?: string;
  readonly initialValue?: PortableTextContent;
  readonly onChange: (blocks: ReadonlyArray<unknown> | undefined) => void;
  readonly placeholder?: string;
  readonly autoFocus?: boolean;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +------------------------------------------------------+
 * | [<] [>] [Normal v] [B] [I] [U] [S] [<>] [=] [1=] [@] |  <- toolbar, wraps
 * |------------------------------------------------------|
 * | Rich text content area...                            |
 * |                                                      |  <- min-h-24, grows
 * +------------------------------------------------------+
 *
 * Link popover (toolbar [@] button):
 * +---------------------------+
 * | [https://     ] [Add]     |  <- input shrinks (min-w-0), button shrink-0,
 * |                           |     both size=sm (equal height h-7)
 * +---------------------------+
 *  ^ max-w-(--available-width): popover never exceeds viewport at 320px
 *
 * 官方 Portable Text 编辑器（@portabletext/editor），以项目表单控件风格包裹
 * （border, focus ring）。工具栏由 @portabletext/toolbar hooks 构建；按钮自带
 * shrink-0 不收缩，窄视口（320px）下通过 flex-wrap 自动换行至多行，宽端聚左、
 * 留白落在行尾。链接弹窗：输入框 w-56 但可收缩（Input 自带 min-w-0），按钮
 * shrink-0，弹窗整体被 --available-width 封顶。内容区随内容增长；`className`
 * 作用于可编辑区（如提高 min-height）。Markdown 输入手势：键入快捷方式
 * （`# `, `> `, `- `, `**bold**`, …）即时转换，粘贴纯文本按 Markdown 解析。
 * `onChange` 在每次变更时发射原始 block 数组（空时为 undefined）；父组件在
 * 提交时用 `toPortableTextContent` 转换。
 */
export function PortableTextEditor({
  id,
  initialValue,
  onChange,
  placeholder,
  autoFocus,
  className,
}: PortableTextEditorProps) {
  // 编辑器把 placeholder 渲染进一个 absolute（left:0/right:0、无 top）的
  // 容器，包含块是 editable 的 padding box——水平 padding 因此失效，须由
  // placeholder 自行补偿（与下方 PortableTextEditable 的 px-3 保持一致）。
  const renderPlaceholder: RenderPlaceholderFunction = () => (
    <span className="text-muted-foreground/64 px-3">{placeholder}</span>
  );

  return (
    <EditorProvider
      initialConfig={{
        schemaDefinition,
        initialValue: initialValue === undefined ? undefined : [...initialValue],
      }}
    >
      <EventListenerPlugin
        on={(event) => {
          if (event.type === "mutation") {
            onChange(event.value);
          }
        }}
      />
      <MarkdownShortcutsPlugin {...markdownShortcutsProps} />
      <MarkdownPastePlugin />
      <div
        className={cn(
          "border-input dark:bg-input/30 w-full rounded-lg border bg-transparent shadow-xs/5",
          "transition-[color,box-shadow]",
          "focus-within:border-primary focus-within:ring-ring/32 focus-within:ring-[3px]",
        )}
      >
        <Toolbar />
        <PortableTextEditable
          autoFocus={autoFocus}
          className={cn("min-h-24 px-3 py-2 text-base outline-none md:text-sm", className)}
          id={id}
          renderAnnotation={renderAnnotation}
          renderDecorator={renderDecorator}
          renderPlaceholder={placeholder === undefined ? undefined : renderPlaceholder}
          renderStyle={renderStyle}
        />
      </div>
    </EditorProvider>
  );
}
