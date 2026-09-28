import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayoutList } from "@/components/LayoutList";
import { tagPath } from "@/components/LayoutView";
import { getKeyboardsFor } from "@/lib/layout-page-data";
import { LAYOUTS_PER_PAGE, decodeTagParam, parsePageParam, totalPages } from "@/lib/layout-page-utils";
import { listLayouts } from "@/lib/layout-repository";

/** タグでの絞り込み: そのタグが付いた配列だけを新しい順に表示する(P3-6) */

export async function generateMetadata(props: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const tag = decodeTagParam((await props.params).tag);
  return tag ? { title: `#${tag} の配列` } : {};
}

export default async function TagPage(props: PageProps<"/tags/[tag]">) {
  const tag = decodeTagParam((await props.params).tag);
  if (!tag) notFound();
  const page = parsePageParam((await props.searchParams).page);
  if (page === null) notFound();
  const { layouts, total } = await listLayouts({ page, perPage: LAYOUTS_PER_PAGE, tag });
  if (page > totalPages(total)) notFound();
  const keyboards = await getKeyboardsFor(layouts);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">{`#${tag} の配列`}</h1>
      <LayoutList
        layouts={layouts}
        keyboards={keyboards}
        total={total}
        page={page}
        basePath={tagPath(tag)}
        emptyMessage={`「#${tag}」が付いた配列はまだありません。`}
      />
    </main>
  );
}
