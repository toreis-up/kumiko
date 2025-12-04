import { PatternRenderer, BasePatternOptions } from "../types";

/**
 * 空白 (Blank) パターン生成ロジック
 * 何も描画しない
 */
export const createBlankPattern = (
  options: BasePatternOptions = {}
): PatternRenderer => {
  const { skeletonColor, leafColor, skeletonThickness, leafThickness } =
    options;

  return ({ p1, p2, p3 }) => {
    return {
      skeleton: [],
      leaves: [],
      skeletonColor,
      leafColor,
      skeletonThickness,
      leafThickness,
    };
  };
};
