import { notFound } from "next/navigation";
import { LayoutList } from "@/components/LayoutList";
import { getKeyboardsFor } from "@/lib/layout-page-data";
import { LAYOUTS_PER_PAGE, parsePageParam, parseSortParam, totalPages } from "@/lib/layout-page-utils";
import { listLayouts } from "@/lib/layout-repository";

/** トップページ: 配列の一覧(新着順(P3-5)・人気順(P7-7)) */
export default async function Home(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const page = parsePageParam(searchParams.page);
  const sort = parseSortParam(searchParams.sort);
  if (page === null || sort === null) notFound();
  const { layouts, total } = await listLayouts({ page, perPage: LAYOUTS_PER_PAGE, sort });
  if (page > totalPages(total)) notFound();
  const keyboards = await getKeyboardsFor(layouts);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">分割キーボードの配列を共有しよう</h1>
        <p className="text-zinc-600">
          分割キーボードのキー配列と「なぜこの配置にしたか」を投稿して、X(旧Twitter)で共有できるサイトです。
          まずは Keychron Orca echo に対応しています。
        </p>
      </section>
      <h2 className="text-lg font-bold">{sort === "popular" ? "人気の配列" : "新着の配列"}</h2>
      <LayoutList
        layouts={layouts}
        keyboards={keyboards}
        total={total}
        page={page}
        sort={sort}
        basePath="/"
        emptyMessage="まだ配列が投稿されていません。"
      />
    </main>
  );
}
