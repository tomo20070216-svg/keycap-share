import Link from "next/link";
import { KeymapDiagram, getKeymapDiagramSize } from "@/components/KeymapDiagram";
import { layoutPath, tagPath } from "@/components/LayoutView";
import { ResponsiveKeymap } from "@/components/ResponsiveKeymap";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import { formatDateJa, totalPages } from "@/lib/layout-page-utils";
import type { KeyboardPhysicalLayout, Layout } from "@/lib/schemas";

/**
 * 配列の一覧(トップの新着一覧・タグでの絞り込みで共通)。
 * カード: 通常レイヤー(番号が最小のレイヤー)の小さなキー図・タイトル・機種名・投稿者名・投稿日・タグ。
 */

/** カードのキー図の、キー1つ分の大きさ(px)。縮小表示なので文字は小さいが、配置の雰囲気が分かる */
const CARD_UNIT = 30;

function LayoutCard({ layout, keyboard }: { layout: Layout; keyboard: KeyboardPhysicalLayout | undefined }) {
  const baseLayer = [...layout.layers].sort((a, b) => a.layerNumber - b.layerNumber)[0];
  const size =
    keyboard && baseLayer
      ? getKeymapDiagramSize(buildKeymapRenderModel(keyboard, baseLayer, { combos: layout.combos }), CARD_UNIT)
      : null;
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4">
      {keyboard && baseLayer && size && (
        <Link href={layoutPath(layout.slug)} aria-label={`${layout.title} のキー配置図`}>
          <ResponsiveKeymap width={size.width} height={size.height}>
            <KeymapDiagram
              physicalLayout={keyboard}
              layer={baseLayer}
              combos={layout.combos}
              unit={CARD_UNIT}
            />
          </ResponsiveKeymap>
        </Link>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold leading-snug">
          <Link href={layoutPath(layout.slug)} className="hover:underline underline-offset-4">
            {layout.title}
          </Link>
        </h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
          <span>{keyboard?.name ?? layout.keyboardId}</span>
          <span>{`投稿者: ${layout.authorName ?? "名前なし"}`}</span>
          <span>{`投稿日: ${formatDateJa(layout.createdAt)}`}</span>
        </div>
      </div>
      {layout.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {layout.tags.map((tag) => (
            <li key={tag}>
              <Link href={tagPath(tag)} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200">
                {`#${tag}`}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function LayoutList({
  layouts,
  keyboards,
  total,
  page,
  basePath,
  emptyMessage,
}: {
  layouts: Layout[];
  keyboards: Map<string, KeyboardPhysicalLayout>;
  total: number;
  page: number;
  /** ページ送りのリンク先(例: "/"、"/tags/日本語入力") */
  basePath: string;
  emptyMessage: string;
}) {
  const pages = totalPages(total);
  const pageHref = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);
  return (
    <div className="flex flex-col gap-6">
      {layouts.length === 0 ? (
        <p className="text-zinc-600">{emptyMessage}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {layouts.map((layout) => (
            <LayoutCard key={layout.id} layout={layout} keyboard={keyboards.get(layout.keyboardId)} />
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="ページ送り" className="flex items-center justify-center gap-4 text-sm">
          {page > 1 ? <Link href={pageHref(page - 1)} className="underline underline-offset-4">前のページ</Link> : <span />}
          <span className="text-zinc-600">{`${page} / ${pages} ページ(全${total}件)`}</span>
          {page < pages ? <Link href={pageHref(page + 1)} className="underline underline-offset-4">次のページ</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
