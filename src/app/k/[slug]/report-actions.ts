"use server";

import { headers } from "next/headers";
import { clientIpFrom, ipHashFor } from "@/lib/rate-limit";
import { submitReport, type ReportResult } from "@/lib/reports";

/** 配列ページの「問題を報告する」から呼ばれる Server Function(P6-5)。入力の検証と回数の制限は submitReport の中で行う */
export async function reportLayoutAction(input: unknown): Promise<ReportResult> {
  const ipHash = ipHashFor(clientIpFrom(await headers()));
  return submitReport(input, ipHash);
}
