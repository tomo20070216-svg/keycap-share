"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState, useTransition } from "react";
import { deleteLayoutAction, updateLayoutAction } from "@/app/k/[slug]/edit/actions";
import { submitLayoutAction } from "@/app/new/actions";
import { ActionChooser } from "@/components/editor/ActionChooser";
import { ComboEditor, MacroEditor } from "@/components/editor/ComboMacroEditor";
import { EditableKeymap } from "@/components/editor/EditableKeymap";
import { ElementPanel } from "@/components/editor/ElementPanel";
import { KeyPalette } from "@/components/editor/KeyPalette";
import { findKeyboard } from "@/keyboards";
import { keyPaletteFor } from "@/lib/key-palette";
import { LayerTabs } from "@/components/editor/LayerTabs";
import { TagPicker } from "@/components/editor/TagPicker";
import { useKeyDrag, type DragSource } from "@/components/editor/useKeyDrag";
import { canRedo, canUndo, createHistory, historyReducer, type EditorHistory, type HistoryAction } from "@/lib/editor-history";
import { canSwapElements, decideTapSwap, toLayoutInput, type EditorState } from "@/lib/editor-state";
import { removeEditKey, saveEditKey } from "@/lib/edit-keys";
import { findMissingEssentialKeys } from "@/lib/essential-keys";
import type { KeyboardPhysicalLayout } from "@/lib/schemas";

/**
 * 投稿エディタ(P5-2〜P5-6、P5-10〜P5-12)。
 * - キーの一覧からキー図へドラッグ&ドロップ(またはタップ→タップ)で置ける。キー図の中のドラッグは入れ替え
 * - 「ほかのキーと入れ替える」→相手をタップでも入れ替えられる(P7-3。スマホで左右が上下に分かれていても使える)
 * - 「元に戻す」「やり直す」
 * - 入力途中の内容は、このブラウザに下書きとして自動保存する(再読み込みしても戻る)
 * - 保存すると、配列ページのURLと編集用URL(秘密キー入り)を表示し、編集用URLはこのブラウザにも保存する
 * - 編集モード(edit を渡したとき。P6-3): 保存すると今の配列を更新し、削除もできる
 */

const DRAFT_PREFIX = "keycap-share:draft:";

type Saved = { slug: string; editSecret: string };

/** 下書きとして保存する内容(選択中の要素などの一時的な状態は空にする) */
function draftOf(state: EditorState): EditorState {
  return { ...state, selectedElementId: null, comboPicking: null };
}

/** エディタの状態(元に戻す履歴つき) + 「下書きを復元した」印 */
type ViewState = { history: EditorHistory; draftRestored: boolean };
type ReducerAction = HistoryAction | { type: "restore"; state: EditorState; draftRestored: boolean };

function reducer(view: ViewState, action: ReducerAction): ViewState {
  if (action.type === "restore") return { history: createHistory(action.state), draftRestored: action.draftRestored };
  return { ...view, history: historyReducer(view.history, action) };
}

const TYPE_NAMES = { key: "キー", dial: "ダイヤル", knob: "ダイヤル", scrollpad: "スクロールパッド", trackball: "トラックボール" } as const;

export function LayoutEditor({
  physicalLayout,
  initialState,
  draftKey,
  forkedFrom,
  devMode,
  edit,
  popularTags = [],
}: {
  physicalLayout: KeyboardPhysicalLayout;
  initialState: EditorState;
  /** 下書きの保存場所を分けるための名前(新規 = "new"、コピーして編集 = "fork:<slug>") */
  draftKey: string;
  /** コピーして編集のときの、元の配列 */
  forkedFrom?: { slug: string; title: string };
  /** 開発環境か(テスト投稿のチェックボックスを出す) */
  devMode: boolean;
  /** 編集モード: 保存すると、この配列を更新する(新しい配列は作らない) */
  edit?: { slug: string; secret: string };
  /** タグの候補に出す、ほかの人が使っているタグ(多い順。P7-8) */
  popularTags?: string[];
}) {
  const [view, dispatch] = useReducer(reducer, { history: createHistory(initialState), draftRestored: false });
  const { history, draftRestored } = view;
  const state = history.present;
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState<Saved | null>(null);
  /** 編集モードで保存・削除が終わったとき */
  const [editDone, setEditDone] = useState<"updated" | "deleted" | null>(null);
  const [testPost, setTestPost] = useState(devMode);
  const [isPending, startTransition] = useTransition();
  /** タップで選んだ一覧のキー(次にキー図のキーをタップすると置かれる) */
  const [armedLabel, setArmedLabel] = useState<string | null>(null);
  /** ダイヤル等に置くとき、どの操作に入れるか選んでもらう */
  const [pendingDrop, setPendingDrop] = useState<{ elementId: string; label: string } | null>(null);
  /** タップでの入れ替え(P7-3)の入れ替え元。次にタップした相手と割り当てを入れ替える */
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);
  /** ドラッグ&ドロップの結果のお知らせ */
  const [notice, setNotice] = useState<string | null>(null);
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
    if (!loaded.current || saved || editDone) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(draftOf(state)));
    } catch {
      // 保存できない環境では何もしない
    }
  }, [state, storageKey, saved, editDone]);

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y(Macは⌘)で元に戻す・やり直す。入力欄の中では、入力欄の元に戻すを優先する
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const key = e.key.toLowerCase();
      if (!(e.ctrlKey || e.metaKey) || (key !== "z" && key !== "y")) return;
      e.preventDefault();
      dispatch({ type: key === "y" || e.shiftKey ? "redo" : "undo" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 機種のキーマップのツール(Launcher / Vial)に合わせたキーの一覧(フェーズ8)
  const paletteCategories = keyPaletteFor(findKeyboard(physicalLayout.id)?.tool ?? "keychron-launcher");
  const currentLayer = state.layers.find((l) => l.layerNumber === state.currentLayer) ?? state.layers[0];
  const pickedElementIds = state.comboPicking === null ? null : (state.combos[state.comboPicking]?.elementIds ?? []);
  // コンボのキーを選び始めたら、タップでの入れ替えはやめる(描画中に自分の状態を直す、React の決まった書き方)
  if (state.comboPicking !== null && swapSourceId !== null) setSwapSourceId(null);

  const elementOf = (id: string) => physicalLayout.elements.find((e) => e.id === id);
  const elementName = (id: string) => {
    const el = elementOf(id);
    if (!el) return id;
    // 印字と種類の名前が同じ(ダイヤルなど)ときは、「ダイヤル(ダイヤル)」とならないよう種類を付けない
    return el.legend && el.legend !== TYPE_NAMES[el.type] ? `${el.legend}(${TYPE_NAMES[el.type]})` : TYPE_NAMES[el.type];
  };

  /** 一覧のキーを要素に置く。キーならタップに、それ以外はどの操作に入れるか選んでもらう */
  function placeLabel(label: string, elementId: string) {
    const el = elementOf(elementId);
    if (!el) return;
    setArmedLabel(null);
    if (el.type === "key") {
      dispatch({ type: "setAssignment", elementId, action: "press", label });
      setNotice(`${elementName(elementId)}に「${label}」を置きました。`);
    } else {
      setPendingDrop({ elementId, label });
    }
  }

  function handleDrop(source: DragSource, targetId: string | null) {
    // コンボのキーを選んでいる間は、ドラッグでの入れ替え・配置はしない
    if (!targetId || state.comboPicking !== null) return;
    setSwapSourceId(null);
    if (source.kind === "palette") {
      placeLabel(source.label, targetId);
      return;
    }
    if (source.elementId === targetId) return;
    if (canSwapElements(physicalLayout, source.elementId, targetId)) {
      dispatch({ type: "swapElements", from: source.elementId, to: targetId });
      setNotice(`${elementName(source.elementId)}と${elementName(targetId)}の割り当てを入れ替えました。`);
    } else {
      setNotice("種類が違う要素どうし(キーとトラックボールなど)は入れ替えられません。");
    }
  }

  /** タップ(ほとんど動かさずに離した)。一覧のキーなら置く先を選ぶ状態に、キー図の要素なら handleElementClick */
  function handleTap(source: DragSource) {
    if (source.kind === "palette") {
      toggleArmed(source.label);
    } else {
      handleElementClick(source.elementId);
    }
  }

  function toggleArmed(label: string) {
    setSwapSourceId(null);
    setArmedLabel((current) => (current === label ? null : label));
  }

  /** 選んでいる要素を入れ替え元にして、相手のタップを待つ */
  function startTapSwap(elementId: string) {
    setArmedLabel(null);
    setSwapSourceId(elementId);
    dispatch({ type: "selectElement", elementId: null });
    setNotice(null);
  }

  /** 入れ替え元を選んだあとに要素をタップしたとき */
  function finishTapSwap(from: string, to: string) {
    const result = decideTapSwap(physicalLayout, from, to);
    if (result === "mismatch") {
      setNotice(`${elementName(to)}とは種類が違うので入れ替えられません。${TYPE_NAMES[elementOf(from)!.type]}を選んでください。`);
      return;
    }
    setSwapSourceId(null);
    if (result === "cancel") {
      setNotice("入れ替えをやめました。");
      return;
    }
    dispatch({ type: "swapElements", from, to });
    setNotice(`${elementName(from)}と${elementName(to)}の割り当てを入れ替えました(${currentLayer.layerName})。`);
  }

  const drag = useKeyDrag(handleDrop, handleTap);

  /** ドラッグ中に、離したら何が起きるか(枠の色と、名前の下の説明) */
  const dropPreview: { elementId: string | null; allowed: boolean; message: string } | null = (() => {
    if (!drag.ghost) return null;
    const over = drag.overElementId;
    const source = drag.ghost.source;
    if (!over) {
      return { elementId: null, allowed: false, message: source.kind === "palette" ? "キーの上で離してください" : "入れ替えるキーの上で離してください" };
    }
    if (source.kind === "palette") {
      const el = elementOf(over);
      return {
        elementId: over,
        allowed: true,
        message: el?.type === "key" ? `${elementName(over)}に置く` : `${elementName(over)}に置く(操作を選びます)`,
      };
    }
    if (over === source.elementId) return { elementId: null, allowed: false, message: "入れ替えるキーの上で離してください" };
    return canSwapElements(physicalLayout, source.elementId, over)
      ? { elementId: over, allowed: true, message: `${elementName(over)}と入れ替え` }
      : { elementId: over, allowed: false, message: "種類が違うので入れ替えられません" };
  })();

  function handleElementClick(elementId: string) {
    if (state.comboPicking !== null) {
      dispatch({ type: "toggleComboElement", elementId });
    } else if (swapSourceId) {
      finishTapSwap(swapSourceId, elementId);
    } else if (armedLabel) {
      placeLabel(armedLabel, elementId);
    } else {
      dispatch({ type: "selectElement", elementId });
    }
  }

  function startElementDrag(elementId: string, e: React.PointerEvent) {
    const label =
      currentLayer.assignments.find((a) => a.elementId === elementId && a.action === "press")?.label ??
      currentLayer.assignments.find((a) => a.elementId === elementId)?.label ??
      elementName(elementId);
    drag.start({ kind: "element", elementId, label }, e);
  }

  function discardDraft() {
    if (!window.confirm("下書きを捨てて、最初の状態からやり直します。よろしいですか?")) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    dispatch({ type: "restore", state: initialState, draftRestored: false });
  }

  function clearDraft() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  /** 普段使うキーの不足チェック(フェーズ9)。不足があっても保存はブロックせず、確認してから続けられる */
  function confirmMissingEssentialKeys(): boolean {
    const missing = findMissingEssentialKeys(state.layers);
    if (missing.length === 0) return true;
    return window.confirm(
      `次のキーがこの配列のどこにもありません: ${missing.join("、")}\n` +
        "普段使うキーボードで使う入力が入っているか確認してください。\n" +
        "※ ここでの記号は基本側(Shiftなし)の文字です。キーボードによっては、同じキーをShiftと一緒に押すと別の記号(例: -→_、=→+)になり、それは別に確認していません。\n" +
        "このまま保存しますか?"
    );
  }

  function save() {
    setErrors([]);
    if (!confirmMissingEssentialKeys()) return;
    startTransition(async () => {
      if (edit) {
        const result = await updateLayoutAction(edit.slug, edit.secret, toLayoutInput(state));
        if (!result.ok) {
          setErrors(result.errors);
          return;
        }
        clearDraft();
        setEditDone("updated");
        return;
      }
      const result = await submitLayoutAction(toLayoutInput(state), testPost);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      saveEditKey(result.slug, result.editSecret, state.title.trim());
      clearDraft();
      setSaved({ slug: result.slug, editSecret: result.editSecret });
    });
  }

  function remove() {
    if (!edit) return;
    if (!window.confirm("この配列を削除します。削除すると元に戻せません。よろしいですか?")) return;
    setErrors([]);
    startTransition(async () => {
      const result = await deleteLayoutAction(edit.slug, edit.secret);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      removeEditKey(edit.slug);
      clearDraft();
      setEditDone("deleted");
    });
  }

  if (saved) return <SavedView saved={saved} title={state.title.trim()} />;
  if (edit && editDone) return <EditDoneView slug={edit.slug} done={editDone} title={state.title.trim()} />;

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
        {state.comboPicking === null && (
          <KeyPalette
            categories={paletteCategories}
            armedLabel={armedLabel}
            onPointerDownKey={(label, e) => drag.start({ kind: "palette", label }, e)}
            onTapKey={toggleArmed}
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "undo" })}
            disabled={!canUndo(history)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-40"
          >
            ↶ 元に戻す
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "redo" })}
            disabled={!canRedo(history)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-40"
          >
            ↷ やり直す
          </button>
          <span className="text-xs text-zinc-500">キー図のキーを別のキーへドラッグすると、割り当てを入れ替えられます。</span>
        </div>
        {armedLabel && (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span>{`「${armedLabel}」を置くキーを、キー図でタップしてください。`}</span>
            <button type="button" onClick={() => setArmedLabel(null)} className="underline underline-offset-4">
              やめる
            </button>
          </div>
        )}
        {swapSourceId && state.comboPicking === null && (
          <div role="status" className="flex flex-wrap items-center gap-3 rounded-md bg-violet-50 px-3 py-2 text-sm text-violet-900">
            <span>{`${elementName(swapSourceId)}と入れ替える相手を、キー図でタップしてください(左手・右手どちらでも。スクロールしてから選べます)。`}</span>
            <button
              type="button"
              onClick={() => {
                setSwapSourceId(null);
                setNotice("入れ替えをやめました。");
              }}
              className="underline underline-offset-4"
            >
              やめる
            </button>
          </div>
        )}
        {notice && (
          <p role="status" data-testid="drop-notice" className="text-sm text-zinc-700">
            {notice}
          </p>
        )}
        <EditableKeymap
          physicalLayout={physicalLayout}
          layer={currentLayer}
          combos={state.combos}
          selectedElementId={state.selectedElementId}
          pickedElementIds={pickedElementIds}
          onElementClick={handleElementClick}
          onElementPointerDown={startElementDrag}
          dropTarget={dropPreview?.elementId ? { elementId: dropPreview.elementId, allowed: dropPreview.allowed } : null}
          swapSourceId={state.comboPicking === null ? swapSourceId : null}
        />
        {pendingDrop && elementOf(pendingDrop.elementId) && (
          <ActionChooser
            label={pendingDrop.label}
            elementName={elementName(pendingDrop.elementId)}
            elementType={elementOf(pendingDrop.elementId)!.type}
            onChoose={(action) => {
              dispatch({ type: "setAssignment", elementId: pendingDrop.elementId, action, label: pendingDrop.label });
              setNotice(`${elementName(pendingDrop.elementId)}に「${pendingDrop.label}」を置きました。`);
              setPendingDrop(null);
            }}
            onCancel={() => setPendingDrop(null)}
          />
        )}
        {state.selectedElementId && state.comboPicking === null && (
          <ElementPanel
            physicalLayout={physicalLayout}
            layer={currentLayer}
            elementId={state.selectedElementId}
            onChange={(action, label) => dispatch({ type: "setAssignment", elementId: state.selectedElementId!, action, label })}
            onClose={() => dispatch({ type: "selectElement", elementId: null })}
            // 同じ種類の要素がほかにないとき(Orca echo のダイヤルなど)は、入れ替える相手がいないので出さない
            onStartSwap={
              physicalLayout.elements.filter((e) => e.type === elementOf(state.selectedElementId!)?.type).length > 1
                ? () => startTapSwap(state.selectedElementId!)
                : undefined
            }
          />
        )}
        {drag.ghost && (
          // 指で隠れないよう、指やカーソルの少し上に出す
          <div
            aria-hidden
            data-testid="drag-ghost"
            style={{
              position: "fixed",
              // 画面の右端からはみ出さないようにする(スマホ)
              left: Math.max(4, Math.min(drag.ghost.x + 12, window.innerWidth - 220)),
              top: Math.max(4, drag.ghost.y - 64),
              maxWidth: 216,
              pointerEvents: "none",
              zIndex: 50,
            }}
            className="flex flex-col gap-0.5 rounded-md bg-zinc-900/90 px-2.5 py-1.5 text-white shadow-lg"
          >
            <span className="text-sm font-bold">{drag.ghost.label}</span>
            {dropPreview && (
              <span className={`text-xs font-bold ${dropPreview.elementId ? (dropPreview.allowed ? "text-green-300" : "text-red-300") : "text-zinc-300"}`}>
                {dropPreview.message}
              </span>
            )}
          </div>
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
        <TagPicker
          tagsText={state.tagsText}
          onChange={(value) => dispatch({ type: "setField", field: "tagsText", value })}
          popularTags={popularTags}
          title={state.title}
          description={state.description}
          layers={state.layers}
        />
      </section>

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
        {devMode && !edit && (
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
            {isPending ? "保存しています…" : edit ? "変更を保存する" : "保存して共有URLを発行する"}
          </button>
        </div>
        <p className="text-xs text-zinc-500">入力途中の内容は、このブラウザに下書きとして自動で保存されます。</p>
      </section>

      {edit && (
        <section className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-base font-bold text-red-800">この配列を削除する</h2>
          <p className="text-sm text-red-800">削除すると、配列のページも共有したURLも見られなくなります。元に戻せません。</p>
          <div>
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="rounded-md border border-red-400 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              この配列を削除する
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function EditDoneView({ slug, done, title }: { slug: string; done: "updated" | "deleted"; title: string }) {
  return (
    <section role="status" className="flex flex-col gap-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 p-5">
      {done === "updated" ? (
        <>
          <h2 className="text-xl font-bold">{`「${title}」の変更を保存しました`}</h2>
          <p className="text-sm text-zinc-700">
            Xのカード画像は一度読み込まれるとしばらく更新されないことがあります。最新の見た目を確認したい場合は、Xのカード検証ツールなどをお試しください。
          </p>
          <div>
            <Link href={`/k/${slug}`} className="inline-block rounded-md bg-zinc-900 px-5 py-2.5 font-bold text-white hover:bg-zinc-700">
              配列のページを見る
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold">{`「${title}」を削除しました`}</h2>
          <div>
            <Link href="/" className="inline-block rounded-md bg-zinc-900 px-5 py-2.5 font-bold text-white hover:bg-zinc-700">
              配列の一覧へ
            </Link>
          </div>
        </>
      )}
    </section>
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
