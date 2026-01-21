import { Point, TriangleGeometry, ClipBoundary } from "../types";

export const Geom = {
  // 線形補間 (Linear Interpolation)
  lerp: (p1: Point, p2: Point, ratio: number): Point => ({
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio,
  }),

  // SVGパス生成: 線分
  line: (s: Point, e: Point) => `M ${s.x},${s.y} L ${e.x},${e.y}`,

  // SVGパス生成: 三角形
  triangle: (p1: Point, p2: Point, p3: Point) =>
    `M ${p1.x},${p1.y} L ${p2.x},${p2.y} L ${p3.x},${p3.y} Z`,

  // 座標計算エンジン
  calculateTriangle: (
    shapeType: "FULL" | "HALF_LEFT" | "HALF_RIGHT",
    direction: "UP" | "DOWN",
    x: number,
    y: number,
    s: number
  ): TriangleGeometry => {
    const h = s * (Math.sqrt(3) / 2);
    let p1: Point, p2: Point, p3: Point, center: Point;
    let clipBoundary: ClipBoundary | undefined;
    let fullP1: Point, fullP2: Point, fullP3: Point, fullCenter: Point;

    if (direction === "UP") {
      fullP1 = { x: x + s / 2, y: y };
      fullP3 = { x: x, y: y + h };
      fullP2 = { x: x + s, y: y + h };
      fullCenter = { x: x + s / 2, y: y + (2 / 3) * h };
    } else {
      fullP1 = { x: x + s / 2, y: y + h };
      fullP2 = { x: x, y: y };
      fullP3 = { x: x + s, y: y };
      fullCenter = { x: x + s / 2, y: y + (1 / 3) * h };
    }

    if (shapeType !== "FULL") {
      const diff = shapeType === "HALF_RIGHT" ? -s / 2 : 0;
      fullP1 = { x: fullP1.x + diff, y: fullP1.y };
      fullP2 = { x: fullP2.x + diff, y: fullP2.y };
      fullP3 = { x: fullP3.x + diff, y: fullP3.y };
      fullCenter = { x: fullCenter.x + diff, y: fullCenter.y };
    }

    if (shapeType === "FULL") {
      // 完全な三角形
      if (direction === "UP") {
        p1 = { x: x + s / 2, y: y };
        p3 = { x: x, y: y + h };
        p2 = { x: x + s, y: y + h };
        center = { x: x + s / 2, y: y + (2 / 3) * h };
      } else {
        // DOWN
        p1 = { x: x + s / 2, y: y + h };
        p2 = { x: x, y: y };
        p3 = { x: x + s, y: y };
        center = { x: x + s / 2, y: y + (1 / 3) * h };
      }
    } else if (shapeType === "HALF_RIGHT") {
      // 右半分残ってる三角
      if (direction === "UP") {
        // 上向き
        p1 = { x: x, y: y };
        p2 = { x: x + s / 2, y: y + h };
        p3 = { x: x, y: y + h };
        center = { x: x, y: y + (2 / 3) * h };
        clipBoundary = { type: "vertical", x: x, remainSide: "right" };
      } else {
        // 下向き
        p1 = { x: x, y: y + h };
        p2 = { x: x, y: y };
        p3 = { x: x + s / 2, y: y };
        center = { x: x, y: y + (1 / 3) * h };
        clipBoundary = { type: "vertical", x: x, remainSide: "right" };
      }
    } else {
      // 左半分残ってる三角
      if (direction === "UP") {
        // 上向き
        p1 = { x: x + s / 2, y: y };
        p2 = { x: x + s / 2, y: y + h };
        p3 = { x: x, y: y + h };
        center = { x: x + s / 2, y: y + (2 / 3) * h };
        clipBoundary = { type: "vertical", x: x + s / 2, remainSide: "left" };
      } else {
        // 下向き
        p1 = { x: x + s / 2, y: y + h };
        p2 = { x: x, y: y };
        p3 = { x: x + s / 2, y: y };
        center = { x: x + s / 2, y: y + (1 / 3) * h };
        clipBoundary = { type: "vertical", x: x + s / 2, remainSide: "left" };
      }
    }

    return { p1, p2, p3, center, partShape: shapeType, clipBoundary, full: { p1: fullP1, p2: fullP2, p3: fullP3, center: fullCenter } };
  },

  /**
   * 線分をクリップ境界で切り取る
   * @param p1 線分の端点1
   * @param p2 線分の端点2
   * @param clipX クリップ線のx座標
   * @param remainSide クリップする側（'left' or 'right'）
   * @returns クリップ後の線分の端点、または null（完全に範囲外の場合）
   */
  clipLine: (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    clipX: number,
    remainSide: "left" | "right",
  ): [{ x: number; y: number }, { x: number; y: number }] | null => {
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
  },

  
  /**
   * 直線（無限）と線分の交点を計算
   * @param lineP1 直線上の点1
   * @param lineP2 直線上の点2
   * @param segP1 線分の端点1
   * @param segP2 線分の端点2
   * @returns 交点、または null（交差しない場合）
   */
  findLineSegmentIntersection: (
    lineP1: { x: number; y: number },
    lineP2: { x: number; y: number },
    segP1: { x: number; y: number },
    segP2: { x: number; y: number }
  ): { x: number; y: number } | null => {
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

};
