"use client";

import { PostFeed } from "@/components/post/PostFeed";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale";
import { parseAsStringLiteral, useQueryStates } from "nuqs";

const FEEDS = ["home", "all"] as const;
const SORTS = ["hot", "new", "top"] as const;

type FeedKind = (typeof FEEDS)[number];
type SortKind = (typeof SORTS)[number];

export function HomeContent() {
  const [t] = useT();
  const [{ feed, sort }, setParams] = useQueryStates({
    feed: parseAsStringLiteral(FEEDS).withDefault("home"),
    sort: parseAsStringLiteral(SORTS).withDefault("hot"),
  });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Tabs onValueChange={(details) => setParams({ feed: details.value as FeedKind })} value={feed}>
          <TabsList>
            <TabsTrigger value="home">{t.feed.home}</TabsTrigger>
            <TabsTrigger value="all">{t.feed.all}</TabsTrigger>
          </TabsList>
        </Tabs>

        <SimpleSelect
          ariaLabel={t.feed.hot}
          className="h-9 w-32 shrink-0 sm:h-8"
          items={[
            { value: "hot", label: t.feed.hot },
            { value: "new", label: t.feed.new },
            { value: "top", label: t.feed.top },
          ]}
          onChange={(value) => setParams({ sort: value as SortKind })}
          value={sort}
        />
      </div>

      <PostFeed feed={feed} key={`${feed}:${sort}`} sort={sort} withWorkCarousels />
    </div>
  );
}
