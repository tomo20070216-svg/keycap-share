import { describe, expect, it } from "vitest";
import { KEYBOARDS, findKeyboard, supportedKeyboardNames } from "@/keyboards";
import { cornix } from "@/keyboards/cornix";
import { cornixFactoryDefaultLayers } from "@/keyboards/cornix-factory-default";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import { validateSubmission } from "@/lib/layout-submission";
import { KeyboardPhysicalLayoutSchema } from "@/lib/schemas";
import { suggestTags } from "@/lib/tag-suggestions";

/** 回転を含めた四角形の角(重なりの確認用) */
function corners(e: { x: number; y: number; width: number; height: number; rotation: number }) {
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;
  const a = (e.rotation * Math.PI) / 180;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const dx = (sx * e.width) / 2;
    const dy = (sy * e.height) / 2;
    return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)] as const;
  });
}

/** 2つの凸な四角形が重なるか(分離軸で判定。触れているだけ・0.05未満のわずかな重なりは許す) */
function overlaps(a: ReturnType<typeof corners>, b: ReturnType<typeof corners>): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % 4];
      const nx = y2 - y1;
      const ny = x1 - x2;
      const len = Math.hypot(nx, ny);
      const proj = (p: ReturnType<typeof corners>) => p.map(([x, y]) => (x * nx + y * ny) / len);
      const pa = proj(a);
      const pb = proj(b);
      if (Math.max(...pa) - 0.05 <= Math.min(...pb) || Math.max(...pb) - 0.05 <= Math.min(...pa)) return false;
    }
  }
  return true;
}

describe("Cornix の物理レイアウト(フェーズ8)", () => {
  it("Zodスキーマの検証を通り、実物で確認するまでは仮の値", () => {
    expect(() => KeyboardPhysicalLayoutSchema.parse(cornix)).not.toThrow();
    expect(cornix.isProvisional).toBe(true);
  });

  it("キーは左右24個ずつ(合計48)、押し込めるダイヤルが左右に1つずつ", () => {
    const keys = cornix.elements.filter((e) => e.type === "key");
    expect(keys.filter((e) => e.side === "left")).toHaveLength(24);
    expect(keys.filter((e) => e.side === "right")).toHaveLength(24);
    const knobs = cornix.elements.filter((e) => e.type === "knob");
    expect(knobs.map((k) => `${k.id}:${k.side}`).sort()).toEqual(["L-KNOB:left", "R-KNOB:right"]);
  });

  it("要素の id は重複しない", () => {
    const ids = cornix.elements.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("要素どうしが重ならない(親指の斜めのキーも含む)", () => {
    const found: string[] = [];
    const els = cornix.elements;
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        if (overlaps(corners(els[i]), corners(els[j]))) found.push(`${els[i].id} と ${els[j].id}`);
      }
    }
    expect(found).toEqual([]);
  });

  it("左手と右手は左右対称(右手のキーは左手の同じ段・列のキーを左右反転した位置)", () => {
    const left = new Map(cornix.elements.filter((e) => e.side === "left").map((e) => [e.id.slice(2), e]));
    const right = cornix.elements.filter((e) => e.side === "right");
    // 左右の中心の軸(左手の一番左と右手の一番右の真ん中)
    const minX = Math.min(...cornix.elements.map((e) => e.x));
    const maxX = Math.max(...cornix.elements.map((e) => e.x + e.width));
    const axis = (minX + maxX) / 2;
    for (const r of right) {
      const l = left.get(r.id.slice(2))!;
      expect(l, r.id).toBeDefined();
      expect(r.x + r.width / 2, r.id).toBeCloseTo(2 * axis - (l.x + l.width / 2), 1);
      expect(r.y, r.id).toBeCloseTo(l.y, 2);
      expect(r.rotation + l.rotation, r.id).toBe(0);
    }
  });
});

describe("Cornix の工場出荷時配列(フェーズ8)", () => {
  it("投稿の検証を通る(物理レイアウトにない要素・その要素にない操作がない)", () => {
    const r = validateSubmission({ keyboardId: "cornix", title: "Cornix 工場出荷時配列", layers: cornixFactoryDefaultLayers });
    expect(r.ok, JSON.stringify(r)).toBe(true);
  });

  it("レイヤーは 0〜3(4以降は割り当てがないため含めない)", () => {
    expect(cornixFactoryDefaultLayers.map((l) => l.layerNumber)).toEqual([0, 1, 2, 3]);
  });

  it("通常レイヤー: 左上は Tab・Q〜T、左親指は レイヤー1・レイヤー3・Space、右下に矢印キー", () => {
    const base = cornixFactoryDefaultLayers[0];
    const label = (id: string, action = "press") => base.assignments.find((a) => a.elementId === id && a.action === action)?.label;
    expect(["L-0-0", "L-0-1", "L-0-2", "L-0-3", "L-0-4", "L-0-5"].map((id) => label(id))).toEqual(["Tab", "Q", "W", "E", "R", "T"]);
    expect(["L-3-3", "L-3-4", "L-3-5"].map((id) => label(id))).toEqual(["レイヤー1(押している間)", "レイヤー3(押している間)", "Space"]);
    expect(["R-2-1", "R-3-2", "R-3-1", "R-3-0"].map((id) => label(id))).toEqual(["↑", "←", "↓", "→"]);
  });

  it("ダイヤル: 左は回すと音量・押すとミュート、右は回すとスクロール・押すと中クリック", () => {
    const base = cornixFactoryDefaultLayers[0];
    const knob = (id: string) =>
      Object.fromEntries(base.assignments.filter((a) => a.elementId === id).map((a) => [a.action, a.label]));
    expect(knob("L-KNOB")).toEqual({ press: "ミュート", cw: "音量+", ccw: "音量−" });
    expect(knob("R-KNOB")).toEqual({ press: "中クリック", cw: "ホイール↓", ccw: "ホイール↑" });
  });

  it("タグのおすすめに QWERTY が出る(左手の上の段が Q W E R T)", () => {
    expect(suggestTags({ title: "", description: "", tagsText: "", layers: cornixFactoryDefaultLayers })).toContain("QWERTY");
  });

  it("キー図の描画: ダイヤルは押す操作を中に、回す操作を左右の内側(外側の文字)に出す", () => {
    const model = buildKeymapRenderModel(cornix, cornixFactoryDefaultLayers[0]);
    const lk = model.items.find((i) => i.elementId === "L-KNOB")!;
    const rk = model.items.find((i) => i.elementId === "R-KNOB")!;
    expect(lk.primary).toBe("ミュート");
    expect(lk.extras.map((e) => e.action)).toEqual(["cw", "ccw"]);
    const lLabels = model.outsideLabels.filter((l) => l.elementId === "L-KNOB");
    const rLabels = model.outsideLabels.filter((l) => l.elementId === "R-KNOB");
    expect(lLabels.every((l) => l.x >= lk.x + lk.width)).toBe(true); // 左手のダイヤルの文字は右側(内側)
    expect(rLabels.every((l) => l.x + l.width <= rk.x)).toBe(true); // 右手のダイヤルの文字は左側(内側)
    // 左右のダイヤルの文字どうしが重ならない
    const maxLeft = Math.max(...lLabels.map((l) => l.x + l.width));
    const minRight = Math.min(...rLabels.map((l) => l.x));
    expect(maxLeft).toBeLessThanOrEqual(minRight);
  });
});

describe("対応機種の一覧(フェーズ8)", () => {
  it("Orca echo(Keychron Launcher)と Cornix(Vial)がある", () => {
    expect(KEYBOARDS.map((k) => [k.layout.id, k.tool])).toEqual([
      ["orca-echo", "keychron-launcher"],
      ["cornix", "vial"],
    ]);
    expect(findKeyboard("cornix")?.layout).toBe(cornix);
    expect(findKeyboard("no-such")).toBeUndefined();
    expect(supportedKeyboardNames()).toBe("Keychron Orca echo と Cornix");
  });
});
