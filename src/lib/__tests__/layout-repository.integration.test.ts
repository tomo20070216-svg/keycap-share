/**
 * Supabase に実際に保存・取得する結合テスト(npm run test:integration で実行)。
 *
 * 工場出荷時配列は「最初の1件」として DB に残す方針(人間の判断、2026-09-28)。
 * そのため固定slugで保存し、2回目以降は保存済みのものを取得して内容を検証する。
 */
import { afterAll, describe, expect, it } from "vitest";
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
import { submitLayout } from "@/lib/layout-submit";
import { checkEditSecret, deleteLayoutWithSecret, updateLayoutWithSecret } from "@/lib/layout-edit";
import { ogImageVersion } from "@/lib/og-image";
import { checkSubmissionAllowed, ipHashFor, recordSubmission } from "@/lib/rate-limit";
import { submitReport } from "@/lib/reports";
import { STAR_LIMIT_PER_HOUR } from "@/lib/spam-rules";
import { setStar } from "@/lib/stars";

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

describe("エディタからの投稿の保存(Supabase、P5-1)", () => {
  // テストが自分で作ったテスト投稿は、最後に自動で削除する(人間の許可、2026-09-29。P6-7)
  const created: { slug: string; secret: string }[] = [];
  afterAll(async () => {
    for (const c of created) await deleteLayoutWithSecret(c.slug, c.secret);
    for (const c of created) expect(await getLayoutBySlug(c.slug)).toBeNull();
  });

  it("正しい入力は一覧に出さないテスト投稿として保存され、秘密キーはハッシュだけがDBに残る", async () => {
    const result = await submitLayout(
      { keyboardId: "orca-echo", title: "P5-1 保存処理のテスト投稿", tags: ["テスト投稿"], layers: orcaEchoFactoryDefaultLayers },
      { isListed: false }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    created.push({ slug: result.slug, secret: result.editSecret });
    expect(result.slug).toMatch(/^[A-Za-z0-9_-]{11}$/);
    expect(result.editSecret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const { data } = await createServerSupabase()
      .from("layouts")
      .select("is_listed, layout_secrets ( edit_secret_hash )")
      .eq("slug", result.slug)
      .single<{ is_listed: boolean; layout_secrets: { edit_secret_hash: string } | null }>();
    expect(data!.is_listed).toBe(false);
    expect(data!.layout_secrets!.edit_secret_hash).toBe(hashEditSecret(result.editSecret));
    console.log(`新規保存: slug=${result.slug}(一覧に出さない。テストの最後に削除する)`);
    const layout = await getLayoutBySlug(result.slug);
    expect(layout?.title).toBe("P5-1 保存処理のテスト投稿");
    expect((await listLayouts({ perPage: 50 })).layouts.map((l) => l.slug)).not.toContain(result.slug);
  });

  it("不正な入力はDBに何も書かずにエラーを返す", async () => {
    const result = await submitLayout({ keyboardId: "orca-echo", title: "", layers: [] }, { isListed: false, slug: "p5-1-invalid-test" });
    expect(result.ok).toBe(false);
    expect(await getLayoutBySlug("p5-1-invalid-test")).toBeNull();
  });
});

describe("編集・削除(Supabase、P6-2)— 2つの異なる秘密キー", () => {
  // テストが自分で作ったテスト投稿は、最後に自動で削除する(人間の許可、2026-09-29)
  const created: { slug: string; secret: string }[] = [];
  const base = { keyboardId: "orca-echo", tags: ["テスト投稿"], layers: orcaEchoFactoryDefaultLayers };

  afterAll(async () => {
    for (const c of created) await deleteLayoutWithSecret(c.slug, c.secret);
    for (const c of created) expect(await getLayoutBySlug(c.slug)).toBeNull();
  });

  it("自分の秘密キーでは編集・削除でき、他人の秘密キーではできない", async () => {
    const a = await submitLayout({ ...base, title: "P6-2 テスト投稿A" }, { isListed: false });
    const b = await submitLayout({ ...base, title: "P6-2 テスト投稿B" }, { isListed: false });
    if (!a.ok || !b.ok) throw new Error("テスト投稿を作れませんでした");
    created.push({ slug: a.slug, secret: a.editSecret }, { slug: b.slug, secret: b.editSecret });
    const before = (await getLayoutBySlug(a.slug))!;
    console.log(`テスト投稿: A=${a.slug} B=${b.slug}`);

    // 秘密キーの確認
    expect(await checkEditSecret(a.slug, a.editSecret)).toBe(true);
    expect(await checkEditSecret(a.slug, b.editSecret)).toBe(false);
    expect(await checkEditSecret(a.slug, "")).toBe(false);

    // A のキーで A を編集できる(内容・更新日時・OGP画像の版が変わる)
    const edited = {
      ...base,
      title: "P6-2 テスト投稿A(編集後)",
      description: "編集した説明",
      tags: ["編集後"],
      layers: [{ layerNumber: 0, layerName: "通常", assignments: [{ elementId: "L-0-0", action: "press" as const, label: "半角/全角" }] }],
      combos: [{ elementIds: ["R-1-2", "R-1-3"], label: "左クリック", layerNumbers: [] }],
    };
    await new Promise((r) => setTimeout(r, 50));
    expect(await updateLayoutWithSecret(a.slug, a.editSecret, edited)).toEqual({ ok: true });
    const after = (await getLayoutBySlug(a.slug))!;
    expect(after.title).toBe("P6-2 テスト投稿A(編集後)");
    expect(after.description).toBe("編集した説明");
    expect(after.tags).toEqual(["編集後"]);
    expect(after.layers).toHaveLength(1);
    expect(after.layers[0].assignments).toEqual([{ elementId: "L-0-0", action: "press", label: "半角/全角" }]);
    expect(after.combos).toEqual([{ elementIds: ["R-1-2", "R-1-3"], label: "左クリック", layerNumbers: [] }]);
    expect(Date.parse(after.updatedAt)).toBeGreaterThan(Date.parse(before.updatedAt));
    expect(ogImageVersion(after)).not.toBe(ogImageVersion(before));
    console.log(`A を A のキーで編集: OK(OGP画像の版 ${ogImageVersion(before)} → ${ogImageVersion(after)})`);

    // B のキーでは A を編集・削除できず、A は変わらない
    const wrongEdit = await updateLayoutWithSecret(a.slug, b.editSecret, { ...edited, title: "乗っ取り" });
    expect(wrongEdit.ok).toBe(false);
    expect((await getLayoutBySlug(a.slug))!.title).toBe("P6-2 テスト投稿A(編集後)");
    expect((await deleteLayoutWithSecret(a.slug, b.editSecret)).ok).toBe(false);
    expect(await getLayoutBySlug(a.slug)).not.toBeNull();
    console.log("A を B のキーで編集・削除: 拒否され、A は変わらない");

    // 不正な内容は検証で拒否され、A は変わらない
    expect((await updateLayoutWithSecret(a.slug, a.editSecret, { ...edited, title: "" })).ok).toBe(false);
    expect((await getLayoutBySlug(a.slug))!.title).toBe("P6-2 テスト投稿A(編集後)");

    // B のキーで B を削除できる
    expect(await deleteLayoutWithSecret(b.slug, b.editSecret)).toEqual({ ok: true });
    expect(await getLayoutBySlug(b.slug)).toBeNull();
    console.log("B を B のキーで削除: OK");
  });
});

describe("投稿数の制限(Supabase、P6-4)", () => {
  // テスト用の架空の接続元。テストが作った記録は最後に削除する(人間の許可、2026-09-29)
  const fakeIpHash = ipHashFor(`test-${Date.now()}-${Math.random()}`);
  const otherIpHash = ipHashFor(`other-${Date.now()}-${Math.random()}`);
  afterAll(async () => {
    await createServerSupabase().from("submission_events").delete().in("ip_hash", [fakeIpHash, otherIpHash]);
  });

  it("同じ接続元から1時間に5件を超えると拒否される。IPアドレスはハッシュでだけ記録される", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await checkSubmissionAllowed("layout_create", fakeIpHash, null)).toBeNull();
      await recordSubmission("layout_create", fakeIpHash, null);
    }
    const blocked = await checkSubmissionAllowed("layout_create", fakeIpHash, null);
    expect(blocked).toContain("1時間ほど時間をおいて");
    console.log(`6件目: ${blocked}`);
    const { data } = await createServerSupabase().from("submission_events").select("ip_hash").eq("ip_hash", fakeIpHash);
    expect(data).toHaveLength(5);
    expect(data!.every((r) => /^[0-9a-f]{64}$/.test(r.ip_hash))).toBe(true);
  });

  it("同じ内容を10分以内に続けて投稿すると、別の接続元からでも拒否される", async () => {
    const content = "f".repeat(63) + String(Math.floor(Math.random() * 10));
    await recordSubmission("layout_create", otherIpHash, content);
    const third = ipHashFor(`third-${Date.now()}`);
    expect(await checkSubmissionAllowed("layout_create", third, content)).toContain("同じ内容の配列が少し前に投稿されています");
  });
});

describe("問題の報告(Supabase、P6-5)", () => {
  // テスト用の架空の接続元。テストが作った報告と記録は最後に削除する(人間の許可、2026-09-29)
  const fakeIpHash = ipHashFor(`report-test-${Date.now()}-${Math.random()}`);
  afterAll(async () => {
    const db = createServerSupabase();
    await db.from("reports").delete().eq("ip_hash", fakeIpHash);
    await db.from("submission_events").delete().eq("ip_hash", fakeIpHash);
  });

  it("報告は記録され、同じ配列への2回目は受け付けない。ブラウザ側の権限では報告を読めない", async () => {
    const first = await submitReport({ slug: "orca-echo-combo-sample", reason: "other", comment: "(結合テストの報告)" }, fakeIpHash);
    expect(first).toEqual({ ok: true });
    const second = await submitReport({ slug: "orca-echo-combo-sample", reason: "spam" }, fakeIpHash);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.error).toContain("すでに報告を受け付けています");

    const { data } = await createServerSupabase().from("reports").select("reason, comment, ip_hash").eq("ip_hash", fakeIpHash);
    expect(data).toEqual([{ reason: "other", comment: "(結合テストの報告)", ip_hash: fakeIpHash }]);
    console.log(`報告の記録: ${JSON.stringify(data?.map((r) => ({ reason: r.reason, comment: r.comment })))}`);

    const { anonClient } = await import("@/lib/supabase").then((m) => ({ anonClient: m.supabase }));
    const anon = await anonClient.from("reports").select("*").limit(1);
    expect(anon.error?.code).toBe("42501");
  });

  it("存在しない配列・不正な理由の報告は受け付けない", async () => {
    expect((await submitReport({ slug: "no-such-slug", reason: "spam" }, fakeIpHash)).ok).toBe(false);
    expect((await submitReport({ slug: "orca-echo-combo-sample", reason: "bogus" }, fakeIpHash)).ok).toBe(false);
  });
});

describe("⭐️(Supabase、0005適用後。P7-5〜P7-7)", () => {
  // テスト用の架空の接続元。テストが付けた⭐️と記録は最後に削除する(人間の許可、2026-09-29)
  const run = `${Date.now()}-${Math.random()}`;
  const ipA = ipHashFor(`star-test-a-${run}`);
  const ipB = ipHashFor(`star-test-b-${run}`);
  const ipLimited = ipHashFor(`star-test-limit-${run}`);
  const slug = "orca-echo-combo-sample";
  afterAll(async () => {
    const db = createServerSupabase();
    for (const ip of [ipA, ipB, ipLimited]) {
      await db.from("stars").delete().eq("ip_hash", ip);
      await db.from("submission_events").delete().eq("ip_hash", ip);
    }
  });

  it("付ける・同じ接続元の2回目は増えない・別の接続元で増える・外す。更新日時は変わらない", async () => {
    const before = (await getLayoutBySlug(slug))!;
    const base = before.starCount;
    const a1 = await setStar({ slug, on: true }, ipA);
    const a2 = await setStar({ slug, on: true }, ipA);
    const b1 = await setStar({ slug, on: true }, ipB);
    const a3 = await setStar({ slug, on: false }, ipA);
    expect([a1, a2, b1, a3].map((r) => (r.ok ? r.starCount : r.error))).toEqual([base + 1, base + 1, base + 2, base + 1]);
    const after = (await getLayoutBySlug(slug))!;
    expect(after.starCount).toBe(base + 1);
    expect(after.updatedAt).toBe(before.updatedAt);
    console.log(`⭐️: 最初 ${base} → Aが付ける ${base + 1} → Aの2回目 ${base + 1} → Bが付ける ${base + 2} → Aが外す ${base + 1}。更新日時 ${before.updatedAt} → ${after.updatedAt}`);
  });

  it("存在しない配列・不正な入力は受け付けない。ブラウザ側の権限では星の表を読めず、関数も使えない", async () => {
    const missing = await setStar({ slug: "no-such-slug", on: true }, ipA);
    expect(missing.ok).toBe(false);
    expect((await setStar({ slug, on: "yes" }, ipA)).ok).toBe(false);
    const { supabase: anon } = await import("@/lib/supabase");
    const read = await anon.from("stars").select("*").limit(1);
    expect(read.error?.code).toBe("42501");
    const rpc = await anon.rpc("set_star", { p_slug: slug, p_ip_hash: ipA, p_on: true });
    expect(rpc.error).not.toBeNull();
    console.log(`ブラウザ側の権限: stars の読み取り ${read.error?.code}、set_star ${rpc.error?.code}`);
  });

  it("同じ接続元から1時間に60回を超えると受け付けない", async () => {
    const db = createServerSupabase();
    const rows = Array.from({ length: STAR_LIMIT_PER_HOUR }, () => ({ kind: "star", ip_hash: ipLimited }));
    const { error } = await db.from("submission_events").insert(rows);
    expect(error).toBeNull();
    const r = await setStar({ slug, on: true }, ipLimited);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("時間をおいてから");
    console.log(`61回目: ${r.ok ? "受け付けた" : r.error}`);
  });

  it("人気順: ⭐️の多い順、同じ数なら新しい順", async () => {
    const { layouts } = await listLayouts({ sort: "popular", perPage: 50 });
    for (let i = 1; i < layouts.length; i++) {
      const [p, c] = [layouts[i - 1], layouts[i]];
      expect(p.starCount > c.starCount || (p.starCount === c.starCount && p.createdAt >= c.createdAt)).toBe(true);
    }
    console.log(`人気順: ${layouts.map((l) => `${l.slug}(⭐️${l.starCount})`).join(", ")}`);
  });
});
