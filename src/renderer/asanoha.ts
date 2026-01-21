import { PatternRenderer, AsanohaOptions } from "../types";
import { Geom } from "../utils";
import { buildPatternResult } from "./helper";

/**
 * 麻の葉 (Asanoha) パターン生成ロジック
 */
export const createAsanohaPattern = (
  options: AsanohaOptions = {}
): PatternRenderer => {
  return ({ p1, p2, p3, center }) => buildPatternResult(
    {skeleton: [Geom.triangle(p1, p2, p3)],
    leaves: [
      Geom.line(center, p1),
      Geom.line(center, p2),
      Geom.line(center, p3),
    ],
    clipPath: Geom.triangle(p1, p2, p3),}
    ,
    options
  );
};
