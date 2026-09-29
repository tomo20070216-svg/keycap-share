import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditPageClient } from "@/app/k/[slug]/edit/EditPageClient";
import { createEditorState } from "@/lib/editor-state";
import { getLayoutPageData } from "@/lib/layout-page-data";
import { SUPPORTED_KEYBOARDS } from "@/lib/layout-submission";

/** 配列の編集ページ(P6-3)。編集用URL /k/[slug]/edit#key=<秘密キー> で開く */

export const metadata: Metadata = {
  title: "配列を編集する",
  robots: { index: false, follow: false },
};

export default async function EditLayoutPage(props: PageProps<"/k/[slug]/edit">) {
  const { slug } = await props.params;
  const data = await getLayoutPageData(slug);
  const keyboard = data ? SUPPORTED_KEYBOARDS[data.layout.keyboardId] : undefined;
  if (!data || !keyboard) notFound();
  const { layout } = data;
  const initialState = createEditorState({
    keyboardId: layout.keyboardId,
    title: layout.title,
    authorName: layout.authorName,
    description: layout.description,
    tags: layout.tags,
    layers: layout.layers,
    combos: layout.combos,
    macros: layout.macros,
    forkedFromLayoutId: layout.forkedFromLayoutId,
  });
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">配列を編集する</h1>
        <p className="text-sm text-zinc-600">
          {"「"}
          <Link href={`/k/${slug}`} className="underline underline-offset-4">
            {layout.title}
          </Link>
          {"」を編集しています。保存すると、同じURLのまま内容が変わります。"}
        </p>
      </header>
      <EditPageClient slug={slug} title={layout.title} physicalLayout={keyboard} initialState={initialState} />
    </main>
  );
}
