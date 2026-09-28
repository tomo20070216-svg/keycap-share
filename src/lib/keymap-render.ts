import {
  ELEMENT_ACTIONS,
  type Action,
  type ElementType,
  type KeyboardPhysicalLayout,
  type Layer,
  type Side,
} from "@/lib/schemas";

/**
 * キー図の「描画用データ」を作る純粋関数。
 * 画面表示(React+SVG)とOGP画像(ImageResponse)の両方がこの結果だけを見て描く。
 * 座標の計算をここに集めることで、SVGの図形とHTMLの文字(P2-1で採用した方式B)が
 * ずれないようにする。
 *
 * 単位は物理レイアウトと同じ「キー単位」(1 = キー1つ分)。ピクセルへの変換は描画側で行う。
 */

export type RenderLabel = { action: Action; text: string };

export type RenderItem = {
  elementId: string;
  type: ElementType;
  side: Side;
  /** 図全体の左上を(0,0)とした位置・大きさ(キー単位)。回転前の四角形 */
  x: number;
  y: number;
  width: number;
  height: number;
  /** 度数。四角形の中心を軸に回転する */
  rotation: number;
  /** キーのタップ(press)。大きく表示する。割り当てがなければ null */
  primary: string | null;
  /** キーの長押し(hold)。下に小さく表示する。割り当てがなければ null */
  secondary: string | null;
  /** キー以外(ダイヤル・トラックボール・スクロールパッド)の操作。ELEMENT_ACTIONS の順 */
  extras: RenderLabel[];
  /** このレイヤーで割り当てが1つもない(空欄+薄い灰色で表示する) */
  isEmpty: boolean;
  /** 工場出荷時の印字(参考情報) */
  legend?: string;
};

export type KeymapRenderModel = {
  /** 図全体の大きさ(キー単位) */
  width: number;
  height: number;
  /** 左右それぞれの範囲(キー単位)。左右の隙間の確認や、見出しの配置に使う */
  halves: Record<Side, { x: number; width: number }>;
  items: RenderItem[];
  /** 要素の外側に置く文字(ダイヤル・トラックボールの操作) */
  outsideLabels: OutsideLabel[];
};

/**
 * 要素の外側に置く文字の枠(キー単位)。
 * - ダイヤル: 右外に「右回し」(cw)と「左回し」(ccw)を縦に並べる
 * - トラックボール: 上下左右の操作を、円の上下左右の外側に置く
 * スクロールパッドは縦長で中に余裕があるため、中に上から ↑・タップ・↓ の順で置く(描画側)。
 */
export type OutsideLabel = {
  elementId: string;
  action: Action;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  align: "left" | "center" | "right";
};

export type KeymapRenderOptions = {
  /** 左手と右手の間の隙間(キー単位) */
  splitGap?: number;
};

const DEFAULT_SPLIT_GAP = 1;

/** 回転を考慮した、要素の外接矩形 */
function boundingBox(el: { x: number; y: number; width: number; height: number; rotation: number }) {
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = el.width * cos + el.height * sin;
  const h = el.width * sin + el.height * cos;
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  return { minX: cx - w / 2, maxX: cx + w / 2, minY: cy - h / 2, maxY: cy + h / 2 };
}

export function buildKeymapRenderModel(
  physicalLayout: KeyboardPhysicalLayout,
  layer: Layer,
  options: KeymapRenderOptions = {}
): KeymapRenderModel {
  const splitGap = options.splitGap ?? DEFAULT_SPLIT_GAP;

  // 要素ID+操作 → 表示名(物理レイアウトにない要素への割り当ては無視する)
  const labels = new Map<string, string>();
  for (const a of layer.assignments) {
    labels.set(`${a.elementId}:${a.action}`, a.label);
  }

  const boxes = physicalLayout.elements.map((el) => ({ el, box: boundingBox(el) }));
  const minY = Math.min(...boxes.map((b) => b.box.minY));

  // 左右それぞれの範囲を求め、左手を x=0 から、右手を「左手の右端 + 隙間」から並べる
  const sideRange = (side: Side) => {
    const sideBoxes = boxes.filter((b) => b.el.side === side).map((b) => b.box);
    if (sideBoxes.length === 0) return { minX: 0, maxX: 0 };
    return {
      minX: Math.min(...sideBoxes.map((b) => b.minX)),
      maxX: Math.max(...sideBoxes.map((b) => b.maxX)),
    };
  };
  const left = sideRange("left");
  const right = sideRange("right");
  const leftWidth = left.maxX - left.minX;
  const rightWidth = right.maxX - right.minX;
  const offsetX: Record<Side, number> = {
    left: -left.minX,
    right: leftWidth + splitGap - right.minX,
  };

  const items: RenderItem[] = physicalLayout.elements.map((el) => {
    const get = (action: Action) => labels.get(`${el.id}:${action}`) ?? null;
    const isKey = el.type === "key";
    const primary = isKey ? get("press") : null;
    const secondary = isKey ? get("hold") : null;
    const extras: RenderLabel[] = isKey
      ? []
      : ELEMENT_ACTIONS[el.type].flatMap((action) => {
          const text = get(action);
          return text ? [{ action, text }] : [];
        });

    return {
      elementId: el.id,
      type: el.type,
      side: el.side,
      x: el.x + offsetX[el.side],
      y: el.y - minY,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      primary,
      secondary,
      extras,
      isEmpty: primary === null && secondary === null && extras.length === 0,
      legend: el.legend,
    };
  });

  const outsideLabels = items.flatMap(buildOutsideLabels);

  // 外側の文字が図の範囲からはみ出す場合は、図を広げる(左上がはみ出す場合は全体をずらす)
  const itemBoxes = items.map(boundingBox);
  const allMinX = Math.min(0, ...outsideLabels.map((l) => l.x));
  const allMinY = Math.min(0, ...outsideLabels.map((l) => l.y));
  const allMaxX = Math.max(...itemBoxes.map((b) => b.maxX), ...outsideLabels.map((l) => l.x + l.width));
  const allMaxY = Math.max(...itemBoxes.map((b) => b.maxY), ...outsideLabels.map((l) => l.y + l.height));
  const shift = <T extends { x: number; y: number }>(v: T): T => ({ ...v, x: v.x - allMinX, y: v.y - allMinY });

  return {
    width: allMaxX - allMinX,
    height: allMaxY - allMinY,
    halves: {
      left: { x: -allMinX, width: leftWidth },
      right: { x: leftWidth + splitGap - allMinX, width: rightWidth },
    },
    items: items.map(shift),
    outsideLabels: outsideLabels.map(shift),
  };
}

/**
 * 文字の枠の大きさは、Orca echo の左右の間(ダイヤルとトラックボールの間は約1.9キー分)に
 * 両方の文字が並んでも重ならないように決めている。重ならないことはテストで確認する。
 */
function buildOutsideLabels(item: RenderItem): OutsideLabel[] {
  const b = boundingBox(item);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const label = (action: Action, rect: Omit<OutsideLabel, "elementId" | "action" | "text">): OutsideLabel[] => {
    const found = item.extras.find((e) => e.action === action);
    return found ? [{ elementId: item.elementId, action, text: found.text, ...rect }] : [];
  };

  if (item.type === "dial") {
    return [
      ...label("cw", { x: b.maxX + 0.06, y: cy - 0.48, width: 0.85, height: 0.46, align: "left" }),
      ...label("ccw", { x: b.maxX + 0.06, y: cy + 0.02, width: 0.85, height: 0.46, align: "left" }),
    ];
  }
  if (item.type === "trackball") {
    return [
      ...label("up", { x: cx - 0.6, y: b.minY - 0.3, width: 1.2, height: 0.26, align: "center" }),
      ...label("down", { x: cx - 0.6, y: b.maxY + 0.04, width: 1.2, height: 0.3, align: "center" }),
      ...label("left", { x: b.minX - 0.86, y: cy - 0.2, width: 0.8, height: 0.4, align: "right" }),
      ...label("right", { x: b.maxX + 0.04, y: cy - 0.2, width: 0.5, height: 0.4, align: "left" }),
    ];
  }
  return [];
}
