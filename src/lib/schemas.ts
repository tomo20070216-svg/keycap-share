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
 *   up/down/left/right の4方向 + click(仮。押し込みがあるかは未確認)。
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
  "click",
]);
export type Action = z.infer<typeof ActionSchema>;

export const ELEMENT_ACTIONS: Record<ElementType, Action[]> = {
  key: ["press", "hold"],
  dial: ["cw", "ccw"],
  scrollpad: ["up", "down", "tap"],
  trackball: ["up", "down", "left", "right", "click"],
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
  assignments: z.array(AssignmentSchema),
});
export type Layer = z.infer<typeof LayerSchema>;

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
  layers: z.array(LayerSchema).min(1),
});
export type LayoutInput = z.infer<typeof LayoutInputSchema>;

/** DBから取得した配列(公開情報。editSecretHashは含めない) */
export const LayoutSchema = LayoutInputSchema.extend({
  id: z.string().uuid(),
  slug: z.string().min(1), // 公開URL用
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Layout = z.infer<typeof LayoutSchema>;
