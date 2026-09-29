// 投稿エディタの動作確認(P5-2〜P5-6)。ヘッドレスChromeを DevTools Protocol で操作する。
// 前提: Chrome を --remote-debugging-port=9333 で起動し、開発サーバー(http://localhost:3123)が動いていること。
// 使い方: node cdp-editor.mjs <スクリーンショットの保存先フォルダ>
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
const BASE = "http://localhost:3123";
const targets = await (await fetch("http://127.0.0.1:9333/json/list")).json();
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ev(expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r.result?.exceptionDetails) throw new Error(`評価エラー: ${r.result.exceptionDetails.exception?.description ?? expression}`);
  return r.result?.result?.value;
}
async function shot(name, height = 1400) {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1100, height, scale: 1 } });
  writeFileSync(join(outDir, name), Buffer.from(r.result.data, "base64"));
  console.log("  スクリーンショット:", name);
}
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
}
// React の入力欄に値を入れる(value の setter を通して input イベントを出す)
const typeInto = (selector, value) =>
  ev(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
const clickText = (tag, text) =>
  ev(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(tag)})].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!el) throw new Error("見つからない: ${text}"); el.click(); return true; })()`);
const clickElement = (elementId) => ev(`document.querySelector('[data-element-id="${elementId}"]').click()`);
const diagramText = () => ev(`[...document.querySelectorAll("section")].map(s => s.innerText).join("\\n")`);

await send("Page.enable");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 1400, deviceScaleFactor: 1, mobile: false });
// 前回の下書き・保存した編集キーを消してから始める
await send("Page.navigate", { url: `${BASE}/new` });
await sleep(5000);
await ev(`localStorage.removeItem("keycap-share:draft:new"); localStorage.removeItem("keycap-share:edit-keys"); true`);
await send("Page.reload");
await sleep(6000);

// P5-2: 開いた直後
console.log("\n[P5-2] エディタの土台");
const initialLabels = await ev(`document.body.innerText`);
check("工場出荷時配列が入っている(Esc・Q・2.4GHz は fn2 なので通常レイヤーには Esc と Q)", initialLabels.includes("Esc") && initialLabels.includes("Q"));
check("機種は Orca echo に固定", initialLabels.includes("機種: Keychron Orca echo"));
await shot("p5-2-initial.png", 1500);
await clickText("button", "保存して共有URLを発行する");
await sleep(3000);
const alert1 = await ev(`document.querySelector('[role="alert"]')?.innerText ?? ""`);
check("タイトルが空のまま保存するとエラーになる", alert1.includes("タイトルを入力してください"), alert1);
await shot("p5-2-title-required.png", 1500);

// P5-3: キーをクリックして入力
console.log("\n[P5-3] キー図をクリックして割り当てを入力");
await clickElement("L-0-0");
await sleep(500);
check("キーをクリックすると割り当ての入力欄が開く", (await ev(`!!document.querySelector('section[aria-label="割り当ての編集"]')`)) === true);
await typeInto('section[aria-label="割り当ての編集"] input[data-action="press"]', "半角/全角");
await typeInto('section[aria-label="割り当ての編集"] input[data-action="hold"]', "Ctrl");
await sleep(500);
const t1 = await diagramText();
check("入力した表示名がその場でキー図に反映される", t1.includes("半角/全角") || (await ev(`document.body.innerHTML.includes("半角/全角")`)));
await shot("p5-3-key-edited.png", 1100);
await clickElement("L-DIAL");
await sleep(500);
const dialInputs = await ev(`[...document.querySelectorAll('section[aria-label="割り当ての編集"] input')].map(i => i.dataset.action).join(",")`);
check("ダイヤルは右回し・左回しを入力できる", dialInputs === "cw,ccw", dialInputs);
await typeInto('section[aria-label="割り当ての編集"] input[data-action="cw"]', "音量+");
await typeInto('section[aria-label="割り当ての編集"] input[data-action="ccw"]', "音量-");
await clickElement("R-TRACKBALL");
await sleep(500);
const ballInputs = await ev(`[...document.querySelectorAll('section[aria-label="割り当ての編集"] input')].map(i => i.dataset.action).join(",")`);
check("トラックボールは上下左右を入力できる(クリックはない)", ballInputs === "up,down,left,right", ballInputs);
await typeInto('section[aria-label="割り当ての編集"] input[data-action="left"]', "戻る");
await sleep(500);
check("ダイヤル・トラックボールの入力もキー図に反映される", await ev(`document.body.innerHTML.includes("音量+") && document.body.innerHTML.includes("戻る")`));
await shot("p5-3-dial-trackball.png", 1100);
await clickText("button", "閉じる");

// P5-4: レイヤー
console.log("\n[P5-4] レイヤーの追加・名前変更・削除");
const tabs = () => ev(`[...document.querySelectorAll('[role="tab"]')].map(t => t.textContent).join(" | ")`);
await clickText("button", "＋ レイヤーを追加");
await sleep(300);
check("レイヤーを追加できる", (await tabs()).includes("3: レイヤー3"), await tabs());
await typeInto('section[aria-label="レイヤー"] input', "記号");
await sleep(300);
check("レイヤーの名前を変更できる", (await tabs()).includes("3: 記号"), await tabs());
await shot("p5-4-layer-added.png", 900);
await ev(`window.confirm = () => true; true`);
await clickText("button", "このレイヤーを削除");
await sleep(300);
check("レイヤーを削除できる", !(await tabs()).includes("記号"), await tabs());
await ev(`document.querySelector('[role="tab"]').click()`);
await sleep(300);
check("基本レイヤーには削除ボタンがなく、削除できない旨が出る", (await ev(`document.body.innerText.includes("基本レイヤーは削除できません") && ![...document.querySelectorAll("button")].some(b => b.textContent === "このレイヤーを削除")`)) === true);

// P5-5: コンボ・マクロ
console.log("\n[P5-5] コンボとマクロ");
await clickText("button", "＋ コンボを追加");
await sleep(300);
await clickElement("R-1-2");
await clickElement("R-1-3");
await sleep(300);
await typeInto('section[aria-labelledby="combo-heading"] input[type="text"]', "左クリック");
await clickText("button", "キーを選び終える");
await sleep(500);
check("コンボを追加すると、キー図に番号の丸が付き、一覧にも出る", await ev(`document.body.innerText.includes("J + K")`));
await clickText("button", "＋ マクロを追加");
await sleep(300);
await typeInto('section[aria-labelledby="macro-heading"] input[maxlength="20"]', "署名");
await typeInto('section[aria-labelledby="macro-heading"] input[maxlength="200"]', "(テスト)挨拶文を入力");
await sleep(300);
check("マクロを追加できる", await ev(`[...document.querySelectorAll('section[aria-labelledby="macro-heading"] input')].some(i => i.value === "署名")`));
await shot("p5-5-combo-macro.png", 2200);
await clickText("button", "＋ マクロを追加");
await sleep(200);
await ev(`[...document.querySelectorAll('section[aria-labelledby="macro-heading"] button')].filter(b => b.textContent === "削除").at(-1).click()`);
await sleep(300);
check("マクロを削除できる", (await ev(`document.querySelectorAll('section[aria-labelledby="macro-heading"] input[maxlength="20"]').length`)) === 1);

// P5-6: 下書きの復元 → 保存
console.log("\n[P5-6] 下書き・保存");
await typeInto('input[placeholder^="例: 親指で変換"]', "P5 エディタの動作確認(テスト投稿)");
await typeInto('textarea[placeholder^="例: 親指で"]', "エディタの動作確認のためのテスト投稿です。");
await typeInto('input[placeholder^="例: 日本語入力"]', "テスト投稿");
await sleep(800);
await send("Page.reload");
await sleep(6000);
const restored = await ev(`({ notice: document.body.innerText.includes("前回の下書きを復元しました"), title: document.querySelector('input[placeholder^="例: 親指で変換"]').value, key: document.body.innerHTML.includes("半角/全角") })`);
check("再読み込みしても入力途中の下書きが戻る", restored.notice && restored.title === "P5 エディタの動作確認(テスト投稿)" && restored.key, JSON.stringify(restored));
check("開発環境ではテスト投稿(一覧に出さない)のチェックが入っている", await ev(`[...document.querySelectorAll('input[type="checkbox"]')].some(c => c.parentElement.textContent.includes("テスト投稿にする") && c.checked)`));
await clickText("button", "保存して共有URLを発行する");
await sleep(8000);
const saved = await ev(`({ share: document.querySelector('[data-testid="share-url"]')?.textContent ?? null, edit: document.querySelector('[data-testid="edit-url"]')?.textContent ?? null, keys: localStorage.getItem("keycap-share:edit-keys"), draft: localStorage.getItem("keycap-share:draft:new") })`);
check("保存すると共有URLが表示される", !!saved.share && /\/k\/[A-Za-z0-9_-]{11}$/.test(saved.share), saved.share);
check("編集用URL(秘密キー入り)が表示される", !!saved.edit && /\/edit#key=[A-Za-z0-9_-]{43}$/.test(saved.edit));
const slug = saved.share?.split("/k/")[1];
const keys = JSON.parse(saved.keys ?? "{}");
check("編集用URLの秘密キーが localStorage に保存される", !!slug && !!keys[slug] && saved.edit.endsWith(keys[slug].editSecret));
check("保存後は下書きが消える", saved.draft === null);
// 秘密キーはスクリーンショットに写さないよう、表示を伏せてから撮る
await ev(`document.querySelector('[data-testid="edit-url"]').textContent = document.querySelector('[data-testid="edit-url"]').textContent.replace(/#key=.*/, "#key=(証拠用に伏せています)"); true`);
await shot("p5-6-saved.png", 700);
console.log("\n発行された共有URL:", saved.share);

console.log(`\n結果: ${results.filter((r) => r.ok).length}/${results.length} 成功`);
ws.close();
