import type { CSSProperties } from "react";
import {
  buildKeymapRenderModel,
  type KeymapRenderModel,
  type RenderItem,
  type RenderLabel,
} from "@/lib/keymap-render";
import { fitFontSize, fitLabel } from "@/lib/label-fit";
import type { Combo, ElementType, KeyboardPhysicalLayout, Layer } from "@/lib/schemas";

/**
 * キー図の描画部品(画面表示とOGP画像で共用。plan.md 方針3)。
 *
 * OGP画像の仕組み(ImageResponse/Satori)でも描けるよう、次の制約を守る:
 * - 図形はSVG、文字はHTML(div)を絶対配置で重ねる(SVGの<text>は使えない。P2-1)
 * - スタイルはインラインのみ(Tailwindは使わない)
 * - 子要素を複数持つdivには display: flex を付ける
 * - 状態(useStateなど)を持たない
 *
 * 大きさは unit(キー1つ分のピクセル数)で決まる固定サイズ。画面幅に合わせた拡大・縮小は
 * ResponsiveKeymap で包んで行う。
 */

export type KeymapDiagramProps = {
  physicalLayout: KeyboardPhysicalLayout;
  layer: Layer;
  /** キー1つ分のピクセル数 */
  unit?: number;
  /** 左右の隙間(キー単位) */
  splitGap?: number;
  /** 配列のコンボ。このレイヤーで有効なものの対象キーに番号(①②…)を付ける */
  combos?: Combo[];
  fontFamily?: string;
};

const DEFAULT_UNIT = 56;
const COLORS = {
  background: "#f4f4f5",
  keyFill: "#27272a",
  deviceFill: "#3f3f46",
  emptyFill: "#e4e4e7",
  emptyStroke: "#d4d4d8",
  primaryText: "#ffffff",
  secondaryText: "#a1a1aa",
  emptyDeviceText: "#71717a",
  outsideText: "#3f3f46",
  comboBadge: "#2563eb",
  comboBadgeText: "#ffffff",
};

const ELEMENT_TYPE_NAMES: Record<ElementType, string> = {
  key: "キー",
  dial: "ダイヤル",
  scrollpad: "スクロール",
  trackball: "ボール",
};

const ACTION_SYMBOLS: Record<RenderLabel["action"], string> = {
  press: "",
  hold: "長押し",
  // OGP画像用のフォント(Noto Sans JP)には回転の矢印(↻↺)が無いため、文字で表す
  cw: "右回し",
  ccw: "左回し",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  tap: "タップ",
};

const LABEL_STACK: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center" };

const comboBadgeSize = (unit: number) => unit * 0.27;

/** 図全体の余白(キー単位) */
const PADDING = 0.3;
/** キー同士の隙間を作るため、四角形を内側に縮める量(キー単位) */
const INSET = 0.05;

export function getKeymapDiagramSize(model: KeymapRenderModel, unit = DEFAULT_UNIT) {
  return {
    width: Math.ceil((model.width + PADDING * 2) * unit),
    height: Math.ceil((model.height + PADDING * 2) * unit),
  };
}

function box(item: RenderItem, unit: number) {
  return {
    left: (item.x + PADDING + INSET) * unit,
    top: (item.y + PADDING + INSET) * unit,
    width: (item.width - INSET * 2) * unit,
    height: (item.height - INSET * 2) * unit,
  };
}

function cornerRadius(item: RenderItem, w: number, h: number, unit: number) {
  switch (item.type) {
    case "trackball":
    case "scrollpad":
      return Math.min(w, h) / 2;
    case "dial":
      return unit * 0.25;
    default:
      return unit * 0.12;
  }
}

function fill(item: RenderItem) {
  if (item.isEmpty) return COLORS.emptyFill;
  return item.type === "key" ? COLORS.keyFill : COLORS.deviceFill;
}

function KeyLabels({ item, width, unit, fontFamily }: { item: RenderItem; width: number; unit: number; fontFamily: string }) {
  const maxWidth = width * 0.86;
  const primary = item.primary ? fitLabel(item.primary, maxWidth, unit * 0.3) : null;
  const secondarySize = item.secondary ? fitFontSize(item.secondary, maxWidth, unit * 0.19) : 0;
  return (
    // Satori ではフラグメントの子が縦に並ばないことがあるため、縦並びのdivで包む
    <div style={LABEL_STACK}>
      {primary &&
        // 行の分け方は fitLabel で決めてあるので、各行は折り返さない
        primary.lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: COLORS.primaryText,
              fontSize: primary.fontSize,
              lineHeight: 1.1,
              fontFamily,
              whiteSpace: "nowrap",
            }}
          >
            {line}
          </div>
        ))}
      {item.secondary && (
        <div
          style={{
            color: COLORS.secondaryText,
            fontSize: secondarySize,
            lineHeight: 1.1,
            marginTop: item.primary ? unit * 0.06 : 0,
            fontFamily,
            whiteSpace: "nowrap",
          }}
        >
          {item.secondary}
        </div>
      )}
    </div>
  );
}

function DeviceLabels({ item, width, height, unit, fontFamily }: { item: RenderItem; width: number; height: number; unit: number; fontFamily: string }) {
  const maxWidth = width * 0.9;
  if (item.isEmpty) {
    const name = ELEMENT_TYPE_NAMES[item.type];
    return (
      <div style={{ color: COLORS.emptyDeviceText, fontSize: fitFontSize(name, maxWidth, unit * 0.16), fontFamily, whiteSpace: "nowrap" }}>
        {name}
      </div>
    );
  }
  // ダイヤル・トラックボールの文字は要素の外側に置く(OutsideLabels)
  if (item.type !== "scrollpad") return null;

  // スクロールパッドは縦長なので、中に上から ↑・タップ・↓ の順で置く(割り当てのない位置は空ける)
  const slot = (action: RenderLabel["action"]) => {
    const extra = item.extras.find((e) => e.action === action);
    const text = extra ? `${ACTION_SYMBOLS[action]} ${extra.text}` : "";
    return (
      <div
        key={action}
        style={{
          display: "flex",
          height: unit * 0.3,
          alignItems: "center",
          color: COLORS.primaryText,
          fontSize: text ? fitFontSize(text, maxWidth, unit * 0.16) : 1,
          fontFamily,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    );
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        height: height * 0.8,
      }}
    >
      {slot("up")}
      {slot("tap")}
      {slot("down")}
    </div>
  );
}

function OutsideLabels({ model, unit, fontFamily }: { model: KeymapRenderModel; unit: number; fontFamily: string }) {
  return (
    <>
      {model.outsideLabels.map((label) => {
        const width = label.width * unit;
        const height = label.height * unit;
        const isDial = label.action === "cw" || label.action === "ccw";
        // ダイヤルは「右回し」などの説明が長いので、説明を小さく上に、割り当てを下に置く
        const text = isDial ? label.text : `${ACTION_SYMBOLS[label.action]} ${label.text}`;
        const fontSize = fitFontSize(text, width, Math.min(height * (isDial ? 0.5 : 0.8), unit * 0.2));
        return (
          <div
            key={`${label.elementId}:${label.action}`}
            style={{
              position: "absolute",
              left: (label.x + PADDING) * unit,
              top: (label.y + PADDING) * unit,
              width,
              height,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: label.align === "left" ? "flex-start" : label.align === "right" ? "flex-end" : "center",
              color: COLORS.outsideText,
              fontWeight: 700,
              fontFamily,
              whiteSpace: "nowrap",
            }}
          >
            {isDial && (
              <div style={{ fontSize: fontSize * 0.7, color: COLORS.emptyDeviceText, lineHeight: 1.1 }}>
                {ACTION_SYMBOLS[label.action]}
              </div>
            )}
            <div style={{ fontSize, lineHeight: 1.1 }}>{text}</div>
          </div>
        );
      })}
    </>
  );
}

/**
 * コンボの番号の丸。フォントの丸数字(①など)はOGP画像用フォントで欠けるおそれがあるため、
 * 丸は図形(borderRadius)で描き、中に数字を置く。キーの内側の右上に置き、キーは青い枠線で囲む
 * (キーの外にはみ出すと、上の段のキーの番号と紛らわしいため)。番号のあるキーは文字を少し下げる。
 */
export function ComboNumberBadge({ number, size, fontFamily }: { number: number; size: number; fontFamily: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.comboBadge,
        border: `${Math.max(1, size * 0.08)}px solid #ffffff`,
        color: COLORS.comboBadgeText,
        fontSize: size * 0.62,
        fontWeight: 700,
        lineHeight: 1,
        fontFamily,
      }}
    >
      {String(number)}
    </div>
  );
}

function ComboBadges({ model, unit, fontFamily }: { model: KeymapRenderModel; unit: number; fontFamily: string }) {
  const size = comboBadgeSize(unit);
  return (
    <>
      {model.items
        .filter((item) => item.comboNumbers.length > 0)
        .map((item) => {
          const b = box(item, unit);
          const count = item.comboNumbers.length;
          return (
            <div
              key={item.elementId}
              style={{
                position: "absolute",
                left: b.left + b.width - count * size * 0.9 - size * 0.12,
                top: b.top + size * 0.15,
                display: "flex",
                // 傾いたキーでは、番号もキーと一緒に傾ける(回転の中心をキーの中心に合わせる)
                ...(item.rotation
                  ? {
                      transform: `rotate(${item.rotation}deg)`,
                      transformOrigin: `${b.left + b.width / 2 - (b.left + b.width - count * size * 0.9 - size * 0.12)}px ${b.top + b.height / 2 - (b.top + size * 0.15)}px`,
                    }
                  : {}),
              }}
            >
              {item.comboNumbers.map((n) => (
                <div key={n} style={{ display: "flex", marginLeft: -size * 0.1 }}>
                  <ComboNumberBadge number={n} size={size} fontFamily={fontFamily} />
                </div>
              ))}
            </div>
          );
        })}
    </>
  );
}

export function KeymapDiagram({
  physicalLayout,
  layer,
  unit = DEFAULT_UNIT,
  splitGap,
  combos,
  fontFamily = "'Noto Sans JP', sans-serif",
}: KeymapDiagramProps) {
  const model = buildKeymapRenderModel(physicalLayout, layer, { splitGap, combos });
  const size = getKeymapDiagramSize(model, unit);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: size.width,
        height: size.height,
        backgroundColor: COLORS.background,
        borderRadius: unit * 0.2,
      }}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {model.items.map((item) => {
          const b = box(item, unit);
          const cx = b.left + b.width / 2;
          const cy = b.top + b.height / 2;
          return (
            <rect
              key={item.elementId}
              x={b.left}
              y={b.top}
              width={b.width}
              height={b.height}
              rx={cornerRadius(item, b.width, b.height, unit)}
              fill={fill(item)}
              stroke={item.comboNumbers.length > 0 ? COLORS.comboBadge : item.isEmpty ? COLORS.emptyStroke : "none"}
              strokeWidth={item.comboNumbers.length > 0 ? Math.max(2, unit * 0.04) : item.isEmpty ? 1 : 0}
              transform={item.rotation ? `rotate(${item.rotation} ${cx} ${cy})` : undefined}
            />
          );
        })}
      </svg>
      {model.items
        .filter((item) => !(item.type === "key" && item.isEmpty))
        .map((item) => {
          const b = box(item, unit);
          const style: CSSProperties = {
            position: "absolute",
            left: b.left,
            top: b.top,
            width: b.width,
            height: b.height,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontWeight: 700,
            // コンボの番号(右上)と文字が重ならないよう、番号のあるキーは文字を少し下げる
            ...(item.comboNumbers.length > 0 ? { paddingTop: comboBadgeSize(unit) * 0.7 } : {}),
            // Satori は値が undefined のプロパティでもエラーになるため、回転があるときだけ付ける
            ...(item.rotation ? { transform: `rotate(${item.rotation}deg)` } : {}),
          };
          return (
            <div key={item.elementId} style={style}>
              {item.type === "key" ? (
                <KeyLabels item={item} width={b.width} unit={unit} fontFamily={fontFamily} />
              ) : (
                <DeviceLabels item={item} width={b.width} height={b.height} unit={unit} fontFamily={fontFamily} />
              )}
            </div>
          );
        })}
      <OutsideLabels model={model} unit={unit} fontFamily={fontFamily} />
      <ComboBadges model={model} unit={unit} fontFamily={fontFamily} />
    </div>
  );
}
