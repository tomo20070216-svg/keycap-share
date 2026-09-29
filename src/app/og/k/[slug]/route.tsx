import { getLayoutPageData } from "@/lib/layout-page-data";
import { baseLayerOf, renderOgImage } from "@/lib/og-image";

/** 配列ページ用のOGP画像(通常レイヤー)。例: /og/k/abc123?v=1759067718961-2 */
export const runtime = "nodejs";

export async function GET(request: Request, context: RouteContext<"/og/k/[slug]">) {
  const { slug } = await context.params;
  const data = await getLayoutPageData(slug);
  if (!data) return new Response("Not Found", { status: 404 });
  return renderOgImage({
    layout: data.layout,
    keyboard: data.keyboard,
    layer: baseLayerOf(data.layout),
    requestedVersion: new URL(request.url).searchParams.get("v"),
  });
}
