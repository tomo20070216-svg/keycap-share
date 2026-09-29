import { createLayout } from "@/lib/layout-repository";
import { validateSubmission } from "@/lib/layout-submission";

/**
 * 投稿を検証して保存する(P5-1)。サーバー側でのみ使う(secret key で書き込むため)。
 * 成功すると slug と編集用秘密キー(平文。DBにはハッシュだけが残るので、ここでしか得られない)を返す。
 */
export type SubmitResult =
  | { ok: true; slug: string; editSecret: string }
  | { ok: false; errors: string[] };

export async function submitLayout(
  raw: unknown,
  options: { isListed?: boolean; slug?: string } = {}
): Promise<SubmitResult> {
  const validation = validateSubmission(raw);
  if (!validation.ok) return validation;
  try {
    const { layout, editSecret } = await createLayout(validation.input, {
      isListed: options.isListed ?? true,
      slug: options.slug,
    });
    return { ok: true, slug: layout.slug, editSecret };
  } catch (error) {
    console.error("配列の保存に失敗しました", error);
    return {
      ok: false,
      errors: ["保存に失敗しました。時間をおいて、もう一度保存してください。入力内容はこのブラウザに下書きとして残っています。"],
    };
  }
}
