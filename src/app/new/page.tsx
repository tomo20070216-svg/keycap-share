import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutEditor } from "@/components/editor/LayoutEditor";
import { LinkPendingHint } from "@/components/LinkPendingHint";
import { KEYBOARDS, findKeyboard } from "@/keyboards";
import { isDevPagesEnabled } from "@/lib/dev-pages";
import { createEditorState } from "@/lib/editor-state";
import { getLayoutPageData } from "@/lib/layout-page-data";
import { SUPPORTED_KEYBOARDS } from "@/lib/layout-submission";
import { listPopularTags } from "@/lib/layout-repository";

/**
 * 配列の新規作成(P5-2〜P5-6)。最初は工場出荷時配列が入った状態から始める(人間の決定)。
 * 機種は ?keyboard=<機種のid> で選ぶ。指定がなければ、機種を選ぶ画面を出す(フェーズ8)。
 * ?from=<slug> のときは「コピーして編集」(P5-7): 元の配列の内容を複製して始める。
 * 投稿者名と「なぜこの配置にしたか」は投稿した本人のものなので複製しない。
 */

export const metadata: Metadata = {
  title: "配列を投稿する",
  robots: { index: false, follow: true },
};

export default async function NewLayoutPage(props: PageProps<"/new">) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;
  const devMode = isDevPagesEnabled();
  const popularTags = await listPopularTags();

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
          popularTags={popularTags}
        />
      </main>
    );
  }

  const keyboardParam = searchParams.keyboard;
  if (keyboardParam === undefined) return <KeyboardChooser />;
  const chosen = typeof keyboardParam === "string" ? findKeyboard(keyboardParam) : undefined;
  if (!chosen) notFound();

  const initialState = createEditorState({ keyboardId: chosen.layout.id, layers: chosen.factoryDefaultLayers });
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{`配列を投稿する(${chosen.layout.name})`}</h1>
        <p className="text-sm text-zinc-600">
          工場出荷時の配列が入った状態から始まります。変えたいキーだけ書き換えてください。
          <Link href="/new" className="ml-2 underline underline-offset-4">
            機種を選び直す
          </Link>
        </p>
      </header>
      <LayoutEditor
        physicalLayout={chosen.layout}
        initialState={initialState}
        // Orca echo はフェーズ8より前からの下書き("new")をそのまま使えるようにする
        draftKey={chosen.layout.id === "orca-echo" ? "new" : `new:${chosen.layout.id}`}
        devMode={devMode}
        popularTags={popularTags}
      />
    </main>
  );
}

/** 機種を選ぶ画面(フェーズ8) */
function KeyboardChooser() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">配列を投稿する</h1>
        <p className="text-sm text-zinc-600">投稿するキーボードの機種を選んでください。</p>
      </header>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {KEYBOARDS.map((k) => (
          <li key={k.layout.id}>
            <Link
              href={`/new?keyboard=${k.layout.id}`}
              data-testid="keyboard-choice"
              className="flex h-full flex-col gap-1 rounded-xl border border-zinc-300 p-4 hover:border-zinc-900 hover:bg-zinc-50"
            >
              <span className="text-lg font-bold">
                {k.layout.name}
                <LinkPendingHint label="開いています…" />
              </span>
              <span className="text-xs text-zinc-500">{`${k.maker}・キーマップの設定: ${k.toolName}`}</span>
              <span className="text-sm text-zinc-700">{k.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
