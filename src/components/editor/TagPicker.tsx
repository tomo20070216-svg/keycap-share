"use client";

import { useState } from "react";
import { alignSpelling, hasTag, suggestTags, tagCandidates, toggleTag } from "@/lib/tag-suggestions";
import type { Layer } from "@/lib/schemas";

/**
 * タグを押すだけで付けられる候補(P7-8)と、内容からのおすすめ(P7-9)。
 * 押すと入力欄(tagsText)に追加され、もう一度押すと外れる。おすすめは自動では付けない。
 */
export function TagPicker({
  tagsText,
  onChange,
  popularTags,
  title,
  description,
  layers,
}: {
  tagsText: string;
  onChange: (tagsText: string) => void;
  /** ほかの人が使っているタグ(多い順) */
  popularTags: string[];
  title: string;
  description: string;
  layers: Layer[];
}) {
  const [error, setError] = useState<string | null>(null);
  const candidates = tagCandidates(popularTags);
  // すでに使われている書き方(例: "windows")があれば、それにそろえる
  const suggestions = alignSpelling(suggestTags({ title, description, tagsText, layers }), candidates);

  function toggle(tag: string) {
    const result = toggleTag(tagsText, tag);
    setError(result.error);
    if (!result.error) onChange(result.tagsText);
  }

  const chip = (tag: string, testId: string) => {
    const on = hasTag(tagsText, tag);
    return (
      <button
        key={tag}
        type="button"
        onClick={() => toggle(tag)}
        aria-pressed={on}
        data-testid={testId}
        className={`rounded-full border px-3 py-1 text-xs ${
          on ? "border-sky-500 bg-sky-100 font-bold text-sky-900" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        {on ? `✓ ${tag}` : `+ ${tag}`}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-600">おすすめ(内容から):</span>
          {suggestions.map((tag) => chip(tag, "tag-suggestion"))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-zinc-600">タグの候補(押すと付く・もう一度押すと外れる):</span>
        {candidates.map((tag) => chip(tag, "tag-candidate"))}
      </div>
      {error && (
        <p role="status" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
