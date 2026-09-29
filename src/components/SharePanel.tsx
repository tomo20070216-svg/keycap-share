"use client";

import { useState } from "react";
import { buildXIntentUrl } from "@/lib/share";

/**
 * 共有パネル(P4-4〜P4-6)。
 * - 文面の編集欄 + 「Xで共有する」: 編集した文面でXの投稿画面を開く(投稿はXの画面で本人が行う)
 * - 「画像をダウンロード」「画像をコピー」: OGP画像(1200×630のPNG)
 * - Xのカード画像のキャッシュについての注意書き(docs/voice.md の文例)
 */
export function SharePanel({
  initialText,
  pageUrl,
  imageUrl,
  imageFileName,
}: {
  /** 編集欄の初期値(buildShareText) */
  initialText: string;
  /** 共有するページの絶対URL */
  pageUrl: string;
  /** OGP画像のURL(同じサイト内のパス) */
  imageUrl: string;
  /** ダウンロード時のファイル名 */
  imageFileName: string;
}) {
  const [text, setText] = useState(initialText);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied" | "unsupported" | "failed">("idle");

  async function copyImage() {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      setCopyStatus("unsupported");
      return;
    }
    setCopyStatus("copying");
    try {
      // Safari では、画像の取得を待たずに ClipboardItem を作る必要がある(Promise のまま渡す)
      const blob = fetch(imageUrl).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  const copyMessage: Record<typeof copyStatus, string | null> = {
    idle: null,
    copying: "コピーしています…",
    copied: "画像をコピーしました。Xの投稿画面などに貼り付けられます。",
    unsupported:
      "お使いのブラウザは画像のコピーに対応していません。「画像をダウンロード」で保存してからお使いください。",
    failed:
      "画像をコピーできませんでした。ブラウザの権限の設定を確認するか、「画像をダウンロード」で保存してからお使いください。",
  };

  return (
    <section aria-labelledby="share-heading" className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4">
      <h2 id="share-heading" className="text-base font-bold">
        Xで共有する
      </h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600">投稿する文面(自由に書き換えられます。ページのURLは自動で付きます)</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="rounded-md border border-zinc-300 p-2 text-[15px] leading-relaxed"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <a
          href={buildXIntentUrl(text, pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
        >
          Xで共有する
        </a>
        <a
          href={imageUrl}
          download={imageFileName}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100"
        >
          画像をダウンロード
        </a>
        <button
          type="button"
          onClick={copyImage}
          disabled={copyStatus === "copying"}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50"
        >
          画像をコピー
        </button>
      </div>
      {copyMessage[copyStatus] && (
        <p role="status" className="text-sm text-zinc-700">
          {copyMessage[copyStatus]}
        </p>
      )}
      <p className="text-xs text-zinc-500">
        Xのカード画像は一度読み込まれるとしばらく更新されないことがあります。最新の見た目を確認したい場合は、Xのカード検証ツールなどをお試しください。
      </p>
    </section>
  );
}
