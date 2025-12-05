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

    if (shapeType === "FULL") {
      // 完全な三角形
      if (direction === "UP") {
        p1 = { x: x + s / 2, y: y };
        p2 = { x: x, y: y + h };
        p3 = { x: x + s, y: y + h };
        center = { x: x + s / 2, y: y + (2 / 3) * h };
      } else {
        // DOWN
        p1 = { x: x, y: y };
        p2 = { x: x + s, y: y };
        p3 = { x: x + s / 2, y: y + h };
        center = { x: x + s / 2, y: y + (1 / 3) * h };
      }
    } else if (shapeType === "HALF_LEFT") {
      // 左半分 → 左に完全な三角形があると想定
      if (direction === "UP") {
        // HALF_LEFT + DOWN: 左下の直角三角形 |_\
        // → 左側にある DOWN 三角形の右半分
        p1 = { x: x - s / 2, y: y };
        p2 = { x: x + s / 2, y: y };
        p3 = { x: x, y: y + h };
        center = { x: x, y: y + (1 / 3) * h };
        clipBoundary = { type: "vertical", x: x, side: "right" };
      } else {
        // HALF_LEFT + UP: 左上の直角三角形
        // → 左側にある UP 三角形の右半分
        p1 = { x: x, y: y };
        p2 = { x: x - s / 2, y: y + h };
        p3 = { x: x + s / 2, y: y + h };
        center = { x: x, y: y + (2 / 3) * h };
        clipBoundary = { type: "vertical", x: x, side: "right" };
      }
    } else {
      // HALF_RIGHT
      // 右半分 → 右に完全な三角形があると想定
      if (direction === "UP") {
        // HALF_RIGHT + DOWN: 右下の直角三角形 /_|
        // → 右側にある DOWN 三角形の左半分
        p1 = { x: x, y: y };
        p2 = { x: x + s, y: y };
        p3 = { x: x + s / 2, y: y + h };
        center = { x: x + s / 2, y: y + (1 / 3) * h };
        clipBoundary = { type: "vertical", x: x + s / 2, side: "left" };
      } else {
        // HALF_RIGHT + UP: 右上の直角三角形
        // → 右側にある UP 三角形の左半分
        p1 = { x: x + s / 2, y: y };
        p2 = { x: x, y: y + h };
        p3 = { x: x + s, y: y + h };
        center = { x: x + s / 2, y: y + (2 / 3) * h };
        clipBoundary = { type: "vertical", x: x + s / 2, side: "left" };
      }
    }

    return { p1, p2, p3, center, partShape: shapeType, clipBoundary };
  },
};
