import { PatternRenderer, AsanohaOptions } from "../types";
import { Geom } from "../utils";

/**
 * 麻の葉 (Asanoha) パターン生成ロジック
 */
export const createAsanohaPattern = (
  options: AsanohaOptions = {}
): PatternRenderer => {
  const { skeletonColor, leafColor, skeletonThickness, leafThickness } =
    options;

  return ({ p1, p2, p3, center }) => ({
    skeleton: [Geom.triangle(p1, p2, p3)],
    leaves: [
      Geom.line(center, p1),
      Geom.line(center, p2),
      Geom.line(center, p3),
    ],
    skeletonColor,
    leafColor,
    skeletonThickness,
    leafThickness,
  });
};
