import { PatternRenderer, SakuraOptions, LeafPath } from "../types";
import { Geom } from "../utils";

export const createSakuraPattern = (
  options: SakuraOptions = {}
): PatternRenderer => {
  const {
    skeletonColor,
    leafColor,
    inset = 0.3,
    flowerThickness = 2,
    flowerColor = "#FFB7C5",
    skeletonThickness,
    leafThickness,
  } = options;

  return ({ p1, p2, p3, center, clipBoundary }) => {
    const skeleton: string[] = [];
    const leaves: LeafPath[] = [];

    // 外枠（三角形）を描画
    skeleton.push(Geom.triangle(p1, p2, p3));

    const ip1 = Geom.lerp(center, p1, 1 - inset);
    const ip2 = Geom.lerp(center, p2, 1 - inset);
    const ip3 = Geom.lerp(center, p3, 1 - inset);

    // 中心から頂点への細い線（デフォルトの leaf スタイル）をクリップしながら追加
    const addThinLeaf = (
      from: { x: number; y: number },
      to: { x: number; y: number }
    ) => {
      if (clipBoundary && clipBoundary.type === "vertical") {
        const clipped = clipLine(from, to, clipBoundary.x, clipBoundary.side);
        if (clipped) {
          leaves.push(Geom.line(clipped[0], clipped[1]));
        }
      } else {
        leaves.push(Geom.line(from, to));
      }
    };

    addThinLeaf(center, ip1);
    addThinLeaf(center, ip2);
    addThinLeaf(center, ip3);

    const lip1 = Geom.lerp(center, p1, -(1 - inset) * 2);
    const lip2 = Geom.lerp(center, p2, -(1 - inset) * 2);
    const lip3 = Geom.lerp(center, p3, -(1 - inset) * 2);

    const line1_int1 = findLineSegmentIntersection(lip1, lip2, p2, p3);
    const line1_int2 = findLineSegmentIntersection(lip1, lip2, p3, p1);
    const line2_int1 = findLineSegmentIntersection(lip2, lip3, p3, p1);
    const line2_int2 = findLineSegmentIntersection(lip2, lip3, p1, p2);
    const line3_int1 = findLineSegmentIntersection(lip3, lip1, p1, p2);
    const line3_int2 = findLineSegmentIntersection(lip3, lip1, p2, p3);

    // 花びらの太い線（カスタムスタイル）をクリップしながら追加
    const flowerStyle = {
      thickness: flowerThickness * 2,
      color: flowerColor,
    };

    const addFlowerLeaf = (
      pt1: { x: number; y: number } | null,
      pt2: { x: number; y: number } | null
    ) => {
      if (!pt1 || !pt2) return;

      if (clipBoundary && clipBoundary.type === "vertical") {
        const clipped = clipLine(pt1, pt2, clipBoundary.x, clipBoundary.side);
        if (clipped) {
          leaves.push({
            path: Geom.line(clipped[0], clipped[1]),
            style: flowerStyle,
          });
        }
      } else {
        leaves.push({
          path: Geom.line(pt1, pt2),
          style: flowerStyle,
        });
      }
    };

    addFlowerLeaf(line1_int1, line1_int2);
    addFlowerLeaf(line2_int1, line2_int2);
    addFlowerLeaf(line3_int1, line3_int2);

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
 * 線分をクリップ境界で切り取る
 * @param p1 線分の端点1
 * @param p2 線分の端点2
 * @param clipX クリップ線のx座標
 * @param side クリップする側（'left' or 'right'）
 * @returns クリップ後の線分の端点、または null（完全に範囲外の場合）
 */
function clipLine(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  clipX: number,
  side: "left" | "right"
): [{ x: number; y: number }, { x: number; y: number }] | null {
  const keep1 = side === "left" ? p1.x <= clipX : p1.x >= clipX;
  const keep2 = side === "left" ? p2.x <= clipX : p2.x >= clipX;

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
