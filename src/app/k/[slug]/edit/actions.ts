"use server";

import { checkEditSecret, deleteLayoutWithSecret, updateLayoutWithSecret, type EditResult } from "@/lib/layout-edit";

/**
 * 編集ページから呼ばれる Server Function(P6-3)。
 * 画面を通さず直接呼び出されても安全なよう、秘密キーの照合と入力の検証は、それぞれの処理の中で必ず行う。
 */

export async function checkEditSecretAction(slug: string, secret: string): Promise<boolean> {
  if (typeof slug !== "string" || typeof secret !== "string") return false;
  return checkEditSecret(slug, secret);
}

export async function updateLayoutAction(slug: string, secret: string, input: unknown): Promise<EditResult> {
  if (typeof slug !== "string" || typeof secret !== "string") return { ok: false, errors: ["入力内容に誤りがあります。"] };
  return updateLayoutWithSecret(slug, secret, input);
}

export async function deleteLayoutAction(slug: string, secret: string): Promise<EditResult> {
  if (typeof slug !== "string" || typeof secret !== "string") return { ok: false, errors: ["入力内容に誤りがあります。"] };
  return deleteLayoutWithSecret(slug, secret);
}
