import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayoutEditor } from "@/components/editor/LayoutEditor";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { isDevPagesEnabled } from "@/lib/dev-pages";
import { createEditorState } from "@/lib/editor-state";
import { getLayoutPageData } from "@/lib/layout-page-data";
import { SUPPORTED_KEYBOARDS } from "@/lib/layout-submission";

/**
 * 配列の新規作成(P5-2〜P5-6)。最初は工場出荷時配列が入った状態から始める(人間の決定)。
 * ?from=<slug> のときは「コピーして編集」(P5-7): 元の配列の内容を複製して始める。
 * 投稿者名と「なぜこの配置にしたか」は投稿した本人のものなので複製しない。
 */

export const metadata: Metadata = {
  title: "配列を投稿する",
  robots: { index: false, follow: true },
};

export default async function NewLayoutPage(props: PageProps<"/new">) {
  const from = (await props.searchParams).from;
  const devMode = isDevPagesEnabled();

  if (typeof from === "string") {
    const data = await getLayoutPageData(from);
    const keyboard = data ? SUPPORTED_KEYBOARDS[data.layout.keyboardId] : undefined;
    if (!data || !keyboard) notFound();
    const { layout } = data;
    const initialState = createEditorState({
      keyboardId: layout.keyboardId,
      title: layout.title,
      tags: layout.tags,
      layers: layout.layers,
      combos: layout.combos,
      macros: layout.macros,
      forkedFromLayoutId: layout.id,
    });
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">配列をコピーして編集する</h1>
          <p className="text-sm text-zinc-600">
            元の配列のレイヤー・キーの割り当て・コンボ・マクロ・タグをコピーしました。タイトルは自由に変えてください。
          </p>
        </header>
        <LayoutEditor
          physicalLayout={keyboard}
          initialState={initialState}
          draftKey={`fork:${layout.slug}`}
          forkedFrom={{ slug: layout.slug, title: layout.title }}
          devMode={devMode}
        />
      </main>
    );
  }

  const initialState = createEditorState({ keyboardId: orcaEcho.id, layers: orcaEchoFactoryDefaultLayers });
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">配列を投稿する</h1>
        <p className="text-sm text-zinc-600">
          工場出荷時の配列が入った状態から始まります。変えたいキーだけ書き換えてください。
        </p>
      </header>
      <LayoutEditor physicalLayout={orcaEcho} initialState={initialState} draftKey="new" devMode={devMode} />
    </main>
  );
}
