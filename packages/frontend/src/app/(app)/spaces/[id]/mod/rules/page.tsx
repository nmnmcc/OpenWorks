"use client";

import { Keys } from "@/atoms/keys";
import { createRuleAtom, deleteRuleAtom, rulesQuery, updateRuleAtom } from "@/atoms/rules";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import type { SpaceRuleEntry } from "@openworks/backend/api";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

interface RuleDialogProps {
  readonly spaceId: string;
  readonly rule?: SpaceRuleEntry;
  readonly nextPosition: number;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function RuleDialog({ spaceId, rule, nextPosition, open, onOpenChange }: RuleDialogProps) {
  const [t] = useT();
  const createRule = useAtomSet(createRuleAtom, { mode: "promise" });
  const updateRule = useAtomSet(updateRuleAtom, { mode: "promise" });

  const [title, setTitle] = useState(rule?.title ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (rule) {
        await updateRule({
          params: { id: rule.id },
          payload: {
            title: title.trim(),
            description: description.trim().length > 0 ? description.trim() : undefined,
          },
          reactivityKeys: [Keys.rules(spaceId)],
        });
      } else {
        await createRule({
          payload: {
            spaceId,
            title: title.trim(),
            description: description.trim().length > 0 ? description.trim() : undefined,
            position: nextPosition,
          },
          reactivityKeys: [Keys.rules(spaceId)],
        });
      }
      onOpenChange(false);
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog onOpenChange={(details) => onOpenChange(details.open)} open={open}>
      <DialogContent size="sm">
        <DialogHeader title={rule ? t.mod.rules.editTitle : t.mod.rules.add} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="rule-title">
                {t.mod.rules.ruleTitle}
              </label>
              <Input id="rule-title" onChange={(event) => setTitle(event.target.value)} required value={title} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="rule-description">
                {t.mod.rules.description}
              </label>
              <Textarea
                id="rule-description"
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                value={description}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button isLoading={busy} type="submit">
              {rule ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RulesSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(rulesQuery(spaceId));
  const updateRule = useAtomSet(updateRuleAtom, { mode: "promise" });
  const deleteRule = useAtomSet(deleteRuleAtom, { mode: "promise" });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SpaceRuleEntry | undefined>(undefined);

  const rules = [...result.value].sort((a, b) => a.position - b.position);
  const nextPosition = rules.reduce((max, rule) => Math.max(max, rule.position), 0) + 1;

  async function swapPositions(a: SpaceRuleEntry, b: SpaceRuleEntry) {
    try {
      await updateRule({
        params: { id: a.id },
        payload: { position: b.position },
        reactivityKeys: [],
      });
      await updateRule({
        params: { id: b.id },
        payload: { position: a.position },
        reactivityKeys: [Keys.rules(spaceId)],
      });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  async function handleDelete(rule: SpaceRuleEntry) {
    try {
      await deleteRule({ params: { id: rule.id }, reactivityKeys: [Keys.rules(spaceId)] });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.mod.rules.title}</h2>
        <Button
          onClick={() => {
            setEditingRule(undefined);
            setDialogOpen(true);
          }}
          size="sm"
        >
          <PlusIcon />
          {t.mod.rules.add}
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState title={t.mod.rules.empty} />
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule, index) => {
            const previous = rules[index - 1];
            const next = rules[index + 1];
            return (
              <Card className="flex-row items-center gap-2 p-3 [--space:--spacing(3)]" key={rule.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {index + 1}. {rule.title}
                  </p>
                  {rule.description !== null && (
                    <p className="text-muted-foreground truncate text-sm">{rule.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    aria-label={t.mod.rules.moveUp}
                    disabled={previous === undefined}
                    onClick={() => previous && swapPositions(rule, previous)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    aria-label={t.mod.rules.moveDown}
                    disabled={next === undefined}
                    onClick={() => next && swapPositions(rule, next)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    aria-label={t.common.edit}
                    onClick={() => {
                      setEditingRule(rule);
                      setDialogOpen(true);
                    }}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    aria-label={t.common.delete}
                    className="text-destructive"
                    onClick={() => handleDelete(rule)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <RuleDialog
          spaceId={spaceId}
          key={editingRule?.id ?? "new"}
          nextPosition={nextPosition}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          rule={editingRule}
        />
      )}
    </div>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +----------------------------------------------+
 * | Rules                          [+ Add Rule]  |
 * |----------------------------------------------|
 * | 1. Rule title          [^] [v] [Edit] [Del] |
 * |    Description text                          |
 * | 2. Rule title          [^] [v] [Edit] [Del] |
 * +----------------------------------------------+
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * 本页自身无断点，所有视口下结构一致。
 *
 * 规则列表，每项为 Card 横向布局。通过上/下箭头交换 position。
 * 宽度处置：标题行 = h2（固定短文本）+ [+ Add]（按钮自带 shrink-0），
 * justify-between 推开两端；规则行 = 左侧 min-w-0 flex-1（标题/描述
 * truncate 截断为省略号）+ 右侧 icon-sm 操作组（等高，shrink-0），
 * 宽端左侧伸展吃满余宽。
 * 新建/编辑通过 Dialog 完成。
 * 边界：0 条规则 → EmptyState。
 *       首项禁用上移，末项禁用下移。
 */
export default function ModRulesPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <RulesSection spaceId={params.id} />
    </ModBoundary>
  );
}
