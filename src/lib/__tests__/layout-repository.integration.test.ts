/**
 * Supabase に実際に保存・取得する結合テスト(npm run test:integration で実行)。
 *
 * 工場出荷時配列は「最初の1件」として DB に残す方針(人間の判断、2026-09-28)。
 * そのため固定slugで保存し、2回目以降は保存済みのものを取得して内容を検証する。
 */
import { describe, expect, it } from "vitest";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { hashEditSecret } from "@/lib/edit-secret";
import {
  createLayout,
  getKeyboard,
  getLayoutBySlug,
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
