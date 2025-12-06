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
};
