import {
  KeyboardPhysicalLayoutSchema,
  LayoutInputSchema,
  LayoutSchema,
  type KeyboardPhysicalLayout,
  type Layout,
  type LayoutInput,
} from "@/lib/schemas";
import { assertValidCombos, assertValidLayers } from "@/lib/layout-validation";
import { generateEditSecret, generateSlug, hashEditSecret } from "@/lib/edit-secret";
import { createServerSupabase } from "@/lib/supabase-server";
import { supabase } from "@/lib/supabase";

/**
 * 配列(layout)の保存・取得。
 * - 書き込み(save*, create*)はサーバー専用クライアント(secret key)で行う。
 * - 読み取り(get*)は公開用クライアント(anon key)で行う。ブラウザと同じ権限で
 *   読めることを保証し、layout_secrets を誤って返すこともない。
 */

/** 機種(物理レイアウト)を登録する。同じidがあれば上書きする。 */
export async function saveKeyboard(keyboard: KeyboardPhysicalLayout): Promise<void> {
  const parsed = KeyboardPhysicalLayoutSchema.parse(keyboard);
  const db = createServerSupabase();
  const { error } = await db.from("keyboards").upsert({
    id: parsed.id,
    name: parsed.name,
    is_provisional: parsed.isProvisional,
    elements: parsed.elements,
  });
  if (error) throw new Error(`機種の保存に失敗しました: ${error.message}`);
}

export async function getKeyboard(id: string): Promise<KeyboardPhysicalLayout | null> {
  const { data, error } = await supabase
    .from("keyboards")
    .select("id, name, is_provisional, elements")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`機種の取得に失敗しました: ${error.message}`);
  if (!data) return null;
  return KeyboardPhysicalLayoutSchema.parse({
    id: data.id,
    name: data.name,
    isProvisional: data.is_provisional,
    elements: data.elements,
  });
}

export type CreateLayoutResult = {
  layout: Layout;
  /** 編集用秘密キーの平文。DBにはハッシュしか残らないため、ここでしか得られない。 */
  editSecret: string;
};

/**
 * 配列を新規保存する。
 * supabase-js では複数テーブルへの書き込みを1つのトランザクションにできないため、
 * 途中で失敗した場合は作成済みの layouts 行を削除して片付ける(子の行はカスケード削除)。
 */
export async function createLayout(
  input: LayoutInput,
  options: {
    slug?: string;
    /** 一覧に出すか(false = テスト投稿など。URLを直接開けば見られる) */
    isListed?: boolean;
  } = {}
): Promise<CreateLayoutResult> {
  const parsed = LayoutInputSchema.parse(input);

  const keyboard = await getKeyboard(parsed.keyboardId);
  if (!keyboard) throw new Error(`機種が見つかりません: ${parsed.keyboardId}`);
  assertValidLayers(parsed.layers, keyboard);
  assertValidCombos(parsed.combos, parsed.layers, keyboard);

  const db = createServerSupabase();
  const slug = options.slug ?? generateSlug();
  const editSecret = generateEditSecret();

  const { data: layoutRow, error: layoutError } = await db
    .from("layouts")
    .insert({
      slug,
      is_listed: options.isListed ?? true,
      keyboard_id: parsed.keyboardId,
      title: parsed.title,
      description: parsed.description ?? null,
      author_name: parsed.authorName ?? null,
      forked_from_layout_id: parsed.forkedFromLayoutId ?? null,
    })
    .select("id")
    .single();
  if (layoutError) throw new Error(`配列の保存に失敗しました: ${layoutError.message}`);
  const layoutId: string = layoutRow.id;

  try {
    const { error: secretError } = await db
      .from("layout_secrets")
      .insert({ layout_id: layoutId, edit_secret_hash: hashEditSecret(editSecret) });
    if (secretError) throw new Error(`秘密キーの保存に失敗しました: ${secretError.message}`);

    const { data: layerRows, error: layersError } = await db
      .from("layers")
      .insert(
        parsed.layers.map((layer) => ({
          layout_id: layoutId,
          layer_number: layer.layerNumber,
          layer_name: layer.layerName,
        }))
      )
      .select("id, layer_number");
    if (layersError) throw new Error(`レイヤーの保存に失敗しました: ${layersError.message}`);

    const layerIdByNumber = new Map<number, string>(
      layerRows.map((row) => [row.layer_number, row.id])
    );
    const assignmentRows = parsed.layers.flatMap((layer) =>
      layer.assignments.map((a) => ({
        layer_id: layerIdByNumber.get(layer.layerNumber)!,
        element_id: a.elementId,
        action: a.action,
        label: a.label,
      }))
    );
    if (assignmentRows.length > 0) {
      const { error } = await db.from("assignments").insert(assignmentRows);
      if (error) throw new Error(`割り当ての保存に失敗しました: ${error.message}`);
    }

    if (parsed.combos.length > 0) {
      const { error } = await db.from("combos").insert(
        parsed.combos.map((c, position) => ({
          layout_id: layoutId,
          position,
          element_ids: c.elementIds,
          label: c.label,
          layer_numbers: c.layerNumbers,
        }))
      );
      if (error) throw new Error(`コンボの保存に失敗しました: ${error.message}`);
    }

    if (parsed.macros.length > 0) {
      const { error } = await db.from("macros").insert(
        parsed.macros.map((m, position) => ({
          layout_id: layoutId,
          position,
          name: m.name,
          description: m.description,
        }))
      );
      if (error) throw new Error(`マクロの保存に失敗しました: ${error.message}`);
    }

    if (parsed.tags.length > 0) {
      const tagNames = [...new Set(parsed.tags)];
      const { error: upsertError } = await db
        .from("tags")
        .upsert(tagNames.map((name) => ({ name })), { onConflict: "name", ignoreDuplicates: true });
      if (upsertError) throw new Error(`タグの保存に失敗しました: ${upsertError.message}`);

      const { data: tagRows, error: tagSelectError } = await db
        .from("tags")
        .select("id")
        .in("name", tagNames);
      if (tagSelectError) throw new Error(`タグの取得に失敗しました: ${tagSelectError.message}`);

      const { error: linkError } = await db
        .from("layout_tags")
        .insert(tagRows.map((t) => ({ layout_id: layoutId, tag_id: t.id })));
      if (linkError) throw new Error(`タグの紐付けに失敗しました: ${linkError.message}`);
    }
  } catch (err) {
    await db.from("layouts").delete().eq("id", layoutId);
    throw err;
  }

  const layout = await getLayoutBySlug(slug);
  if (!layout) throw new Error(`保存直後の配列を取得できませんでした: ${slug}`);
  return { layout, editSecret };
}

type LayoutRow = {
  id: string;
  slug: string;
  keyboard_id: string;
  title: string;
  description: string | null;
  author_name: string | null;
  forked_from_layout_id: string | null;
  created_at: string;
  updated_at: string;
  layers: {
    layer_number: number;
    layer_name: string;
    assignments: { element_id: string; action: string; label: string }[];
  }[];
  layout_tags: { tags: { name: string } | null }[];
  combos: { position: number; element_ids: string[]; label: string; layer_numbers: number[] }[];
  macros: { position: number; name: string; description: string }[];
};

/** 配列を取得するときの列(1件取得と一覧で共通) */
const LAYOUT_SELECT = `id, slug, keyboard_id, title, description, author_name, forked_from_layout_id,
       created_at, updated_at,
       layers ( layer_number, layer_name, assignments ( element_id, action, label ) ),
       layout_tags ( tags ( name ) ),
       combos ( position, element_ids, label, layer_numbers ),
       macros ( position, name, description )`;

/** 公開URL用のslugで配列を1件取得する。見つからなければ null。一覧に出さない配列も取得できる */
export async function getLayoutBySlug(slug: string): Promise<Layout | null> {
  const { data, error } = await supabase
    .from("layouts")
    .select(LAYOUT_SELECT)
    .eq("slug", slug)
    .maybeSingle<LayoutRow>();
  if (error) throw new Error(`配列の取得に失敗しました: ${error.message}`);
  return data ? rowToLayout(data) : null;
}

export type LayoutListResult = {
  layouts: Layout[];
  /** 条件に合う配列の総数(ページ分けに使う) */
  total: number;
};

/**
 * 一覧用: 一覧に出す配列(is_listed)を新しい順に取得する。
 * tag を指定すると、そのタグが付いた配列だけに絞り込む。
 * page は1始まり。
 */
export async function listLayouts(options: { page?: number; perPage?: number; tag?: string } = {}): Promise<LayoutListResult> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const perPage = Math.min(50, Math.max(1, Math.floor(options.perPage ?? 20)));
  const from = (page - 1) * perPage;

  let layoutIds: string[] | undefined;
  if (options.tag !== undefined) {
    // タグ名 → タグのid → そのタグが付いた配列のid の順に調べる
    // (配列の取得と同時に絞り込むと、返ってくるタグの一覧まで絞り込まれてしまうため)
    const { data: tag, error: tagError } = await supabase.from("tags").select("id").eq("name", options.tag).maybeSingle();
    if (tagError) throw new Error(`タグの取得に失敗しました: ${tagError.message}`);
    if (!tag) return { layouts: [], total: 0 };
    const { data: links, error: linkError } = await supabase.from("layout_tags").select("layout_id").eq("tag_id", tag.id);
    if (linkError) throw new Error(`タグの取得に失敗しました: ${linkError.message}`);
    layoutIds = links.map((l) => l.layout_id);
    if (layoutIds.length === 0) return { layouts: [], total: 0 };
  }

  let query = supabase
    .from("layouts")
    .select(LAYOUT_SELECT, { count: "exact" })
    .eq("is_listed", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true }) // 作成日時が同じときも並び順を固定する
    .range(from, from + perPage - 1);
  if (layoutIds) query = query.in("id", layoutIds);

  const { data, error, count } = await query.returns<LayoutRow[]>();
  if (error?.code === "PGRST103") {
    // 件数を超えたページを指定した場合(Requested range not satisfiable)。空の一覧と総数を返す
    let countQuery = supabase.from("layouts").select("id", { count: "exact", head: true }).eq("is_listed", true);
    if (layoutIds) countQuery = countQuery.in("id", layoutIds);
    const { count: totalCount, error: countError } = await countQuery;
    if (countError) throw new Error(`配列の件数の取得に失敗しました: ${countError.message}`);
    return { layouts: [], total: totalCount ?? 0 };
  }
  if (error) throw new Error(`配列の一覧の取得に失敗しました: ${error.message}`);
  return { layouts: data.map(rowToLayout), total: count ?? 0 };
}

function rowToLayout(data: LayoutRow): Layout {
  return LayoutSchema.parse({
    id: data.id,
    slug: data.slug,
    keyboardId: data.keyboard_id,
    title: data.title,
    description: data.description ?? undefined,
    authorName: data.author_name ?? undefined,
    forkedFromLayoutId: data.forked_from_layout_id ?? undefined,
    // Postgres の timestamptz("+00:00" 付き)を Zod の datetime 形式("Z")にそろえる
    createdAt: new Date(data.created_at).toISOString(),
    updatedAt: new Date(data.updated_at).toISOString(),
    tags: data.layout_tags.flatMap((lt) => (lt.tags ? [lt.tags.name] : [])),
    // 並び順(position)がキー図の番号①②…になるので、必ず並べ替えてから返す
    combos: [...data.combos]
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ elementIds: c.element_ids, label: c.label, layerNumbers: c.layer_numbers })),
    macros: [...data.macros]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ name: m.name, description: m.description })),
    layers: [...data.layers]
      .sort((a, b) => a.layer_number - b.layer_number)
      .map((layer) => ({
        layerNumber: layer.layer_number,
        layerName: layer.layer_name,
        assignments: layer.assignments.map((a) => ({
          elementId: a.element_id,
          action: a.action,
          label: a.label,
        })),
      })),
  });
}
