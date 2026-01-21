import { PatternRenderer, SakuraOptions, LeafPath } from "../types";
import { Geom } from "../utils";
import { buildPatternResult } from "./helper";

export const createSakuraPattern = (
  options: SakuraOptions = {}
): PatternRenderer => {
  const {
    inset = 0.3,
    flowerThickness = 2,
    flowerColor = "#FFB7C5",
  } = options;

  return ({ p1, p2, p3, full, center, clipBoundary }) => {
    const skeleton: string[] = [];
    const leaves: LeafPath[] = [];

    // 外枠（三角形）を描画
    skeleton.push(Geom.triangle(p1, p2, p3));

    const fp1 = full.p1;
    const fp2 = full.p2;
    const fp3 = full.p3;

    const ip1 = Geom.lerp(center, p1, 1 - inset);
    const ip2 = Geom.lerp(center, p2, 1 - inset);
    const ip3 = Geom.lerp(center, p3, 1 - inset);

    // 中心から頂点への細い線（デフォルトの leaf スタイル）をクリップしながら追加
    const addThinLeaf = (
      from: { x: number; y: number },
      to: { x: number; y: number }
    ) => {
      if (clipBoundary && clipBoundary.type === "vertical") {
        const clipped = Geom.clipLine(from, to, clipBoundary.x, clipBoundary.remainSide);
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

    const lip1 = Geom.lerp(center, fp1, -(1 - inset) * 2);
    const lip2 = Geom.lerp(center, fp2, -(1 - inset) * 2);
    const lip3 = Geom.lerp(center, fp3, -(1 - inset) * 2);

    const line1_int1 = Geom.findLineSegmentIntersection(lip1, lip2, p2, p3);
    const line1_int2 = Geom.findLineSegmentIntersection(lip1, lip2, p3, p1);
    const line2_int1 = Geom.findLineSegmentIntersection(lip2, lip3, p3, p1);
    const line2_int2 = Geom.findLineSegmentIntersection(lip2, lip3, p1, p2);
    const line3_int1 = Geom.findLineSegmentIntersection(lip3, lip1, p1, p2);
    const line3_int2 = Geom.findLineSegmentIntersection(lip3, lip1, p2, p3);

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
        const clipped = Geom.clipLine(pt1, pt2, clipBoundary.x, clipBoundary.remainSide);
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

    return buildPatternResult(
      { skeleton, leaves, clipPath: Geom.triangle(p1, p2, p3) },
      options
    )
  };
};


