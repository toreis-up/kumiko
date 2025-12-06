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
    const line1_int1 = findLineSegmentIntersection(ip1, ip2, p2, p3);
    const line1_int2 = findLineSegmentIntersection(ip1, ip2, p3, p1);

    // 辺 ip2-ip3 を延長 → p3-p1 と p1-p2 と交わる
    const line2_int1 = findLineSegmentIntersection(ip2, ip3, p3, p1);
    const line2_int2 = findLineSegmentIntersection(ip2, ip3, p1, p2);

    // 辺 ip3-ip1 を延長 → p1-p2 と p2-p3 と交わる
    const line3_int1 = findLineSegmentIntersection(ip3, ip1, p1, p2);
    const line3_int2 = findLineSegmentIntersection(ip3, ip1, p2, p3);

    // 交点が見つかった場合のみ leaf を描画（clipBoundary があればクリップ）
    const addLeaf = (
      pt1: { x: number; y: number } | null,
      pt2: { x: number; y: number } | null
    ) => {
      if (!pt1 || !pt2) return;

      if (clipBoundary && clipBoundary.type === "vertical") {
        const clipped = clipLine(pt1, pt2, clipBoundary.x, clipBoundary.remainSide);
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

    return {
      skeleton,
      leaves,
      skeletonColor,
      leafColor,
      skeletonThickness,
      leafThickness,
      clipPath: Geom.triangle(p1, p2, p3),
    };
  };
};

/**
 * 線分をクリップ境界で切り取る
 * @param p1 線分の端点1
 * @param p2 線分の端点2
 * @param clipX クリップ線のx座標
 * @param remainSide クリップする側（'left' or 'right'）
 * @returns クリップ後の線分の端点、または null（完全に範囲外の場合）
 */
function clipLine(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  clipX: number,
  remainSide: "left" | "right"
): [{ x: number; y: number }, { x: number; y: number }] | null {
  const keep1 = remainSide === "left" ? p1.x <= clipX : p1.x >= clipX;
  const keep2 = remainSide === "left" ? p2.x <= clipX : p2.x >= clipX;

  // 両端点が範囲内
  if (keep1 && keep2) {
    return [p1, p2];
  }

  // 両端点が範囲外
  if (!keep1 && !keep2) {
    return null;
  }

  // 交点を計算
  const dx = p2.x - p1.x;
  if (Math.abs(dx) < 1e-10) {
    // 垂直線の場合
    return null;
  }

  const t = (clipX - p1.x) / dx;
  const intersection = {
    x: clipX,
    y: p1.y + t * (p2.y - p1.y),
  };

  // 片方の端点が範囲内、もう片方が範囲外
  if (keep1) {
    return [p1, intersection];
  } else {
    return [intersection, p2];
  }
}

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
