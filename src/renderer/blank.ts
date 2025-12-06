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

  return ({  }) => {
    return {
      skeleton: [],
      leaves: [],
      skeletonColor,
      leafColor,
      skeletonThickness,
      leafThickness,
      clipPath: undefined,
    };
  };
};
