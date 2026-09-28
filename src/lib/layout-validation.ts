import {
  ELEMENT_ACTIONS,
  type Assignment,
  type Combo,
  type KeyboardPhysicalLayout,
  type Layer,
} from "@/lib/schemas";

export type LayoutValidationError = {
  layerNumber: number;
  elementId: string;
  reason: string;
};

/**
 * レイヤーの割り当て(assignments)が、対象の物理レイアウトと矛盾していないかを検証する。
 * - 存在しない要素IDを参照していないか
 * - その要素タイプが対応していない操作(action)を指定していないか
 * - 同じ要素・同じ操作が同一レイヤー内で重複していないか
 */
export function validateLayersAgainstPhysicalLayout(
  layers: Layer[],
  physicalLayout: KeyboardPhysicalLayout
): LayoutValidationError[] {
  const elementsById = new Map(
    physicalLayout.elements.map((el) => [el.id, el])
  );
  const errors: LayoutValidationError[] = [];

  for (const layer of layers) {
    const seen = new Set<string>();
    for (const assignment of layer.assignments) {
      const element = elementsById.get(assignment.elementId);
      if (!element) {
        errors.push({
          layerNumber: layer.layerNumber,
          elementId: assignment.elementId,
          reason: `物理レイアウトに存在しない要素id: ${assignment.elementId}`,
        });
        continue;
      }
      const allowedActions = ELEMENT_ACTIONS[element.type];
      if (!allowedActions.includes(assignment.action)) {
        errors.push({
          layerNumber: layer.layerNumber,
          elementId: assignment.elementId,
          reason: `要素タイプ "${element.type}" は操作 "${assignment.action}" に対応していない(対応: ${allowedActions.join(", ")})`,
        });
      }
      const key = `${assignment.elementId}:${assignment.action}`;
      if (seen.has(key)) {
        errors.push({
          layerNumber: layer.layerNumber,
          elementId: assignment.elementId,
          reason: `同じレイヤー内で "${key}" が重複している`,
        });
      }
      seen.add(key);
    }
  }

  return errors;
}

export function assertValidLayers(
  layers: Layer[],
  physicalLayout: KeyboardPhysicalLayout
): void {
  const errors = validateLayersAgainstPhysicalLayout(layers, physicalLayout);
  if (errors.length > 0) {
    const message = errors
      .map((e) => `[layer ${e.layerNumber}] ${e.elementId}: ${e.reason}`)
      .join("\n");
    throw new Error(`レイヤーの検証エラー:\n${message}`);
  }
}

export type ComboValidationError = { comboIndex: number; reason: string };

/**
 * コンボが物理レイアウト・レイヤーと矛盾していないかを検証する。
 * - 対象は物理レイアウトに存在する「キー」だけ(ダイヤル等は同時押しの対象にできない)
 * - 対象レイヤーを指定する場合、その番号のレイヤーが配列に存在すること
 */
export function validateCombos(
  combos: Combo[],
  layers: Layer[],
  physicalLayout: KeyboardPhysicalLayout
): ComboValidationError[] {
  const elementsById = new Map(physicalLayout.elements.map((el) => [el.id, el]));
  const layerNumbers = new Set(layers.map((l) => l.layerNumber));
  const errors: ComboValidationError[] = [];
  combos.forEach((combo, comboIndex) => {
    for (const id of combo.elementIds) {
      const element = elementsById.get(id);
      if (!element) {
        errors.push({ comboIndex, reason: `物理レイアウトに存在しない要素id: ${id}` });
      } else if (element.type !== "key") {
        errors.push({ comboIndex, reason: `キー以外(${element.type})はコンボの対象にできない: ${id}` });
      }
    }
    for (const n of combo.layerNumbers) {
      if (!layerNumbers.has(n)) {
        errors.push({ comboIndex, reason: `存在しないレイヤー番号: ${n}` });
      }
    }
  });
  return errors;
}

export function assertValidCombos(
  combos: Combo[],
  layers: Layer[],
  physicalLayout: KeyboardPhysicalLayout
): void {
  const errors = validateCombos(combos, layers, physicalLayout);
  if (errors.length > 0) {
    const message = errors.map((e) => `[combo ${e.comboIndex + 1}] ${e.reason}`).join("\n");
    throw new Error(`コンボの検証エラー:\n${message}`);
  }
}

export type { Assignment };
