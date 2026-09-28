import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayerNav, LayerSection, LayoutCombosAndMacros, LayoutHeader } from "@/components/LayoutView";
import { getLayoutPageData } from "@/lib/layout-page-data";

/** 配列ページ: 配列の全レイヤーを縦に並べて表示する(P3-2)。OGP用のメタタグはフェーズ4で追加する */

export async function generateMetadata(props: PageProps<"/k/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await getLayoutPageData(slug);
  if (!data) return {};
  return { title: `${data.layout.title}(${data.keyboard.name})`, description: data.layout.description };
}

export default async function LayoutPage(props: PageProps<"/k/[slug]">) {
  const { slug } = await props.params;
  const data = await getLayoutPageData(slug);
  if (!data) notFound();
  const { layout, keyboard } = data;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <LayoutHeader layout={layout} keyboard={keyboard} />
      <LayerNav layout={layout} />
      {layout.layers.map((layer) => (
        <LayerSection key={layer.layerNumber} layout={layout} keyboard={keyboard} layer={layer} />
      ))}
      <LayoutCombosAndMacros layout={layout} keyboard={keyboard} />
    </main>
  );
}
