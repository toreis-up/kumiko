import { PatternRenderer, KakuOptions } from "../types";
import { Geom } from "../utils";

/**
 * 角麻 (Kaku-Asanoha) パターン生成ロジック
 */
export const createKakuPattern = (
  options: KakuOptions = {}
): PatternRenderer => {
  const { skeletonColor, leafColor, ratio = 0.65 } = options;

  return ({ p1, p2, p3, center }) => {
    // 1. 内側の頂点を計算 (重心に向かって縮小)
    const ip1 = Geom.lerp(center, p1, ratio);
    const ip2 = Geom.lerp(center, p2, ratio);
    const ip3 = Geom.lerp(center, p3, ratio);

    return {
      skeleton: [
        // 外枠
        Geom.triangle(p1, p2, p3),
        // 内枠
        Geom.triangle(ip1, ip2, ip3),
        // ブリッジ
        Geom.line(p1, ip1),
        Geom.line(p2, ip2),
        Geom.line(p3, ip3),
      ],
      leaves: [
        // 内側の麻の葉
        Geom.line(center, ip1),
        Geom.line(center, ip2),
        Geom.line(center, ip3),
      ],
      skeletonColor,
      leafColor,
    };
  };
};
