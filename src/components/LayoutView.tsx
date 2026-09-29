import Link from "next/link";
import { ComboMacroList } from "@/components/ComboMacroList";
import { OwnerEditLink } from "@/components/OwnerEditLink";
import { KeymapDiagram, getKeymapDiagramSize } from "@/components/KeymapDiagram";
import { LinkPendingHint } from "@/components/LinkPendingHint";
import { ResponsiveKeymap } from "@/components/ResponsiveKeymap";
import { SharePanel } from "@/components/SharePanel";
import { StarButton } from "@/components/StarButton";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import { formatDateJa } from "@/lib/layout-page-utils";
import { ogImagePath } from "@/lib/og-image";
import { buildShareText } from "@/lib/share";
import { getSiteUrl } from "@/lib/site";
import type { KeyboardPhysicalLayout, Layer, Layout } from "@/lib/schemas";

/**
 * 閲覧ページ(/k/[slug]、/k/[slug]/[layer])の共通部品。
 * すべてサーバー側で組み立て、JavaScriptなしでも内容がHTMLに含まれるようにする
 * (フェーズ4で、Xのクローラー向けのメタタグと合わせて使うため)。
 */

export function layoutPath(slug: string, layerNumber?: number): string {
  return layerNumber === undefined ? `/k/${slug}` : `/k/${slug}/${layerNumber}`;
}

export function tagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}`;
}

/** タイトル・機種名・投稿者名・日付・元にした配列・説明・タグ・コピーして編集 */
export function LayoutHeader({
  layout,
  keyboard,
  forkedFrom,
}: {
  layout: Layout;
  keyboard: KeyboardPhysicalLayout;
  forkedFrom?: { slug: string; title: string } | null;
}) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold leading-snug">
        <Link href={layoutPath(layout.slug)} className="hover:underline underline-offset-4">
          {layout.title}
        </Link>
      </h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
        <span>{keyboard.name}</span>
        <span>{`投稿者: ${layout.authorName ?? "名前なし"}`}</span>
        <span>{`投稿日: ${formatDateJa(layout.createdAt)}`}</span>
        {layout.updatedAt !== layout.createdAt && <span>{`更新日: ${formatDateJa(layout.updatedAt)}`}</span>}
      </div>
      {forkedFrom && (
        <p className="text-sm text-zinc-600">
          {"元にした配列: "}
          <Link href={layoutPath(forkedFrom.slug)} className="underline underline-offset-4" data-testid="forked-from">
            {forkedFrom.title}
          </Link>
        </p>
      )}
      {layout.description && (
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-bold text-zinc-700">なぜこの配置にしたか</h2>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{layout.description}</p>
        </section>
      )}
      {layout.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {layout.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={tagPath(tag)}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-200"
              >
                {`#${tag}`}
                <LinkPendingHint label="" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <StarButton slug={layout.slug} initialCount={layout.starCount} />
      <div className="flex flex-wrap items-center gap-2">
        <OwnerEditLink slug={layout.slug} />
        <Link
          href={`/new?from=${encodeURIComponent(layout.slug)}`}
          className="inline-block rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          この配列をコピーして編集
          <LinkPendingHint label="開いています…" />
        </Link>
      </div>
    </header>
  );
}

/** レイヤーの切り替えリンク。current が undefined なら「すべて」を選択中として表示する */
export function LayerNav({ layout, current }: { layout: Layout; current?: number }) {
  const itemClass = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm ${
      active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 hover:bg-zinc-100"
    }`;
  return (
    <nav aria-label="レイヤーの切り替え" className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href={layoutPath(layout.slug)} className={itemClass(current === undefined)}>
            すべてのレイヤー
            <LinkPendingHint label="" />
          </Link>
        </li>
        {layout.layers.map((layer) => (
          <li key={layer.layerNumber}>
            <Link href={layoutPath(layout.slug, layer.layerNumber)} className={itemClass(current === layer.layerNumber)}>
              {`${layer.layerNumber}: ${layer.layerName}`}
              <LinkPendingHint label="" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-500">
        レイヤー = キーボードの「面」のことです。fnキーなどを押している間は、別のレイヤーの割り当てに切り替わります。
      </p>
    </nav>
  );
}

/** 1つのレイヤーのキー図(見出し付き) */
export function LayerSection({
  layout,
  keyboard,
  layer,
  headingLink = true,
}: {
  layout: Layout;
  keyboard: KeyboardPhysicalLayout;
  layer: Layer;
  /** 見出しをレイヤーページへのリンクにする */
  headingLink?: boolean;
}) {
  const size = (side?: "left" | "right") =>
    getKeymapDiagramSize(buildKeymapRenderModel(keyboard, layer, { combos: layout.combos, side }));
  const both = size();
  const left = size("left");
  const right = size("right");
  const heading = `レイヤー${layer.layerNumber}: ${layer.layerName}`;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-bold">
        {headingLink ? (
          <Link href={layoutPath(layout.slug, layer.layerNumber)} className="hover:underline underline-offset-4">
            {heading}
          </Link>
        ) : (
          heading
        )}
      </h2>
      {/* 広い画面: 左右を並べた1枚の図 */}
      <div className="hidden md:block">
        <ResponsiveKeymap width={both.width} height={both.height}>
          <KeymapDiagram physicalLayout={keyboard} layer={layer} combos={layout.combos} />
        </ResponsiveKeymap>
      </div>
      {/* 狭い画面(スマホなど): 左手と右手を縦に並べ、文字を読める大きさにする */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold text-zinc-500">左手</div>
          <ResponsiveKeymap width={left.width} height={left.height}>
            <KeymapDiagram physicalLayout={keyboard} layer={layer} combos={layout.combos} side="left" />
          </ResponsiveKeymap>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold text-zinc-500">右手</div>
          <ResponsiveKeymap width={right.width} height={right.height}>
            <KeymapDiagram physicalLayout={keyboard} layer={layer} combos={layout.combos} side="right" />
          </ResponsiveKeymap>
        </div>
      </div>
    </section>
  );
}

export function LayoutCombosAndMacros({ layout, keyboard }: { layout: Layout; keyboard: KeyboardPhysicalLayout }) {
  return (
    <ComboMacroList physicalLayout={keyboard} layers={layout.layers} combos={layout.combos} macros={layout.macros} />
  );
}

/** 共有パネル(サーバー側で文面の初期値・絶対URL・画像URLを決めて渡す) */
export function LayoutSharePanel({
  layout,
  keyboard,
  layerNumber,
}: {
  layout: Layout;
  keyboard: KeyboardPhysicalLayout;
  layerNumber?: number;
}) {
  const pageUrl = new URL(layoutPath(layout.slug, layerNumber), getSiteUrl()).href;
  return (
    <SharePanel
      initialText={buildShareText({ title: layout.title, keyboardName: keyboard.name, keyboardId: keyboard.id })}
      pageUrl={pageUrl}
      imageUrl={ogImagePath(layout, layerNumber)}
      imageFileName={`${layout.slug}${layerNumber === undefined ? "" : `-${layerNumber}`}.png`}
    />
  );
}
