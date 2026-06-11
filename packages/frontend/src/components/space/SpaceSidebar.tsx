"use client";

import { rulesQuery } from "@/atoms/rules";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/lib/i18n/locale";
import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { Space } from "@openworks/backend/api";
import { BookOpenIcon, ShieldIcon } from "lucide-react";
import Link from "next/link";

function SpaceRules({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const result = useAtomValue(rulesQuery(spaceId));

  if (!AsyncResult.isSuccess(result) || result.value.length === 0) {
    return null;
  }

  const rules = [...result.value].sort((a, b) => a.position - b.position);

  return (
    <>
      <Separator />
      <div>
        <h3 className="mb-1 text-sm font-medium">{t.spaces.rules}</h3>
        <Accordion collapsible>
          {rules.map((rule, index) => (
            <AccordionItem key={rule.id} value={rule.id}>
              <AccordionTrigger className="py-2 text-sm wrap-anywhere">
                {index + 1}. {rule.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm wrap-anywhere">
                {rule.description ?? rule.title}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  );
}

interface SpaceSidebarProps {
  readonly space: Space;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +-----------------------------+
 * | About                       |
 * | Description text            |
 * | 42 members                  |
 * | Created 3mo ago             |
 * |-----------------------------|
 * | RULES                       |
 * | 1. Rule title  [v expand]   |
 * | 2. Rule title  [v expand]   |
 * |-----------------------------|
 * | [Wiki]                      |
 * | [Mod Tools]                 |
 * +-----------------------------+
 *
 * Card h-fit，所有断点布局一致（侧栏定位由父级控制）。
 * 内部 flex-col gap-3，规则列表用 Accordion（collapsible）折叠展开。
 * 宽度处置：纵向堆叠无同行并列；描述/规则标题/规则正文均 wrap-anywhere
 * （超长无空格词照样断行不溢出）；规则行标题与折叠箭头同行，标题折行、
 * 箭头由 Accordion 原语 shrink-0；卡片宽度由父级网格列决定（18rem/整列）。
 * 底部 Wiki / Mod Tools 为 ghost 按钮（justify-start）。
 * 边界：0 条规则 → 规则区（含 Separator）完全隐藏。
 *       description 为 null → 不渲染。
 */
export function SpaceSidebar({ space }: SpaceSidebarProps) {
  const [t] = useT();

  return (
    <Card className="h-fit">
      <CardHeader title={t.spaces.about} />
      <CardContent className="flex flex-col gap-3 text-sm">
        {space.description !== null && <p className="wrap-anywhere">{space.description}</p>}
        <div className="text-muted-foreground flex flex-col gap-1">
          <span>{t.spaces.members(space.memberCount)}</span>
          <span>
            {t.spaces.created} <TimeAgo date={space.createdAt} />
          </span>
        </div>

        <SpaceRules spaceId={space.id} />

        <Separator />
        <div className="flex flex-col gap-1.5">
          <Button asChild className="justify-start" size="sm" variant="ghost">
            <Link href={`/spaces/${space.id}/wiki`}>
              <BookOpenIcon />
              {t.spaces.wiki}
            </Link>
          </Button>
          <Button asChild className="justify-start" size="sm" variant="ghost">
            <Link href={`/spaces/${space.id}/mod`}>
              <ShieldIcon />
              {t.spaces.modTools}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
