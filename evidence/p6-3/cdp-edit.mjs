// 編集ページの動作確認(P6-3)。ヘッドレスChromeを DevTools Protocol で操作する。
// 開発サーバーで一覧に出さないテスト投稿を作り、編集・削除まで行う(最後に削除するのでDBに残らない)。
// 前提: Chrome を --remote-debugging-port=9333 で起動し、開発サーバー(http://localhost:3123)が動いていること。
// 使い方: node cdp-edit.mjs <スクリーンショットの保存先フォルダ>
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
async function shot(name, height = 900) {
  const { sy } = await ev(`({ sy: scrollY })`);
  const r = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: sy, width: 1100, height, scale: 1 } });
  writeFileSync(join(outDir, name), Buffer.from(r.result.data, "base64"));
  console.log("  スクリーンショット:", name);
}
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
};
async function go(url, wait = 6000) {
  await send("Page.navigate", { url });
  await sleep(wait);
  await ev(`document.querySelectorAll("nextjs-portal").forEach(e => e.style.display = "none"); true`);
}
const typeInto = (selector, value) =>
  ev(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
const clickText = (tag, text) =>
  ev(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(tag)})].find(e => e.textContent.trim() === ${JSON.stringify(text)}); if (!el) throw new Error("見つからない: ${text}"); el.click(); return true; })()`);
const text = () => ev(`document.body.innerText`);

await send("Page.enable");
await send("Emulation.setFocusEmulationEnabled", { enabled: true });
await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });

// 0. このブラウザの保存内容を消し、テスト投稿を作る(開発環境なので「テスト投稿」= 一覧に出さない)
await go(`${BASE}/new`, 5000);
await ev(`localStorage.clear(); true`);
await go(`${BASE}/new`);
await typeInto('input[placeholder^="例: 親指で変換"]', "P6-3 編集ページの動作確認(テスト投稿)");
await sleep(300);
await clickText("button", "保存して共有URLを発行する");
await sleep(8000);
const shareUrl = await ev(`document.querySelector('[data-testid="share-url"]')?.textContent`);
const editUrl = await ev(`document.querySelector('[data-testid="edit-url"]')?.textContent`);
const slug = shareUrl.split("/k/")[1];
console.log("テスト投稿:", shareUrl);

console.log("\n[編集用URLで開く]");
await go(editUrl);
check("編集用URLで開くと、今の内容が入ったエディタが出る", (await ev(`document.querySelector('input[placeholder^="例: 親指で変換"]')?.value`)) === "P6-3 編集ページの動作確認(テスト投稿)");
check("開いた後、アドレスバーから秘密キー(#key=...)が消える", (await ev(`location.hash`)) === "");
await typeInto('input[placeholder^="例: 親指で変換"]', "P6-3 編集後のタイトル(テスト投稿)");
await sleep(300);
await shot("edit-page.png");
await clickText("button", "変更を保存する");
await sleep(6000);
check("「変更を保存する」で保存できる", (await text()).includes("の変更を保存しました"));
await shot("edit-saved.png", 500);

console.log("\n[配列のページ]");
await go(`${BASE}/k/${slug}`);
check("配列のページに編集後のタイトルが出る", (await text()).includes("P6-3 編集後のタイトル(テスト投稿)"));
check("自分の配列(このブラウザに秘密キーがある)には「編集する」ボタンが出る", await ev(`!!document.querySelector('[data-testid="owner-edit-link"]')`));
await shot("owner-edit-link.png", 400);
await go(`${BASE}/k/orca-echo-factory-default`);
check("他人の配列には「編集する」ボタンが出ない", !(await ev(`!!document.querySelector('[data-testid="owner-edit-link"]')`)));

console.log("\n[違う秘密キー・秘密キーなし]");
const saved = await ev(`localStorage.getItem("keycap-share:edit-keys")`);
await ev(`localStorage.removeItem("keycap-share:edit-keys"); true`);
await go(`${BASE}/k/${slug}/edit#key=${"A".repeat(43)}`);
check("違う秘密キーで開くと「編集できません」と出て、エディタは出ない", (await text()).includes("この配列を編集できません") && !(await ev(`!!document.querySelector('input[placeholder^="例: 親指で変換"]')`)));
await shot("edit-wrong-key.png", 500);
await go(`${BASE}/k/${slug}/edit`);
check("秘密キーなしで開いても「編集できません」と出る", (await text()).includes("この配列を編集できません"));
await ev(`localStorage.setItem("keycap-share:edit-keys", ${JSON.stringify(saved)}); true`);

console.log("\n[削除(このテスト投稿を消す)]");
await go(`${BASE}/k/${slug}/edit`);
check("このブラウザに保存した秘密キーでも編集ページが開く(# なし)", (await ev(`!!document.querySelector('input[placeholder^="例: 親指で変換"]')`)));
await ev(`window.confirm = () => true; true`);
await clickText("button", "この配列を削除する");
await sleep(6000);
check("削除すると「削除しました」と出る", (await text()).includes("を削除しました"));
check("削除した配列の秘密キーはこのブラウザから消える", !(await ev(`(localStorage.getItem("keycap-share:edit-keys") ?? "").includes(${JSON.stringify(slug)})`)));
const status = await (await fetch(`${BASE}/k/${slug}`)).status;
check("削除した配列のページは404になる", status === 404, String(status));

console.log(`\n結果: ${results.filter(Boolean).length}/${results.length} 成功`);
ws.close();
