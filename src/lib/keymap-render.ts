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

  const maxY = Math.max(...boxes.map((b) => b.box.maxY));

  return {
    width: leftWidth + splitGap + rightWidth,
    height: maxY - minY,
    halves: {
      left: { x: 0, width: leftWidth },
      right: { x: leftWidth + splitGap, width: rightWidth },
    },
    items,
  };
}
