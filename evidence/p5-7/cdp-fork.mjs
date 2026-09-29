// 「コピーして編集」の動作確認(P5-7)。ヘッドレスChromeを DevTools Protocol で操作する。
// 前提: Chrome を --remote-debugging-port=9333 で起動し、開発サーバー(http://localhost:3123)が動いていること。
// 使い方: node cdp-fork.mjs <スクリーンショットの保存先フォルダ>
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
const BASE = "http://localhost:3123";
const SOURCE = "orca-echo-combo-sample";
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
async function shot(name, height = 1000) {
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1100, height, scale: 1 } });
  writeFileSync(join(outDir, name), Buffer.from(r.result.data, "base64"));
  console.log("  スクリーンショット:", name);
}
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
}
const typeInto = (selector, value) =>
  ev(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
const clickText = (tag, text) =>
  ev(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(tag)})].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!el) throw new Error("見つからない: ${text}"); el.click(); return true; })()`);

await send("Page.enable");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 1400, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `${BASE}/k/${SOURCE}` });
await sleep(5000);
await ev(`localStorage.removeItem("keycap-share:draft:fork:${SOURCE}"); true`);

console.log("[P5-7] コピーして編集");
await clickText("a", "この配列をコピーして編集");
await sleep(6000);
const url = await ev(`location.pathname + location.search`);
check("配列ページのボタンでエディタが開く", url === `/new?from=${SOURCE}`, url);
const editor = await ev(`({
  heading: document.querySelector("h1")?.textContent,
  notice: document.body.innerText.includes("をコピーして編集しています"),
  title: document.querySelector('input[placeholder^="例: 親指で変換"]').value,
  author: document.querySelector('input[placeholder="ニックネームなど"]').value,
  description: document.querySelector("textarea[maxlength='2000']").value,
  tags: document.querySelector('input[placeholder^="例: 日本語入力"]').value,
  tabs: [...document.querySelectorAll('[role="tab"]')].map(t => t.textContent),
  combos: document.body.innerText.includes("J + K") && document.body.innerText.includes("K + L") && document.body.innerText.includes("J + L"),
  macro: [...document.querySelectorAll('section[aria-labelledby="macro-heading"] input')].map(i => i.value),
  m1: document.body.innerHTML.includes(">署名<"),
})`);
console.log("  エディタの中身:", JSON.stringify(editor));
check("元の配列の内容が入っている(レイヤー3つ・コンボ3つ・マクロ・M1の署名・タグ)",
  editor.tabs.length === 3 && editor.combos && editor.macro[0] === "署名" && editor.m1 && editor.tags === "サンプル");
check("投稿者名と「なぜこの配置にしたか」は複製されない", editor.author === "" && editor.description === "");
check("コピー元が分かる表示がある", editor.notice);
await shot("p5-7-editor.png", 1300);

await typeInto('input[placeholder^="例: 親指で変換"]', "P5-7 コピーして編集の動作確認(テスト投稿)");
await sleep(500);
await clickText("button", "保存して共有URLを発行する");
await sleep(8000);
const shareUrl = await ev(`document.querySelector('[data-testid="share-url"]')?.textContent ?? null`);
check("保存すると新しい共有URLが発行される", !!shareUrl && !shareUrl.endsWith(`/k/${SOURCE}`), shareUrl);

await send("Page.navigate", { url: shareUrl });
await sleep(6000);
const page = await ev(`({ link: document.querySelector('[data-testid="forked-from"]')?.getAttribute("href"), text: document.querySelector('[data-testid="forked-from"]')?.textContent, combos: document.body.innerText.includes("J + K") })`);
check("保存した配列のページに、元にした配列へのリンクがある", page.link === `/k/${SOURCE}`, JSON.stringify(page));
check("保存した配列にもコンボが引き継がれている", page.combos);
await shot("p5-7-forked-page.png", 700);
console.log("\n発行された共有URL:", shareUrl);
console.log(`結果: ${results.filter((r) => r.ok).length}/${results.length} 成功`);
ws.close();
