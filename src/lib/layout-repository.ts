import {
  KeyboardPhysicalLayoutSchema,
  LayoutInputSchema,
  LayoutSchema,
  type KeyboardPhysicalLayout,
  type Layout,
  type LayoutInput,
} from "@/lib/schemas";
import { assertValidLayers } from "@/lib/layout-validation";
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
  options: { slug?: string } = {}
): Promise<CreateLayoutResult> {
  const parsed = LayoutInputSchema.parse(input);

  const keyboard = await getKeyboard(parsed.keyboardId);
  if (!keyboard) throw new Error(`機種が見つかりません: ${parsed.keyboardId}`);
  assertValidLayers(parsed.layers, keyboard);

  const db = createServerSupabase();
  const slug = options.slug ?? generateSlug();
  const editSecret = generateEditSecret();

  const { data: layoutRow, error: layoutError } = await db
    .from("layouts")
    .insert({
      slug,
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
};

/** 公開URL用のslugで配列を1件取得する。見つからなければ null。 */
export async function getLayoutBySlug(slug: string): Promise<Layout | null> {
  const { data, error } = await supabase
    .from("layouts")
    .select(
      `id, slug, keyboard_id, title, description, author_name, forked_from_layout_id,
       created_at, updated_at,
       layers ( layer_number, layer_name, assignments ( element_id, action, label ) ),
       layout_tags ( tags ( name ) )`
    )
    .eq("slug", slug)
    .maybeSingle<LayoutRow>();
  if (error) throw new Error(`配列の取得に失敗しました: ${error.message}`);
  if (!data) return null;

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
