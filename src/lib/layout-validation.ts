import {
  ELEMENT_ACTIONS,
  type Assignment,
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

export type { Assignment };
