import { getLayoutPageData } from "@/lib/layout-page-data";
import { findLayerByParam } from "@/lib/layout-page-utils";
import { renderOgImage } from "@/lib/og-image";

/** レイヤーページ用のOGP画像(そのレイヤー)。例: /og/k/abc123/1?v=1759067718961 */
export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/og/k/[slug]/[layer]">) {
  const { slug, layer: layerParam } = await context.params;
  const data = await getLayoutPageData(slug);
  const layer = data ? findLayerByParam(data.layout, layerParam) : null;
  if (!data || !layer) return new Response("Not Found", { status: 404 });
  return renderOgImage({
    layout: data.layout,
    keyboard: data.keyboard,
    layer,
    requestedVersion: new URL(request.url).searchParams.get("v"),
  });
}
