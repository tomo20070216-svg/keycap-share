import { describe, expect, it } from "vitest";
import { orcaEcho } from "@/keyboards/orca-echo";
import { orcaEchoFactoryDefaultLayers } from "@/keyboards/orca-echo-factory-default";
import { LayerSchema } from "@/lib/schemas";
import { validateLayersAgainstPhysicalLayout } from "@/lib/layout-validation";

describe("orcaEchoFactoryDefaultLayers 工場出荷時配列", () => {
  it("各レイヤーがZodスキーマの検証を通る", () => {
    for (const layer of orcaEchoFactoryDefaultLayers) {
      expect(() => LayerSchema.parse(layer)).not.toThrow();
    }
  });

  it("3レイヤー(通常/fn1/fn2)ある", () => {
    expect(orcaEchoFactoryDefaultLayers).toHaveLength(3);
    expect(orcaEchoFactoryDefaultLayers.map((l) => l.layerNumber)).toEqual([
      0, 1, 2,
    ]);
  });

  it("orcaEchoの物理レイアウトと矛盾がない(存在しない要素id・非対応actionがない)", () => {
    const errors = validateLayersAgainstPhysicalLayout(
      orcaEchoFactoryDefaultLayers,
      orcaEcho
    );
    expect(errors).toEqual([]);
  });

  it("fn1レイヤーのテンキーが0〜9まで揃っている", () => {
    const fn1 = orcaEchoFactoryDefaultLayers.find((l) => l.layerNumber === 1)!;
    const numpadLabels = fn1.assignments
      .map((a) => a.label)
      .filter((l) => /^[0-9]$/.test(l))
      .sort();
    expect(numpadLabels).toEqual([
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    ]);
  });
});
