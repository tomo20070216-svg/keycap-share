import type { z } from "zod";
import { orcaEcho } from "@/keyboards/orca-echo";
import { validateCombos, validateLayersAgainstPhysicalLayout } from "@/lib/layout-validation";
import { LayoutInputSchema, MAX_LAYERS, type KeyboardPhysicalLayout, type LayoutInput } from "@/lib/schemas";
import { checkDescriptionUrls } from "@/lib/spam-rules";

/**
 * エディタからの投稿の検証(P5-1)。Supabaseを使わない部分なので、ここだけでテストできる。
 * Server Function は画面を通さず直接呼び出せるため、画面側の検証とは別に、必ずサーバーでここを通す。
 * エラーの文言は docs/voice.md の方針(何が起きたか + 次に何をすればよいか)。
 */

/** 投稿できる機種(今は Orca echo だけ。docs/mission.md) */
export const SUPPORTED_KEYBOARDS: Record<string, KeyboardPhysicalLayout> = {
  [orcaEcho.id]: orcaEcho,
};

export type ParsedLayoutInput = z.output<typeof LayoutInputSchema>;

export type SubmissionValidation =
  | { ok: true; input: ParsedLayoutInput }
  | { ok: false; errors: string[] };

/** 入力項目ごとの、分かりやすい説明 */
function describeIssue(issue: z.core.$ZodIssue): string {
  const [first, , third, , fifth] = issue.path;
  switch (first) {
    case "title":
      return "タイトルを入力してください(1〜80文字)。";
    case "description":
      return "「なぜこの配置にしたか」は2000文字以内にしてください。";
    case "authorName":
      return "投稿者名は40文字以内にしてください。";
    case "tags":
      return "タグは10個まで、1つ20文字以内にしてください。";
    case "layers":
      if (issue.path.length === 1) return `レイヤーは通常を含めて1〜${MAX_LAYERS}個にしてください。`;
      if (third === "layerName") return "レイヤー名を入力してください(1〜40文字)。";
      if (third === "assignments" && fifth === "label") return "キーの表示名は1〜40文字にしてください。";
      if (third === "assignments") return "1つのレイヤーの割り当てが多すぎます(300件まで)。";
      return "レイヤーの内容に誤りがあります。";
    case "combos":
      if (issue.path.length === 1) return "コンボは50個までにしてください。";
      return "コンボは、キーを2つ以上(重複なし)選び、表示名(1〜40文字)を入力してください。";
    case "macros":
      if (issue.path.length === 1) return "マクロは50個までにしてください。";
      return "マクロの名前は1〜20文字、説明は200文字以内にしてください。";
    default:
      return "入力内容に誤りがあります。内容を見直してから、もう一度保存してください。";
  }
}

export function validateSubmission(raw: unknown): SubmissionValidation {
  const parsed = LayoutInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: [...new Set(parsed.error.issues.map(describeIssue))] };
  }
  const input = parsed.data;

  const keyboard = SUPPORTED_KEYBOARDS[input.keyboardId];
  if (!keyboard) {
    return { ok: false, errors: ["この機種にはまだ対応していません。今は Keychron Orca echo だけ投稿できます。"] };
  }

  const errors: string[] = [];
  // 簡易的な不正検知: 説明文のURLが多すぎる投稿(宣伝目的のスパム)を拒否する(P6-4)
  const urlError = checkDescriptionUrls(input.description);
  if (urlError) errors.push(urlError);
  const layerNumbers = input.layers.map((l) => l.layerNumber);
  if (new Set(layerNumbers).size !== layerNumbers.length) {
    errors.push("同じ番号のレイヤーが2つあります。レイヤーを見直してください。");
  }
  if (validateLayersAgainstPhysicalLayout(input.layers, keyboard).length > 0) {
    errors.push("キーの割り当てに、この機種にないキーや操作が含まれています。ページを再読み込みしてからやり直してください。");
  }
  if (validateCombos(input.combos, input.layers, keyboard).length > 0) {
    errors.push("コンボに、この機種にないキー・キー以外の要素・存在しないレイヤーが含まれています。コンボを見直してください。");
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, input };
}

export type { LayoutInput };
