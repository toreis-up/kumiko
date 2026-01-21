import { PatternRenderer, GomaOptions } from "../types";
import { Geom } from "../utils";
import { buildPatternResult } from "./helper";

/**
 * 胡麻 (Goma) パターン生成ロジック
 * skeleton の三角形の内側に、平行な線を3本描画
 */
export const createGomaPattern = (
  options: GomaOptions = {}
): PatternRenderer => {
  const {
    inset = 0.3,
  } = options;

  return ({ p1, p2, p3, center, clipBoundary }) => {
    const skeleton: string[] = [];
    const leaves: string[] = [];

    // 外枠（三角形）を描画
    skeleton.push(Geom.triangle(p1, p2, p3));

    // 内側の平行な三角形を計算（中心に向かって縮小）
    const ip1 = Geom.lerp(p1, center, inset);
    const ip2 = Geom.lerp(p2, center, inset);
    const ip3 = Geom.lerp(p3, center, inset);

    // 内側三角形の各辺を延長して skeleton との交点を求める
    // 辺 ip1-ip2 を延長 → p2-p3 と p3-p1 と交わる
    const line1_int1 = Geom.findLineSegmentIntersection(ip1, ip2, p2, p3);
    const line1_int2 = Geom.findLineSegmentIntersection(ip1, ip2, p3, p1);

    // 辺 ip2-ip3 を延長 → p3-p1 と p1-p2 と交わる
    const line2_int1 = Geom.findLineSegmentIntersection(ip2, ip3, p3, p1);
    const line2_int2 = Geom.findLineSegmentIntersection(ip2, ip3, p1, p2);

    // 辺 ip3-ip1 を延長 → p1-p2 と p2-p3 と交わる
    const line3_int1 = Geom.findLineSegmentIntersection(ip3, ip1, p1, p2);
    const line3_int2 = Geom.findLineSegmentIntersection(ip3, ip1, p2, p3);
    // 交点が見つかった場合のみ leaf を描画（clipBoundary があればクリップ）
    const addLeaf = (
      pt1: { x: number; y: number } | null,
      pt2: { x: number; y: number } | null
    ) => {
      if (!pt1 || !pt2) return;

      if (clipBoundary && clipBoundary.type === "vertical") {
        const clipped = Geom.clipLine(pt1, pt2, clipBoundary.x, clipBoundary.remainSide);
        if (clipped) {
          leaves.push(Geom.line(clipped[0], clipped[1]));
        }
      } else {
        leaves.push(Geom.line(pt1, pt2));
      }
    };

    addLeaf(line1_int1, line1_int2);
    addLeaf(line2_int1, line2_int2);
    addLeaf(line3_int1, line3_int2);

    return buildPatternResult(
      { skeleton, leaves, clipPath: Geom.triangle(p1, p2, p3) },
      options
    )
  };
};
