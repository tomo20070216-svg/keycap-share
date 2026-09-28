import type { CSSProperties } from "react";
import {
  buildKeymapRenderModel,
  type KeymapRenderModel,
  type RenderItem,
  type RenderLabel,
} from "@/lib/keymap-render";
import { fitFontSize, fitLabel } from "@/lib/label-fit";
import type { ElementType, KeyboardPhysicalLayout, Layer } from "@/lib/schemas";

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
  cw: "↻",
  ccw: "↺",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  tap: "タップ",
  click: "クリック",
};

const LABEL_STACK: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center" };

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

function DeviceLabels({ item, width, unit, fontFamily }: { item: RenderItem; width: number; unit: number; fontFamily: string }) {
  const maxWidth = width * 0.9;
  if (item.isEmpty) {
    const name = ELEMENT_TYPE_NAMES[item.type];
    return (
      <div style={{ color: COLORS.emptyDeviceText, fontSize: fitFontSize(name, maxWidth, unit * 0.16), fontFamily, whiteSpace: "nowrap" }}>
        {name}
      </div>
    );
  }
  return (
    // Satori ではフラグメントの子が縦に並ばないことがあるため、縦並びのdivで包む
    <div style={LABEL_STACK}>
      {item.extras.map((extra) => {
        const text = `${ACTION_SYMBOLS[extra.action]} ${extra.text}`;
        return (
          <div
            key={extra.action}
            style={{
              color: COLORS.primaryText,
              fontSize: fitFontSize(text, maxWidth, unit * 0.15),
              lineHeight: 1.2,
              fontFamily,
              whiteSpace: "nowrap",
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}

export function KeymapDiagram({
  physicalLayout,
  layer,
  unit = DEFAULT_UNIT,
  splitGap,
  fontFamily = "'Noto Sans JP', sans-serif",
}: KeymapDiagramProps) {
  const model = buildKeymapRenderModel(physicalLayout, layer, { splitGap });
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
              stroke={item.isEmpty ? COLORS.emptyStroke : "none"}
              strokeWidth={item.isEmpty ? 1 : 0}
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
            // Satori は値が undefined のプロパティでもエラーになるため、回転があるときだけ付ける
            ...(item.rotation ? { transform: `rotate(${item.rotation}deg)` } : {}),
          };
          return (
            <div key={item.elementId} style={style}>
              {item.type === "key" ? (
                <KeyLabels item={item} width={b.width} unit={unit} fontFamily={fontFamily} />
              ) : (
                <DeviceLabels item={item} width={b.width} unit={unit} fontFamily={fontFamily} />
              )}
            </div>
          );
        })}
    </div>
  );
}
