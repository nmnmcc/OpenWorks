"use client";

import { authorPostsPageQuery } from "@/atoms/posts";
import { userQuery } from "@/atoms/users";
import { PostCard } from "@/components/post/PostCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { MessageComposeDialog } from "@/components/shared/MessageComposeDialog";
import { PagedList } from "@/components/shared/PagedList";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/locale";
import { useAtomSuspense } from "@effect/atom-react";
import { LibraryIcon, MailIcon, MessageSquareIcon, PencilIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

function UserProfileView({ id }: { readonly id: string }) {
  const [t] = useT();
  const { data: session } = authClient.useSession();
  const result = useAtomSuspense(userQuery(id));
  const [composeOpen, setComposeOpen] = useState(false);

  const user = result.value;
  const isMe = session?.user.id === id;

  return (
    <Card className="overflow-hidden pt-0">
      {user.banner !== null ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-32 w-full object-cover sm:h-44" src={user.banner} />
      ) : (
        <div className="bg-muted h-24" />
      )}

      <CardContent className="-mt-10 flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <Avatar className="border-card size-20 border-4 text-xl" size="lg">
            <AvatarImage alt={user.name} src={user.image ?? undefined} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {isMe ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/settings">
                <PencilIcon />
                {t.users.editProfile}
              </Link>
            </Button>
          ) : (
            <Button onClick={() => setComposeOpen(true)} size="sm" variant="outline">
              <MailIcon />
              {t.users.sendMessage}
            </Button>
          )}
        </div>

        <div>
          <h1 className="text-xl font-semibold wrap-anywhere">{user.displayName ?? user.name}</h1>
          <p className="text-muted-foreground text-sm wrap-anywhere">@{user.name}</p>
        </div>

        <p className="text-sm wrap-anywhere">
          {user.bio ?? <span className="text-muted-foreground">{t.users.noBio}</span>}
        </p>

        <p className="text-muted-foreground text-xs">
          {t.users.joined} <TimeAgo date={user.createdAt} />
        </p>
      </CardContent>

      <MessageComposeDialog onOpenChange={setComposeOpen} open={composeOpen} recipientId={id} />
    </Card>
  );
}

/**
 * Mobile (<640px):
 * +-----------------------------------+
 * | [Banner h-32 / muted h-24]       |
 * |-----------------------------------|
 * | (Avatar -mt-10)  [Edit/Message]  |
 * | Display Name                     |
 * | @username                        |
 * | Bio text                         |
 * | Joined 3mo ago                   |
 * +-----------------------------------+
 *            w-full
 *
 * Tablet (640-1023px):
 * +-------------------------------------------+
 * | [Banner sm:h-44 / muted h-24]            |
 * |-------------------------------------------|
 * | (Avatar -mt-10)       [Edit / Message]    |
 * | Display Name                              |
 * | @username                                 |
 * | Bio text                                  |
 * | Joined 3mo ago                            |
 * +-------------------------------------------+
 *       w-full max-w-2xl mx-auto
 *
 * Desktop (1024-1535px):
 * +--------------------------------------------------+
 * |       [Banner sm:h-44 / muted h-24]              |
 * |       -------------------------------------------|
 * |       (Avatar -mt-10)       [Edit / Message]     |
 * |       Display Name                               |
 * |       @username                                  |
 * |       Bio text                                   |
 * |       Joined 3mo ago                             |
 * +--------------------------------------------------+
 *          w-full max-w-2xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------------------+
 * |            [Banner sm:h-44 / muted h-24]                     |
 * |            -------------------------------------------        |
 * |            (Avatar -mt-10)       [Edit / Message]            |
 * |            Display Name                                      |
 * |            @username                                         |
 * |            Bio text                                          |
 * |            Joined 3mo ago                                    |
 * +--------------------------------------------------------------+
 *               w-full max-w-2xl mx-auto
 *
 * 资料卡之下（四档一致）：
 * +-----------------------------------+
 * | [Posts][Reviews][Library]        |
 * |  ^ TabsList，固定短标签不溢出     |
 * | Posts/Reviews: [PostCard] 列表    |
 * |   (PagedList, authorId 过滤)      |
 * | Library: 链接卡 x2                |
 * |   <640px 单列 / >=640px 双列      |
 * |   sm:grid-cols-2（等宽 stretch）  |
 * +-----------------------------------+
 *
 * max-w-2xl (42rem) 居中容器。Card overflow-hidden，banner 撑满 Card 宽度。
 * 行内宽度处置：头像行 = 头像（自带 shrink-0，固定 size-20）+ 操作按钮
 * （自带 shrink-0，固定短标签），justify-between 推开两端，320px 下两者
 * 合计仍小于行宽；显示名/@用户名/bio 均 wrap-anywhere（超长无空格串断行）。
 * 头像 (size-20) 通过 -mt-10 上移与 banner 重叠，border-4 border-card 形成间隔。
 * Banner 高度：<640px 时 h-32，>=640px 时 sm:h-44。
 * 边界：banner 为 null → 灰色占位块 (h-24 bg-muted)。
 *       自己的主页 → 显示"编辑"按钮（链接至 /settings）；他人 → "发消息"按钮。
 *       bio 为 null → muted 占位文字。
 *       帖子/评测 tab 0 条 → EmptyState；链接卡标题超长 → truncate。
 */
export default function UserProfilePage() {
  const [t] = useT();
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <SectionBoundary>
        <UserProfileView id={params.id} />
      </SectionBoundary>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">{t.users.tabs.posts}</TabsTrigger>
          <TabsTrigger value="reviews">{t.users.tabs.reviews}</TabsTrigger>
          <TabsTrigger value="library">{t.users.tabs.library}</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <SectionBoundary>
            <AuthorPosts authorId={params.id} kind="discussion" />
          </SectionBoundary>
        </TabsContent>
        <TabsContent value="reviews">
          <SectionBoundary>
            <AuthorPosts authorId={params.id} kind="review" />
          </SectionBoundary>
        </TabsContent>
        <TabsContent value="library">
          <LibraryLinks userId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuthorPosts({ authorId, kind }: { readonly authorId: string; readonly kind: "review" | "discussion" }) {
  const [t] = useT();

  return (
    <PagedList
      className="gap-3"
      emptyState={<EmptyState icon={<MessageSquareIcon />} title={t.common.noResults} />}
      pageQuery={(offset) => authorPostsPageQuery({ authorId, kind, offset })}
      renderPage={(posts) => posts.map((post) => <PostCard hideAuthor key={post.id} post={post} />)}
    />
  );
}

function LibraryLinks({ userId }: { readonly userId: string }) {
  const [t] = useT();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card className="p-0">
        <Link
          className="hover:bg-accent flex items-center gap-3 rounded-xl p-4 transition-colors"
          href={`/library/users/${userId}`}
        >
          <LibraryIcon className="text-muted-foreground size-5 shrink-0" />
          <span className="min-w-0 truncate text-sm font-medium">{t.users.tabs.viewLibrary}</span>
        </Link>
      </Card>
      <Card className="p-0">
        <Link
          className="hover:bg-accent flex items-center gap-3 rounded-xl p-4 transition-colors"
          href={`/library/shelves?ownerId=${userId}`}
        >
          <StarIcon className="text-muted-foreground size-5 shrink-0" />
          <span className="min-w-0 truncate text-sm font-medium">{t.users.tabs.viewShelves}</span>
        </Link>
      </Card>
    </div>
  );
}
