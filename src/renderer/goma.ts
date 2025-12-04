import { PatternRenderer, GomaOptions } from "../types";
import { Geom } from "../utils";

/**
 * 胡麻 (Goma) パターン生成ロジック
 * skeleton の三角形の内側に、平行な線を3本描画
 */
export const createGomaPattern = (
  options: GomaOptions = {}
): PatternRenderer => {
  const {
    skeletonColor,
    leafColor,
    inset = 0.3,
    skeletonThickness,
    leafThickness,
  } = options;

  return ({ p1, p2, p3, center }) => {
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
    const line1_int1 = findLineSegmentIntersection(ip1, ip2, p2, p3);
    const line1_int2 = findLineSegmentIntersection(ip1, ip2, p3, p1);

    // 辺 ip2-ip3 を延長 → p3-p1 と p1-p2 と交わる
    const line2_int1 = findLineSegmentIntersection(ip2, ip3, p3, p1);
    const line2_int2 = findLineSegmentIntersection(ip2, ip3, p1, p2);

    // 辺 ip3-ip1 を延長 → p1-p2 と p2-p3 と交わる
    const line3_int1 = findLineSegmentIntersection(ip3, ip1, p1, p2);
    const line3_int2 = findLineSegmentIntersection(ip3, ip1, p2, p3);

    // 交点が見つかった場合のみ leaf を描画
    if (line1_int1 && line1_int2)
      leaves.push(Geom.line(line1_int1, line1_int2));
    if (line2_int1 && line2_int2)
      leaves.push(Geom.line(line2_int1, line2_int2));
    if (line3_int1 && line3_int2)
      leaves.push(Geom.line(line3_int1, line3_int2));

    return {
      skeleton,
      leaves,
      skeletonColor,
      leafColor,
      skeletonThickness,
      leafThickness,
    };
  };
};

/**
 * 内側の点から skeleton の対辺への垂直線との交点を計算
 * @param innerPoint 内側の点
}

/**
 * 直線（無限）と線分の交点を計算
 * @param lineP1 直線上の点1
 * @param lineP2 直線上の点2
 * @param segP1 線分の端点1
 * @param segP2 線分の端点2
 * @returns 交点、または null（交差しない場合）
 */
function findLineSegmentIntersection(
  lineP1: { x: number; y: number },
  lineP2: { x: number; y: number },
  segP1: { x: number; y: number },
  segP2: { x: number; y: number }
): { x: number; y: number } | null {
  const x1 = lineP1.x,
    y1 = lineP1.y;
  const x2 = lineP2.x,
    y2 = lineP2.y;
  const x3 = segP1.x,
    y3 = segP1.y;
  const x4 = segP2.x,
    y4 = segP2.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) {
    // 平行
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // 線分パラメータ u が [0, 1] の範囲内（線分上にある）
  if (u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  return null;
}
