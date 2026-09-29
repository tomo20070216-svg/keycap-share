// ドラッグ中の「離したらどこに入るか」の表示の確認(人間の要望、2026-09-29)。
// 離す前の状態で、ドロップ先の枠の色と、名前の下の説明を確かめる。
// 前提: Chrome を --remote-debugging-port=9333 で起動し、開発サーバー(http://localhost:3123)が動いていること。
// 使い方: node cdp-feedback.mjs <スクリーンショットの保存先フォルダ>
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
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
const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? expression);
  return r.result?.result?.value;
};
const VISIBLE = `(sel) => [...document.querySelectorAll(sel)].find(e => e.getClientRects().length > 0)`;
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
};
const rectOf = (sel) => ev(`(() => { const r = (${VISIBLE})(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
const state = (elementId) =>
  ev(`(() => {
    const b = (${VISIBLE})('[data-element-id="${elementId}"]');
    return { outline: b.style.outline, ghost: document.querySelector('[data-testid="drag-ghost"]')?.innerText.replace(/\\n/g, " / ") ?? null };
  })()`);
async function shot(name, w, h) {
  const { sx, sy } = await ev(`({ sx: scrollX, sy: scrollY })`);
  const r = await send("Page.captureScreenshot", { format: "png", clip: { x: sx, y: sy, width: w, height: h, scale: 1 } });
  writeFileSync(join(outDir, name), Buffer.from(r.result.data, "base64"));
  console.log("  スクリーンショット:", name);
}
async function open(w, h, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 1 : 0 });
  await send("Page.navigate", { url: "http://localhost:3123/new" });
  await sleep(5000);
  await ev(`localStorage.removeItem("keycap-share:draft:new"); true`);
  await send("Page.reload");
  await sleep(6000);
  await ev(`document.querySelectorAll("nextjs-portal").forEach(e => e.style.display = "none"); true`);
}
/** マウスでドラッグを始め、離さずに止める */
async function mouseHover(fromSel, toSel) {
  await ev(`(${VISIBLE})(${JSON.stringify(fromSel)}).scrollIntoView({ block: "center" }); true`);
  const a = await rectOf(fromSel);
  const b = await rectOf(toSel);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: a.x, y: a.y, button: "left", buttons: 1, clickCount: 1 });
  for (let i = 1; i <= 10; i++) {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: a.x + ((b.x - a.x) * i) / 10, y: a.y + ((b.y - a.y) * i) / 10, button: "left", buttons: 1 });
    await sleep(20);
  }
  await sleep(300);
  return b;
}
const release = (p) => send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", buttons: 0, clickCount: 1 });

await send("Page.enable");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });

console.log("[PC幅・マウス]");
await open(1100, 1000, false);
let p = await mouseHover('[data-palette-label="Ctrl"]', '[data-element-id="L-2-0"]');
let s = await state("L-2-0");
check("一覧のキーをキーの上に持っていくと、緑の枠と「…に置く」が出る", s.outline.includes("rgb(22, 163, 74)") && s.ghost?.includes("Shift(キー)に置く"), JSON.stringify(s));
await shot("feedback-palette-ok.png", 1100, 1000);
await release(p);
await sleep(400);
check("離すと枠と説明が消える", (await state("L-2-0")).ghost === null && !(await state("L-2-0")).outline.includes("rgb(22"));

p = await mouseHover('[data-element-id="L-0-1"]', '[data-element-id="R-TRACKBALL"]');
s = await state("R-TRACKBALL");
check("入れ替えられない相手の上では、赤の枠と「入れ替えられません」が出る", s.outline.includes("rgb(220, 38, 38)") && s.ghost?.includes("入れ替えられません"), JSON.stringify(s));
await shot("feedback-swap-ng.png", 1100, 1000);
await release(p);
await sleep(400);

p = await mouseHover('[data-element-id="L-0-1"]', '[data-element-id="L-0-2"]');
s = await state("L-0-2");
check("入れ替えられる相手の上では、緑の枠と「…と入れ替え」が出る", s.outline.includes("rgb(22, 163, 74)") && s.ghost?.includes("W(キー)と入れ替え"), JSON.stringify(s));
await release(p);
await sleep(400);

console.log("\n[スマホ幅・指]");
await open(390, 844, true);
await ev(`(${VISIBLE})('[data-palette-label="Ctrl"]').scrollIntoView({ block: "center" }); true`);
const a = await rectOf('[data-palette-label="Ctrl"]');
const b = await rectOf('[data-element-id="L-2-0"]');
await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.x, y: a.y }] });
for (let i = 1; i <= 10; i++) {
  await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: a.x + ((b.x - a.x) * i) / 10, y: a.y + ((b.y - a.y) * i) / 10 }] });
  await sleep(20);
}
await sleep(300);
s = await state("L-2-0");
check("指でドラッグ中も、緑の枠と「…に置く」が出る", s.outline.includes("rgb(22, 163, 74)") && s.ghost?.includes("に置く"), JSON.stringify(s));
await shot("feedback-mobile.png", 390, 844);
await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

console.log(`\n結果: ${results.filter(Boolean).length}/${results.length} 成功`);
ws.close();
