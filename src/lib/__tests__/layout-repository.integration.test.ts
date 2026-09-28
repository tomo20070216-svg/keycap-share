/**
 * Supabase に実際に保存・取得する結合テスト(npm run test:integration で実行)。
 *
 * 工場出荷時配列は「最初の1件」として DB に残す方針(人間の判断、2026-09-28)。
 * そのため固定slugで保存し、2回目以降は保存済みのものを取得して内容を検証する。
 */
import { describe, expect, it } from "vitest";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import {
  orcaEchoComboSampleCombos,
  orcaEchoComboSampleLayers,
  orcaEchoComboSampleMacros,
} from "@/keyboards/orca-echo-combo-sample";
import { hashEditSecret } from "@/lib/edit-secret";
import {
  createLayout,
  getKeyboard,
  getLayoutBySlug,
  listLayouts,
  saveKeyboard,
} from "@/lib/layout-repository";
import type { Layer, LayoutInput } from "@/lib/schemas";
import { createServerSupabase } from "@/lib/supabase-server";

const FACTORY_DEFAULT_SLUG = "orca-echo-factory-default";

const factoryDefaultInput: LayoutInput = {
  keyboardId: orcaEcho.id,
  title: "Orca echo 工場出荷時配列",
  description:
    "Keychron Orca echo の工場出荷時の印字(白=通常、赤=fn1、緑=fn2)をそのまま書き起こした配列。",
  tags: ["工場出荷時"],
  layers: orcaEchoFactoryDefaultLayers,
};

/** DBは割り当ての並び順を保持しないため、比較用に並べ替える */
function normalize(layers: Layer[]) {
  return layers.map((layer) => ({
    ...layer,
    assignments: [...layer.assignments].sort((a, b) =>
      `${a.elementId}:${a.action}`.localeCompare(`${b.elementId}:${b.action}`)
    ),
  }));
}

describe("配列の保存・取得(Supabase)", () => {
  it("Orca echo の物理レイアウトを登録し、公開用キーで取得できる", async () => {
    await saveKeyboard(orcaEcho);
    const fetched = await getKeyboard(orcaEcho.id);
    expect(fetched).toEqual(orcaEcho);
  });

  it("工場出荷時配列を保存し、公開用キーで取得した内容が元データと一致する", async () => {
    let layout = await getLayoutBySlug(FACTORY_DEFAULT_SLUG);

    if (layout) {
      console.log(`保存済みの配列を使用: slug=${layout.slug} id=${layout.id}`);
    } else {
      const result = await createLayout(factoryDefaultInput, { slug: FACTORY_DEFAULT_SLUG });
      layout = result.layout;
      console.log(`新規保存: slug=${layout.slug} id=${layout.id}`);

      // 秘密キーは平文ではなくハッシュで保存されている
      const { data, error } = await createServerSupabase()
        .from("layout_secrets")
        .select("edit_secret_hash")
        .eq("layout_id", layout.id)
        .single();
      expect(error).toBeNull();
      expect(data!.edit_secret_hash).toBe(hashEditSecret(result.editSecret));
      expect(data!.edit_secret_hash).not.toBe(result.editSecret);
    }

    expect(layout.slug).toBe(FACTORY_DEFAULT_SLUG);
    expect(layout.keyboardId).toBe(factoryDefaultInput.keyboardId);
    expect(layout.title).toBe(factoryDefaultInput.title);
    expect(layout.description).toBe(factoryDefaultInput.description);
    expect(layout.tags).toEqual(factoryDefaultInput.tags);
    expect(normalize(layout.layers)).toEqual(normalize(orcaEchoFactoryDefaultLayers));

    const total = layout.layers.reduce((n, l) => n + l.assignments.length, 0);
    console.log(`取得: ${layout.layers.length}レイヤー / 割り当て${total}件`);
  });

  it("公開用キーでは存在しないslugは null になる", async () => {
    expect(await getLayoutBySlug("no-such-slug-xyz")).toBeNull();
  });
});

describe("コンボ・マクロの保存・取得(Supabase)", () => {
  const COMBO_SAMPLE_SLUG = "orca-echo-combo-sample";
  const comboSampleInput: LayoutInput = {
    keyboardId: orcaEcho.id,
    title: "Orca echo コンボのサンプル配列",
    description:
      "工場出荷時配列に、コンボ(J+K→左クリック、K+L→右クリック、J+L→ホイールクリック。全レイヤー共通)と仮のマクロ「署名」を加えた表示確認用の配列。",
    tags: ["サンプル"],
    layers: orcaEchoComboSampleLayers,
    combos: orcaEchoComboSampleCombos,
    macros: orcaEchoComboSampleMacros,
  };

  it("コンボのサンプル配列を保存し、公開用キーで取得したコンボ・マクロが元データと並び順まで一致する", async () => {
    await saveKeyboard(orcaEcho);
    let layout = await getLayoutBySlug(COMBO_SAMPLE_SLUG);
    if (layout) {
      console.log(`保存済みの配列を使用: slug=${layout.slug} id=${layout.id}`);
    } else {
      layout = (await createLayout(comboSampleInput, { slug: COMBO_SAMPLE_SLUG })).layout;
      console.log(`新規保存: slug=${layout.slug} id=${layout.id}`);
    }

    expect(layout.combos).toEqual(orcaEchoComboSampleCombos);
    expect(layout.macros).toEqual(orcaEchoComboSampleMacros);
    expect(normalize(layout.layers)).toEqual(normalize(orcaEchoComboSampleLayers));
    console.log(
      `取得: コンボ${layout.combos.length}件(${layout.combos.map((c) => `${c.elementIds.join("+")}→${c.label}`).join(", ")}) / マクロ${layout.macros.length}件`
    );
  });

  it("工場出荷時配列(コンボ・マクロなし)は空の一覧で取得される", async () => {
    const layout = await getLayoutBySlug(FACTORY_DEFAULT_SLUG);
    expect(layout?.combos).toEqual([]);
    expect(layout?.macros).toEqual([]);
  });

  it("キー以外を含むコンボは保存前に拒否され、DBに何も残らない", async () => {
    const slug = "reject-test-combo";
    await expect(
      createLayout(
        { ...comboSampleInput, combos: [{ elementIds: ["R-1-2", "R-TRACKBALL"], label: "x" }] },
        { slug }
      )
    ).rejects.toThrow("コンボの検証エラー");
    expect(await getLayoutBySlug(slug)).toBeNull();
  });
});

describe("配列の一覧(Supabase、0003適用後)", () => {
  it("一覧には工場出荷時配列が出て、コンボのサンプル配列(一覧に出さない印)は出ない", async () => {
    const { layouts, total } = await listLayouts({ perPage: 50 });
    const slugs = layouts.map((l) => l.slug);
    expect(slugs).toContain(FACTORY_DEFAULT_SLUG);
    expect(slugs).not.toContain("orca-echo-combo-sample");
    expect(total).toBe(layouts.length);
    console.log(`一覧: ${total}件 (${slugs.join(", ")})`);
  });

  it("新しい順に並ぶ", async () => {
    const { layouts } = await listLayouts({ perPage: 50 });
    const times = layouts.map((l) => Date.parse(l.createdAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("ページ分け: 1ページ1件にすると、総数は変わらず1件ずつ返る", async () => {
    const all = await listLayouts({ perPage: 50 });
    const first = await listLayouts({ page: 1, perPage: 1 });
    expect(first.total).toBe(all.total);
    expect(first.layouts.map((l) => l.slug)).toEqual(all.layouts.slice(0, 1).map((l) => l.slug));
    const beyond = await listLayouts({ page: all.total + 1, perPage: 1 });
    expect(beyond.layouts).toEqual([]);
  });

  it("件数を大きく超えたページを指定しても、エラーにならず空の一覧と総数が返る", async () => {
    const all = await listLayouts({ perPage: 50 });
    const far = await listLayouts({ page: 100, perPage: 20 });
    expect(far).toEqual({ layouts: [], total: all.total });
    const farTag = await listLayouts({ page: 100, perPage: 20, tag: "工場出荷時" });
    expect(farTag.layouts).toEqual([]);
    expect(farTag.total).toBeGreaterThanOrEqual(1);
  });

  it("URLを直接開けば、一覧に出さない配列も取得できる", async () => {
    expect(await getLayoutBySlug("orca-echo-combo-sample")).not.toBeNull();
  });

  it("タグで絞り込むと、そのタグが付いた一覧に出す配列だけが返る。タグの一覧は絞り込まれない", async () => {
    const factory = await listLayouts({ tag: "工場出荷時" });
    expect(factory.layouts.map((l) => l.slug)).toContain(FACTORY_DEFAULT_SLUG);
    expect(factory.layouts.every((l) => l.tags.includes("工場出荷時"))).toBe(true);
    // コンボのサンプル配列(タグ: サンプル)は一覧に出さない印があるので、タグで絞り込んでも出ない
    const sample = await listLayouts({ tag: "サンプル" });
    expect(sample.layouts.map((l) => l.slug)).not.toContain("orca-echo-combo-sample");
    // 存在しないタグは0件
    expect(await listLayouts({ tag: "存在しないタグ" })).toEqual({ layouts: [], total: 0 });
  });
});
