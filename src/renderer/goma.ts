import { PatternRenderer, GomaOptions } from "../types";
import { Geom } from "../utils";

/**
 * 胡麻 (Goma) パターン生成ロジック
 */
export const createGomaPattern = (
  options: GomaOptions = {}
): PatternRenderer => {
  const {
    skeletonColor,
    leafColor,
    showCenterLine = false,
    skeletonThickness,
    leafThickness,
  } = options;

  return ({ p1, p2, p3, center }) => {
    const leaves = [];
    if (showCenterLine) {
      // 例: 重心から上頂点への線だけ引く、など
      leaves.push(Geom.line(center, p1));
    }
    return {
      skeleton: [Geom.triangle(p1, p2, p3)],
      leaves: leaves,
      skeletonColor,
      leafColor,
      skeletonThickness,
      leafThickness,
    };
  };
};
