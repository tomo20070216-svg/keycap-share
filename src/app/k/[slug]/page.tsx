import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportButton } from "@/components/ReportButton";
import { LayerNav, LayerSection, LayoutCombosAndMacros, LayoutHeader, LayoutSharePanel } from "@/components/LayoutView";
import { buildLayoutMetadata } from "@/lib/layout-metadata";
import { getLayoutPageData } from "@/lib/layout-page-data";

/** 配列ページ: 配列の全レイヤーを縦に並べて表示する(P3-2)。メタタグ(Xのカード・OGP)は P4-3 */

export async function generateMetadata(props: PageProps<"/k/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await getLayoutPageData(slug);
  if (!data) return {};
  return buildLayoutMetadata(data.layout, data.keyboard);
}

export default async function LayoutPage(props: PageProps<"/k/[slug]">) {
  const { slug } = await props.params;
  const data = await getLayoutPageData(slug);
  if (!data) notFound();
  const { layout, keyboard } = data;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <LayoutHeader layout={layout} keyboard={keyboard} forkedFrom={data.forkedFrom} />
      <LayoutSharePanel layout={layout} keyboard={keyboard} />
      <LayerNav layout={layout} />
      {layout.layers.map((layer) => (
        <LayerSection key={layer.layerNumber} layout={layout} keyboard={keyboard} layer={layer} />
      ))}
      <LayoutCombosAndMacros layout={layout} keyboard={keyboard} />
      <ReportButton slug={layout.slug} />
    </main>
  );
}
