"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutEditor } from "@/components/editor/LayoutEditor";
import { checkEditSecretAction } from "@/app/k/[slug]/edit/actions";
import { getEditKey, readKeyFromHash, saveEditKey } from "@/lib/edit-keys";
import type { EditorState } from "@/lib/editor-state";
import type { KeyboardPhysicalLayout } from "@/lib/schemas";

/**
 * 編集ページのブラウザ側(P6-3)。
 * 秘密キーは URL の # 以降(#key=...)から読む(# 以降はサーバーに送られないので、アクセス記録に残らない)。
 * # がなければ、このブラウザに保存してある秘密キーを使う。サーバーで確認できたら、エディタを出す。
 */
export function EditPageClient({
  slug,
  title,
  physicalLayout,
  initialState,
}: {
  slug: string;
  title: string;
  physicalLayout: KeyboardPhysicalLayout;
  initialState: EditorState;
}) {
  const [status, setStatus] = useState<{ kind: "checking" } | { kind: "ok"; secret: string } | { kind: "invalid" }>({
    kind: "checking",
  });

  useEffect(() => {
    let cancelled = false;
    const secret = readKeyFromHash(window.location.hash) ?? getEditKey(slug);
    // アドレスバーから秘密キーを消す(画面を見せたり、URLをコピーしたりしたときに漏れないように)
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    if (!secret) {
      queueMicrotask(() => !cancelled && setStatus({ kind: "invalid" }));
      return;
    }
    checkEditSecretAction(slug, secret).then((ok) => {
      if (cancelled) return;
      if (ok) {
        saveEditKey(slug, secret, title);
        setStatus({ kind: "ok", secret });
      } else {
        setStatus({ kind: "invalid" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug, title]);

  if (status.kind === "checking") {
    return (
      <p role="status" className="text-zinc-600">
        編集用のキーを確認しています…
      </p>
    );
  }
  if (status.kind === "invalid") {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
        <p className="font-bold">この配列を編集できません。</p>
        <p className="text-sm">
          編集用のキーが見つからないか、正しくありません。保存したときに表示された「編集用URL」から開き直してください。編集用URLは、配列を投稿した人だけが持っています。
        </p>
        <div>
          <Link href={`/k/${slug}`} className="text-sm underline underline-offset-4">
            配列のページへ戻る
          </Link>
        </div>
      </div>
    );
  }
  return (
    <LayoutEditor
      physicalLayout={physicalLayout}
      initialState={initialState}
      draftKey={`edit:${slug}`}
      devMode={false}
      edit={{ slug, secret: status.secret }}
    />
  );
}
