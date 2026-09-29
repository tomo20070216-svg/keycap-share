"use server";

import { headers } from "next/headers";
import { clientIpFrom, ipHashFor } from "@/lib/rate-limit";
import { setStar, type StarResult } from "@/lib/stars";

/** 配列ページの⭐️ボタンから呼ばれる Server Function(P7-6)。入力の検証と回数の制限は setStar の中で行う */
export async function setStarAction(input: unknown): Promise<StarResult> {
  const ipHash = ipHashFor(clientIpFrom(await headers()));
  return setStar(input, ipHash);
}
