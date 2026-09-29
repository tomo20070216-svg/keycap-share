import { z } from "zod";

/**
 * 「入力要素(element)」= キーボード上の1つの入力デバイス。
 * キー・ダイヤル・スクロールパッド・トラックボールをすべて同じ形で扱う。
 * 機種ごとの物理レイアウトは KeyboardPhysicalLayout として keyboards テーブルに保存する。
 */

export const ElementTypeSchema = z.enum([
  "key",
  "dial",
  "scrollpad",
  "trackball",
]);
export type ElementType = z.infer<typeof ElementTypeSchema>;

export const SideSchema = z.enum(["left", "right"]);
export type Side = z.infer<typeof SideSchema>;

/**
 * 要素が対応する「操作(action)」。表示用の名前を割り当てる最小単位。
 * - key: press(タップ) / hold(長押し)
 * - dial: cw(右回し) / ccw(左回し) — 押し込みなし
 * - scrollpad: up / down / tap
 * - trackball: 通常のポインタ操作(カーソル移動)に加え、レイヤー切り替え中は
 *   上下左右への操作(スワイプ)に別の機能(コピー、文字入力など)を割り当てられる。
 *   up/down/left/right の4方向。押し込み(クリック)はない(人間の確認、2026-09-29)。
 *   通常のカーソル移動自体は割り当ての対象にしない(常にポインタとして機能するため)。
 */
export const ActionSchema = z.enum([
  "press",
  "hold",
  "cw",
  "ccw",
  "up",
  "down",
  "left",
  "right",
  "tap",
]);
export type Action = z.infer<typeof ActionSchema>;

export const ELEMENT_ACTIONS: Record<ElementType, Action[]> = {
  key: ["press", "hold"],
  dial: ["cw", "ccw"],
  scrollpad: ["up", "down", "tap"],
  trackball: ["up", "down", "left", "right"],
};

export const KeyboardElementSchema = z.object({
  id: z.string().min(1), // 機種内で一意。例: "L-R1C1", "L-DIAL", "L-SCROLL"
  type: ElementTypeSchema,
  side: SideSchema,
  // 画面表示・OGP画像描画用の座標(単位: 任意のグリッド単位。仮の値でよい)
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0), // 度数。斜めに配置されたキー用
  // 参考情報(画面上のヒント表示用。必須ではない)
  legend: z.string().optional(), // 例: "Q", "Esc" (Orca echoの工場出荷時印字)
});
export type KeyboardElement = z.infer<typeof KeyboardElementSchema>;

export const KeyboardPhysicalLayoutSchema = z.object({
  id: z.string().min(1), // slug。例: "orca-echo"
  name: z.string().min(1), // 表示名。例: "Keychron Orca echo"
  isProvisional: z.boolean(), // true = 仮の値(実機・公式情報での確認待ち)
  elements: z.array(KeyboardElementSchema).min(1),
});
export type KeyboardPhysicalLayout = z.infer<
  typeof KeyboardPhysicalLayoutSchema
>;

/** 1つの割り当て(レイヤー内の、ある要素のある操作に対する表示名) */
export const AssignmentSchema = z.object({
  elementId: z.string().min(1),
  action: ActionSchema,
  label: z.string().min(1).max(40), // 表示用の名前。例: "Ctrl", "Layer 2", "変換"
});
export type Assignment = z.infer<typeof AssignmentSchema>;

export const LayerSchema = z.object({
  layerNumber: z.number().int().min(0),
  layerName: z.string().min(1).max(40),
  assignments: z.array(AssignmentSchema).max(300), // 1レイヤーの割り当ての上限(Orca echo は全要素・全操作でも約110)
});
export type Layer = z.infer<typeof LayerSchema>;

/**
 * コンボ: 複数のキーを同時に押すと、別の入力になる設定(ZMKの combos)。
 * キー図の下に「コンボ一覧」として表示し、対象キーには一覧の番号(①②…)を付ける。
 * 番号は配列内の並び順で決まる。
 */
export const ComboSchema = z.object({
  elementIds: z
    .array(z.string().min(1))
    .min(2)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length, "同じキーを2回指定できません"),
  label: z.string().min(1).max(40), // 表示用の名前。例: "左クリック"
  layerNumbers: z.array(z.number().int().min(0)).default([]), // 空 = 全レイヤー共通
});
export type Combo = z.infer<typeof ComboSchema>;

/**
 * マクロ: 一連のキー操作を1つのキーに登録する設定。
 * キーには短い名前(name)を表示し、キー図の下の「マクロ一覧」で中身を文章で説明する。
 * 具体的なキー操作の手順は記録しない(plan.md 方針4「表示用の名前」)。
 * キーとはデータ上でつなげず、キーの表示名とマクロの名前をそろえる緩い対応にする。
 */
export const MacroSchema = z.object({
  name: z.string().min(1).max(20),
  description: z.string().max(200).default(""),
});
export type Macro = z.infer<typeof MacroSchema>;

/**
 * 配列(layout)の新規作成時に受け取る入力の形。
 * サーバー側で id・slug・editSecretHash・createdAt 等を付与してDBに保存する。
 */
export const LayoutInputSchema = z.object({
  keyboardId: z.string().min(1),
  title: z.string().min(1).max(80),
  description: z.string().max(2000).optional(), // なぜこの配置にしたか
  authorName: z.string().max(40).optional(), // 自由入力ニックネーム(Xアカウント等と連携しない)
  forkedFromLayoutId: z.string().uuid().optional(), // 「コピーして編集」機能で使う複製元ID
  tags: z.array(z.string().min(1).max(20)).max(10).default([]),
  layers: z.array(LayerSchema).min(1).max(10), // レイヤー数の上限
  combos: z.array(ComboSchema).max(50).default([]),
  macros: z.array(MacroSchema).max(50).default([]),
});
/** 入力側の型(tags・combos・macros は省略できる) */
export type LayoutInput = z.input<typeof LayoutInputSchema>;

/** DBから取得した配列(公開情報。editSecretHashは含めない) */
export const LayoutSchema = LayoutInputSchema.extend({
  id: z.string().uuid(),
  slug: z.string().min(1), // 公開URL用
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  /** ⭐️(星)の数(P7-5) */
  starCount: z.number().int().nonnegative().default(0),
});
export type Layout = z.infer<typeof LayoutSchema>;
