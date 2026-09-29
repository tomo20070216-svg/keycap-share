import type { Metadata } from "next";
import { LayoutEditor } from "@/components/editor/LayoutEditor";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { isDevPagesEnabled } from "@/lib/dev-pages";
import { createEditorState } from "@/lib/editor-state";

/** 配列の新規作成(P5-2〜P5-6)。最初は工場出荷時配列が入った状態から始める(人間の決定) */

export const metadata: Metadata = {
  title: "配列を投稿する",
  robots: { index: false, follow: true },
};

export default function NewLayoutPage() {
  const initialState = createEditorState({ keyboardId: orcaEcho.id, layers: orcaEchoFactoryDefaultLayers });
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">配列を投稿する</h1>
        <p className="text-sm text-zinc-600">
          工場出荷時の配列が入った状態から始まります。変えたいキーだけ書き換えてください。
        </p>
      </header>
      <LayoutEditor physicalLayout={orcaEcho} initialState={initialState} draftKey="new" devMode={isDevPagesEnabled()} />
    </main>
  );
}
