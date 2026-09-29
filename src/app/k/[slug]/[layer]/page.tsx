import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayerNav, LayerSection, LayoutCombosAndMacros, LayoutHeader, LayoutSharePanel } from "@/components/LayoutView";
import { buildLayoutMetadata } from "@/lib/layout-metadata";
import { getLayoutPageData } from "@/lib/layout-page-data";
import { findLayerByParam } from "@/lib/layout-page-utils";

/** レイヤーページ: 指定したレイヤーだけを表示する(P3-3)。URLのレイヤーは番号(名前は変わりうるため) */

export async function generateMetadata(props: PageProps<"/k/[slug]/[layer]">): Promise<Metadata> {
  const { slug, layer: layerParam } = await props.params;
  const data = await getLayoutPageData(slug);
  const layer = data ? findLayerByParam(data.layout, layerParam) : null;
  if (!data || !layer) return {};
  return buildLayoutMetadata(data.layout, data.keyboard, layer);
}

export default async function LayerPage(props: PageProps<"/k/[slug]/[layer]">) {
  const { slug, layer: layerParam } = await props.params;
  const data = await getLayoutPageData(slug);
  if (!data) notFound();
  const { layout, keyboard } = data;
  const layer = findLayerByParam(layout, layerParam);
  if (!layer) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
      <LayoutHeader layout={layout} keyboard={keyboard} />
      <LayoutSharePanel layout={layout} keyboard={keyboard} layerNumber={layer.layerNumber} />
      <LayerNav layout={layout} current={layer.layerNumber} />
      <LayerSection layout={layout} keyboard={keyboard} layer={layer} headingLink={false} />
      <LayoutCombosAndMacros layout={layout} keyboard={keyboard} />
    </main>
  );
}
