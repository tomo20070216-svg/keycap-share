import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComboMacroList } from "@/components/ComboMacroList";
import { KeymapDiagram, getKeymapDiagramSize } from "@/components/KeymapDiagram";
import { ResponsiveKeymap } from "@/components/ResponsiveKeymap";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import { getKeyboard, getLayoutBySlug } from "@/lib/layout-repository";

/**
 * 開発用の確認ページ(P2-7)。Supabaseから配列を取得し、全レイヤーを縦に並べて表示する。
 * 読み取りは公開用キー(ブラウザと同じ権限)で行う。本番の閲覧ページはフェーズ3で作る。
 */

export const metadata: Metadata = {
  title: "配列の表示確認(開発用)",
  robots: { index: false, follow: false },
};

/** Supabaseに保存してある確認用の配列 */
const SAMPLE_SLUGS = [
  { slug: "orca-echo-factory-default", name: "工場出荷時配列" },
  { slug: "orca-echo-combo-sample", name: "コンボのサンプル配列" },
];

export default async function LayoutDevPage(props: PageProps<"/dev/layouts/[slug]">) {
  const { slug } = await props.params;
  const layout = await getLayoutBySlug(slug);
  if (!layout) notFound();
  const keyboard = await getKeyboard(layout.keyboardId);
  if (!keyboard) notFound();

  return (
    <main style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24, backgroundColor: "#ffffff", color: "#18181b" }}>
      <nav style={{ display: "flex", gap: 16, fontSize: 14 }}>
        {SAMPLE_SLUGS.map((s) => (
          <Link
            key={s.slug}
            href={`/dev/layouts/${s.slug}`}
            style={{ fontWeight: s.slug === slug ? 700 : 400, textDecoration: s.slug === slug ? "none" : "underline" }}
          >
            {s.name}
          </Link>
        ))}
      </nav>

      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{layout.title}</h1>
        <div style={{ fontSize: 13, color: "#52525b" }}>
          {`${keyboard.name} / Supabaseから取得(slug: ${layout.slug}、更新: ${layout.updatedAt})`}
        </div>
        {layout.description && <p style={{ fontSize: 14 }}>{layout.description}</p>}
        {layout.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            {layout.tags.map((tag) => (
              <span key={tag} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, backgroundColor: "#f4f4f5" }}>
                {`#${tag}`}
              </span>
            ))}
          </div>
        )}
        <p style={{ fontSize: 12, color: "#52525b" }}>
          レイヤー = キーボードの「面」のこと。fnキーなどを押している間は、別のレイヤーの割り当てに切り替わります。
        </p>
      </header>

      {layout.layers.map((layer) => {
        const size = getKeymapDiagramSize(buildKeymapRenderModel(keyboard, layer, { combos: layout.combos }));
        return (
          <section key={layer.layerNumber} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{`レイヤー${layer.layerNumber}: ${layer.layerName}`}</h2>
            <ResponsiveKeymap width={size.width} height={size.height}>
              <KeymapDiagram physicalLayout={keyboard} layer={layer} combos={layout.combos} />
            </ResponsiveKeymap>
          </section>
        );
      })}

      <ComboMacroList physicalLayout={keyboard} layers={layout.layers} combos={layout.combos} macros={layout.macros} />
    </main>
  );
}
