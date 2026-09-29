// ドラッグ&ドロップ・入れ替え・元に戻すの動作確認(P5-10〜P5-12)。
// ヘッドレスChromeを DevTools Protocol で操作し、マウスのドラッグと指(タッチ)の操作を実際の入力として送る。
// 前提: Chrome を --remote-debugging-port=9333 で起動し、開発サーバー(http://localhost:3123)が動いていること。
// 使い方: node cdp-dnd.mjs <スクリーンショットの保存先フォルダ>
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
/** 今表示している範囲を撮る(focusSelector があれば、その要素を画面の中央に表示してから) */
async function shot(name, width, height, focusSelector) {
  if (focusSelector) await ev(`(${VISIBLE})(${JSON.stringify(focusSelector)}).scrollIntoView({ block: "center" }); true`);
  await sleep(200);
  const { sx, sy } = await ev(`({ sx: scrollX, sy: scrollY })`);
  const r = await send("Page.captureScreenshot", { format: "png", clip: { x: sx, y: sy, width, height, scale: 1 } });
  writeFileSync(join(outDir, name), Buffer.from(r.result.data, "base64"));
  console.log("  スクリーンショット:", name);
}
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
}
/** 要素の中心の座標(画面内に見えるようにスクロールしてから) */
/** 見えている要素を探す(キー図は広い画面用と狭い画面用の2つがあり、片方は非表示) */
const VISIBLE = `(sel) => [...document.querySelectorAll(sel)].find(e => e.getClientRects().length > 0)`;
async function center(selector) {
  return ev(`(() => {
    const el = (${VISIBLE})(${JSON.stringify(selector)});
    if (!el) throw new Error("見つからない: ${selector.replace(/"/g, "'")}");
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
}
async function mouseDrag(fromSel, toSel) {
  const a = await center(fromSel);
  // ドラッグ元を中央に表示した状態で、ドロップ先の位置を測る(ドラッグ中はスクロールしない)
  const b = await ev(`(() => { const r = (${VISIBLE})(${JSON.stringify(toSel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, visible: r.top >= 0 && r.bottom <= innerHeight }; })()`);
  if (!b.visible) throw new Error("ドロップ先が画面外です");
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: a.x, y: a.y, button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 10; i++) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: a.x + ((b.x - a.x) * i) / 10, y: a.y + ((b.y - a.y) * i) / 10, button: "left", buttons: 1 });
    await sleep(20);
  }
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: b.x, y: b.y, button: "left", buttons: 0, clickCount: 1 });
  await sleep(400);
}
async function touchDrag(fromSel, toSel) {
  const a = await center(fromSel);
  const b = await ev(`(() => { const r = (${VISIBLE})(${JSON.stringify(toSel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, visible: r.top >= 0 && r.bottom <= innerHeight }; })()`);
  if (!b.visible) throw new Error("ドロップ先が画面外です");
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.x, y: a.y }] });
  for (let i = 1; i <= 10; i++) {
    await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: a.x + ((b.x - a.x) * i) / 10, y: a.y + ((b.y - a.y) * i) / 10 }] });
    await sleep(20);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(400);
}
async function tap(selector) {
  const a = await center(selector);
  // 実際の指のタップに近づけるため、少し押してから離す(押してすぐ離すと、クリックとして扱われないことがある)
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.x, y: a.y }] });
  await sleep(80);
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(400);
}
/** 表示中のキー図で、要素に描かれている文字(HTML)を読む */
const keyText = (elementId) =>
  ev(`(() => {
    const btn = (${VISIBLE})('[data-element-id="${elementId}"]');
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    // ボタンの下に重なっている、キー図の文字の div を探す
    const divs = [...btn.parentElement.querySelectorAll("div")].filter(d => {
      const q = d.getBoundingClientRect();
      return d.children.length === 1 && q.left <= cx && cx <= q.right && q.top <= cy && cy <= q.bottom && q.width < r.width * 1.5;
    });
    return divs.map(d => d.innerText.replace(/\\s+/g, " ")).join(" / ");
  })()`);
const notice = () => ev(`document.querySelector('[data-testid="drop-notice"]')?.textContent ?? ""`);
const clickText = (tag, text) =>
  ev(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(tag)})].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!el) throw new Error("見つからない: ${text}"); el.click(); return true; })()`);

async function open(width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 1 : 0 });
  await send("Page.navigate", { url: `${BASE}/new` });
  await sleep(5000);
  await ev(`localStorage.removeItem("keycap-share:draft:new"); true`);
  await send("Page.reload");
  await sleep(6000);
  // 開発サーバーだけに出る Next.js の表示(左下の「N」)が、ドロップ先に重なることがあるので隠す(本番には出ない)
  await ev(`document.querySelectorAll("nextjs-portal").forEach(e => e.style.display = "none"); true`);
}

await send("Page.enable");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });

// ===== PC幅(マウス) =====
console.log("[PC幅 1100px・マウス]");
await open(1100, 1000, false);
await mouseDrag('[data-palette-label="Ctrl"]', '[data-element-id="L-2-0"]'); // Shift のキーへ Ctrl をドラッグ
check("一覧からキーへドラッグして置ける(マウス)", (await keyText("L-2-0")).includes("Ctrl"), `${await keyText("L-2-0")} / ${await notice()}`);
await shot("pc-dragged-ctrl.png", 1100, 1000, '[data-element-id="L-2-0"]');

await mouseDrag('[data-element-id="L-0-0"]', '[data-element-id="L-1-0"]'); // Esc ⇔ Tab
check("キー図の中でドラッグすると入れ替わる", (await keyText("L-0-0")).includes("Tab") && (await keyText("L-1-0")).includes("Esc"), await notice());

await mouseDrag('[data-element-id="L-0-1"]', '[data-element-id="R-TRACKBALL"]'); // Q → トラックボール
check("種類が違う要素どうしは入れ替えられない(お知らせが出る)", (await notice()).includes("入れ替えられません") && (await keyText("L-0-1")).includes("Q"), await notice());

await ev(`[...document.querySelectorAll('[role="tab"]')].find(t => t.textContent === "メディア").click(); true`);
await sleep(300);
await mouseDrag('[data-palette-label="音量+"]', '[data-element-id="L-DIAL"]');
const chooser = await ev(`[...document.querySelectorAll('[data-choose-action]')].map(b => b.dataset.chooseAction).join(",")`);
check("ダイヤルに置くと、どの操作に入れるかを選べる", chooser === "cw,ccw", chooser);
await shot("pc-action-chooser.png", 1100, 1000, '[role="dialog"]');
await ev(`document.querySelector('[data-choose-action="cw"]').click(); true`);
await sleep(400);
check("選んだ操作(右回し)に入る", (await notice()).includes("音量+") && (await ev(`document.body.innerHTML.includes("音量+")`)), await notice());

await clickText("button", "↶ 元に戻す"); // 音量+ を戻す
await sleep(300);
check("元に戻す: ダイヤルの音量+がなくなる", !(await ev(`(${VISIBLE})('[data-element-id="L-DIAL"]').parentElement.innerText.includes("音量+")`)));
await clickText("button", "↶ 元に戻す"); // 入れ替えを戻す
await sleep(300);
check("元に戻す: 入れ替えが戻る", (await keyText("L-0-0")).includes("Esc") && (await keyText("L-1-0")).includes("Tab"));
await clickText("button", "↷ やり直す");
await sleep(300);
check("やり直す: 入れ替えがもう一度行われる", (await keyText("L-0-0")).includes("Tab"));
await shot("pc-undo-redo.png", 1100, 1000, '[data-element-id="L-2-0"]');

// ===== スマホ幅(指) =====
console.log("\n[スマホ幅 390px・指]");
await open(390, 844, true);
await touchDrag('[data-palette-label="Ctrl"]', '[data-element-id="L-2-0"]');
check("一覧からキーへ指でドラッグして置ける", (await keyText("L-2-0")).includes("Ctrl"), `${await keyText("L-2-0")} / ${await notice()}`);
await tap('[data-palette-label="Alt"]');
const armed = await ev(`document.body.innerText.includes("「Alt」を置くキーを、キー図でタップしてください")`);
check("一覧のキーをタップすると、置く先を選ぶ状態になる", armed);
await shot("mobile-armed.png", 390, 844, '[data-element-id="L-3-0"]');
await tap('[data-element-id="L-3-0"]'); // Ctrl(左下) のキーへ
check("続けてキー図のキーをタップすると置かれる(タップ→タップ)", (await keyText("L-3-0")).includes("Alt"), await keyText("L-3-0"));
await touchDrag('[data-element-id="L-0-0"]', '[data-element-id="L-1-0"]');
check("キー図の中で指でドラッグすると入れ替わる", (await keyText("L-0-0")).includes("Tab"), await notice());
await shot("mobile-after.png", 390, 844, '[data-element-id="L-2-0"]');

// ===== キーボードだけで操作できる =====
console.log("\n[キーボード操作]");
await open(1100, 1000, false);
const pressEnter = async () => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await sleep(400);
};
await ev(`(${VISIBLE})('[data-palette-label="Esc"]').focus(); true`);
await pressEnter();
check("一覧のキーにフォーカスして Enter を押すと、置く先を選ぶ状態になる", await ev(`document.body.innerText.includes("「Esc」を置くキー")`));
await ev(`(${VISIBLE})('[data-element-id="L-0-5"]').focus(); true`); // T のキー
await pressEnter();
check("キー図のキーにフォーカスして Enter を押すと置かれる", (await keyText("L-0-5")).includes("Esc"), await keyText("L-0-5"));

// ===== 文字入力も使える =====
console.log("\n[文字入力]");
await tap('[data-element-id="L-0-2"]'); // W
const panel = await ev(`!!document.querySelector('section[aria-label="割り当ての編集"]')`);
check("キーをタップすると、今までどおり文字入力の欄が開く", panel);

console.log(`\n結果: ${results.filter((r) => r.ok).length}/${results.length} 成功`);
ws.close();
