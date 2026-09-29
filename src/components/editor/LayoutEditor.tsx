"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState, useTransition } from "react";
import { submitLayoutAction } from "@/app/new/actions";
import { ComboEditor, MacroEditor } from "@/components/editor/ComboMacroEditor";
import { EditableKeymap } from "@/components/editor/EditableKeymap";
import { ElementPanel } from "@/components/editor/ElementPanel";
import { LayerTabs } from "@/components/editor/LayerTabs";
import { editorReducer, toLayoutInput, type EditorAction, type EditorState } from "@/lib/editor-state";
import type { KeyboardPhysicalLayout } from "@/lib/schemas";

/**
 * 投稿エディタ(P5-2〜P5-6)。
 * - 入力途中の内容は、このブラウザに下書きとして自動保存する(再読み込みしても戻る)
 * - 保存すると、配列ページのURLと編集用URL(秘密キー入り)を表示し、編集用URLはこのブラウザにも保存する
 */

const DRAFT_PREFIX = "keycap-share:draft:";
const EDIT_KEYS_STORAGE = "keycap-share:edit-keys";

type Saved = { slug: string; editSecret: string };

/** 下書きとして保存する内容(選択中の要素などの一時的な状態は空にする) */
function draftOf(state: EditorState): EditorState {
  return { ...state, selectedElementId: null, comboPicking: null };
}

/** エディタの状態 + 「下書きを復元した」印 */
type ViewState = { editor: EditorState; draftRestored: boolean };
type ReducerAction = EditorAction | { type: "restore"; state: EditorState; draftRestored: boolean };

function reducer(view: ViewState, action: ReducerAction): ViewState {
  if (action.type === "restore") return { editor: action.state, draftRestored: action.draftRestored };
  return { ...view, editor: editorReducer(view.editor, action) };
}

function saveEditKey(saved: Saved, title: string) {
  try {
    const all = JSON.parse(localStorage.getItem(EDIT_KEYS_STORAGE) ?? "{}") as Record<string, unknown>;
    all[saved.slug] = { editSecret: saved.editSecret, title, savedAt: new Date().toISOString() };
    localStorage.setItem(EDIT_KEYS_STORAGE, JSON.stringify(all));
  } catch {
    // localStorage が使えない環境(プライベートブラウズ等)では保存しない。画面のURLを控えてもらう
  }
}

export function LayoutEditor({
  physicalLayout,
  initialState,
  draftKey,
  forkedFrom,
  devMode,
}: {
  physicalLayout: KeyboardPhysicalLayout;
  initialState: EditorState;
  /** 下書きの保存場所を分けるための名前(新規 = "new"、コピーして編集 = "fork:<slug>") */
  draftKey: string;
  /** コピーして編集のときの、元の配列 */
  forkedFrom?: { slug: string; title: string };
  /** 開発環境か(テスト投稿のチェックボックスを出す) */
  devMode: boolean;
}) {
  const [view, dispatch] = useReducer(reducer, { editor: initialState, draftRestored: false });
  const { editor: state, draftRestored } = view;
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [testPost, setTestPost] = useState(devMode);
  const [isPending, startTransition] = useTransition();
  const loaded = useRef(false);
  /** 画面を開いた直後の1回は下書きを保存しない(読み込む前の最初の状態で、保存済みの下書きを上書きしないため) */
  const skipNextSave = useRef(true);
  const storageKey = DRAFT_PREFIX + draftKey;

  // 下書きを読み込む(画面を開いたとき1回だけ)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const draft = JSON.parse(raw) as EditorState;
        dispatch({
          type: "restore",
          state: { ...initialState, ...draft, selectedElementId: null, comboPicking: null },
          draftRestored: true,
        });
      }
    } catch {
      // 壊れた下書きは無視する
    }
    loaded.current = true;
    skipNextSave.current = true;
  }, [storageKey, initialState]);

  // 入力のたびに下書きを保存する(保存が終わった後は保存しない)
  useEffect(() => {
    if (!loaded.current || saved) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(draftOf(state)));
    } catch {
      // 保存できない環境では何もしない
    }
  }, [state, storageKey, saved]);

  const currentLayer = state.layers.find((l) => l.layerNumber === state.currentLayer) ?? state.layers[0];
  const pickedElementIds = state.comboPicking === null ? null : (state.combos[state.comboPicking]?.elementIds ?? []);

  function discardDraft() {
    if (!window.confirm("下書きを捨てて、最初の状態からやり直します。よろしいですか?")) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    dispatch({ type: "restore", state: initialState, draftRestored: false });
  }

  function save() {
    setErrors([]);
    startTransition(async () => {
      const result = await submitLayoutAction(toLayoutInput(state), testPost);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      saveEditKey(result, state.title.trim());
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      setSaved({ slug: result.slug, editSecret: result.editSecret });
    });
  }

  if (saved) return <SavedView saved={saved} title={state.title.trim()} />;

  return (
    <div className="flex flex-col gap-6">
      {forkedFrom && (
        <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm">
          {"「"}
          <Link href={`/k/${forkedFrom.slug}`} className="underline underline-offset-4">
            {forkedFrom.title}
          </Link>
          {"」をコピーして編集しています。保存すると、元の配列とは別の新しい配列になります。"}
        </p>
      )}
      {draftRestored && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-900">
          <span>前回の下書きを復元しました。</span>
          <button type="button" onClick={discardDraft} className="underline underline-offset-4">
            下書きを捨てて最初からやり直す
          </button>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">
            タイトル <span className="text-red-600">(必須)</span>
          </span>
          <input
            type="text"
            value={state.title}
            maxLength={80}
            onChange={(e) => dispatch({ type: "setField", field: "title", value: e.target.value })}
            placeholder="例: 親指で変換する日本語入力向け配列"
            className="rounded-md border border-zinc-300 px-2 py-2 text-base"
          />
        </label>
        <div className="text-sm text-zinc-600">{`機種: ${physicalLayout.name}`}</div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">投稿者名(任意)</span>
          <input
            type="text"
            value={state.authorName}
            maxLength={40}
            onChange={(e) => dispatch({ type: "setField", field: "authorName", value: e.target.value })}
            placeholder="ニックネームなど"
            className="rounded-md border border-zinc-300 px-2 py-2 sm:w-80"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">キーの割り当て</h2>
        <p className="text-sm text-zinc-600">
          キー図のキー(ダイヤル・トラックボール・スクロールパッドも)をクリックすると、表示する名前を入力できます。
        </p>
        <LayerTabs layers={state.layers} currentLayer={state.currentLayer} dispatch={dispatch} />
        <EditableKeymap
          physicalLayout={physicalLayout}
          layer={currentLayer}
          combos={state.combos}
          selectedElementId={state.selectedElementId}
          pickedElementIds={pickedElementIds}
          onElementClick={(elementId) =>
            dispatch(state.comboPicking === null ? { type: "selectElement", elementId } : { type: "toggleComboElement", elementId })
          }
        />
        {state.selectedElementId && state.comboPicking === null && (
          <ElementPanel
            physicalLayout={physicalLayout}
            layer={currentLayer}
            elementId={state.selectedElementId}
            onChange={(action, label) => dispatch({ type: "setAssignment", elementId: state.selectedElementId!, action, label })}
            onClose={() => dispatch({ type: "selectElement", elementId: null })}
          />
        )}
      </section>

      <ComboEditor
        physicalLayout={physicalLayout}
        layers={state.layers}
        combos={state.combos}
        comboPicking={state.comboPicking}
        dispatch={dispatch}
      />
      <MacroEditor macros={state.macros} dispatch={dispatch} />

      <section className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">なぜこの配置にしたか(任意)</span>
          <textarea
            value={state.description}
            maxLength={2000}
            rows={5}
            onChange={(e) => dispatch({ type: "setField", field: "description", value: e.target.value })}
            placeholder="例: 親指で変換・無変換を押せるようにして、日本語入力の切り替えを楽にしました。"
            className="rounded-md border border-zinc-300 px-2 py-2 leading-relaxed"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-bold">タグ(任意。空白で区切る。10個まで)</span>
          <input
            type="text"
            value={state.tagsText}
            onChange={(e) => dispatch({ type: "setField", field: "tagsText", value: e.target.value })}
            placeholder="例: 日本語入力 親指キー 初心者向け"
            className="rounded-md border border-zinc-300 px-2 py-2"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
        {devMode && (
          <label className="flex items-center gap-2 text-sm text-amber-800">
            <input type="checkbox" checked={testPost} onChange={(e) => setTestPost(e.target.checked)} />
            テスト投稿にする(一覧に出さない。開発環境だけの項目です)
          </label>
        )}
        {errors.length > 0 && (
          <ul role="alert" className="flex flex-col gap-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <div>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-6 py-3 text-base font-bold text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {isPending ? "保存しています…" : "保存して共有URLを発行する"}
          </button>
        </div>
        <p className="text-xs text-zinc-500">入力途中の内容は、このブラウザに下書きとして自動で保存されます。</p>
      </section>
    </div>
  );
}

function SavedView({ saved, title }: { saved: Saved; title: string }) {
  // 保存後にブラウザでだけ表示する画面なので、サーバー側で描かれることはない
  const origin = window.location.origin;
  const pageUrl = `${origin}/k/${saved.slug}`;
  const editUrl = `${origin}/k/${saved.slug}/edit#key=${saved.editSecret}`;
  return (
    <section role="status" className="flex flex-col gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-5">
      <h2 className="text-xl font-bold">{`「${title}」を保存しました`}</h2>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-bold">共有URL(このURLをXなどで共有できます)</div>
        <Link href={`/k/${saved.slug}`} className="break-all text-lg underline underline-offset-4" data-testid="share-url">
          {pageUrl}
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm font-bold">編集用URL(あなただけが持つ秘密のURLです)</div>
        <code className="break-all rounded bg-white px-2 py-1 text-sm" data-testid="edit-url">
          {editUrl}
        </code>
        <p className="text-sm text-red-800">
          このURLをなくすと、この配列を編集・削除できなくなります。安全な場所に控えておいてください(このブラウザにも保存しました)。他の人には教えないでください。編集機能は近日公開予定です。
        </p>
      </div>
      <div>
        <Link href={`/k/${saved.slug}`} className="inline-block rounded-md bg-zinc-900 px-5 py-2.5 font-bold text-white hover:bg-zinc-700">
          配列のページを見る
        </Link>
      </div>
    </section>
  );
}
