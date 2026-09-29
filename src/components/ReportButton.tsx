"use client";

import { useState, useTransition } from "react";
import { reportLayoutAction } from "@/app/k/[slug]/report-actions";
import { REPORT_REASONS, type ReportReasonId } from "@/lib/report-reasons";

/** 配列ページの「問題を報告する」(P6-5)。普段は小さなリンクだけを出し、押すと理由を選ぶ欄が開く */
export function ReportButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReasonId | null>(null);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-700">
        問題を報告する
      </button>
    );
  }

  if (result?.ok) {
    return (
      <p role="status" className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
        {result.message}
      </p>
    );
  }

  function send() {
    if (!reason) return;
    startTransition(async () => {
      const r = await reportLayoutAction({ slug, reason, comment });
      setResult(r.ok ? { ok: true, message: "報告を受け付けました。内容を確認します。ご協力ありがとうございます。" } : { ok: false, message: r.error });
    });
  }

  return (
    <section aria-label="問題を報告する" className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4">
      <h2 className="text-sm font-bold">この配列の問題を報告する</h2>
      <fieldset className="flex flex-wrap gap-3 text-sm">
        <legend className="mb-1 text-xs text-zinc-600">理由を選んでください</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r.id} className="flex items-center gap-1">
            <input type="radio" name="report-reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
            {r.label}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs text-zinc-600">詳しい内容(任意、500文字まで)</span>
        <textarea
          value={comment}
          maxLength={500}
          rows={3}
          onChange={(e) => setComment(e.target.value)}
          className="rounded-md border border-zinc-300 px-2 py-1.5"
        />
      </label>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-red-800">
          {result.message}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={!reason || isPending}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-40"
        >
          {isPending ? "送っています…" : "報告を送る"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm hover:bg-zinc-100">
          やめる
        </button>
      </div>
    </section>
  );
}
