import type { KumikoConfig } from "./types";
import type { PatternCharacterConfig } from "./types/config";
import { writeFileSync } from "node:fs";
import { buildPatternRegistry } from "./pattern-config";
import { Geom, normalizeLeafPath, resolveStyle, getStyleKey } from "./utils";
import defaultPatterns from "./default-patterns.json";

/**
 * グリッドデータを基にSVGコンテンツを生成
 */
export function generateKumikoSVG(
  gridLines: string[],
  config: KumikoConfig,
  patternConfig?: PatternCharacterConfig
): string {
  const { sideLength } = config;
  const triangleHeight = sideLength * (Math.sqrt(3) / 2);
  const halfSideLength = sideLength / 2;

  // Create pattern registry with configured colors and patterns
  const patternRegistry = buildPatternRegistry(
    patternConfig || (defaultPatterns.characters as PatternCharacterConfig),
    config.colors.skeleton,
    config.colors.leaf
  );

  // 1. キャンバス幅を計算
  let maxCanvasWidth = 0;
  gridLines.forEach((line) => {
    const wallSegments = line.split("|");
    let lineWidth = 0;
    wallSegments.forEach((segment) => {
      const patternChars = segment
        .trim()
        .split(/\s+/)
        .filter((char) => char.length > 0);
      if (patternChars.length === 0) return;
      const segmentWidth =
        patternChars.length * halfSideLength + halfSideLength;
      lineWidth += segmentWidth;
    });
    if (lineWidth > maxCanvasWidth) maxCanvasWidth = lineWidth;
  });

  const canvasWidth = maxCanvasWidth;
  const canvasHeight = gridLines.length * triangleHeight;

  // Calculate default and configured thickness values
  const skeletonThickness =
    config.thickness?.skeleton ?? config.sideLength * 0.04;
  const leafThickness = config.thickness?.leaf ?? config.sideLength * 0.015;

  // Style class management for atomic CSS
  const styleClassMap = new Map<string, string>();
  let styleClassCounter = 0;

  const getOrCreateStyleClass = (styleKey: string): string => {
    if (!styleClassMap.has(styleKey)) {
      const className = `leaf-${styleClassCounter}`;
      styleClassMap.set(styleKey, className);
      styleClassCounter++;
    }
    return styleClassMap.get(styleKey)!;
  };

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}" style="background-color:var(--kumiko-bg, ${config.colors.background})">\n`;

  svgContent += `
  <style>
    :root { --kumiko-skeleton: ${config.colors.skeleton}; --kumiko-leaf: ${config.colors.leaf}; }
    .skeleton { stroke: var(--kumiko-skeleton); stroke-width: ${skeletonThickness}; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  `;

  // 2. 描画ループ
  gridLines.forEach((lineStr, lineIndex) => {
    const wallSegments = lineStr.split("|");
    let xPosition = 0;
    const yPosition = lineIndex * triangleHeight;

    wallSegments.forEach((segmentStr) => {
      const patternChars = segmentStr
        .trim()
        .split(/\s+/)
        .filter((char) => char.length > 0);
      if (patternChars.length === 0) return;

      patternChars.forEach((patternChar, charIndexInSegment) => {
        const patternRenderer =
          patternRegistry[patternChar] || patternRegistry["G"];

        // 自動配向 (セグメントごとにリセット)
        const isDownTriangle = (lineIndex + charIndexInSegment) % 2 === 0;
        const triangleDirection = isDownTriangle ? "DOWN" : "UP";

        // 共通描画処理ヘルパー
        const renderTrianglePart = (
          partShape: "FULL" | "HALF_LEFT" | "HALF_RIGHT",
          xOffset: number,
          elementClass?: string
        ) => {
          const triangleGeometry = Geom.calculateTriangle(
            partShape,
            triangleDirection,
            xPosition + xOffset,
            yPosition,
            sideLength
          );
          const {
            skeleton: skeletonPaths,
            leaves: leafPaths,
            skeletonColor,
            leafColor,
            skeletonThickness: patternSkeletonThickness,
            leafThickness: patternLeafThickness,
          } = patternRenderer(triangleGeometry);

          // パターン固有の値がなければ設定のデフォルト値を使用
          const finalSkeletonColor = skeletonColor || config.colors.skeleton;
          const finalSkeletonThickness =
            patternSkeletonThickness ?? skeletonThickness;

          // Pattern defaults for leaf style resolution
          const patternDefaults = {
            color: leafColor,
            thickness: patternLeafThickness,
          };
          const configDefaults = {
            color: config.colors.leaf,
            thickness: leafThickness,
          };

          // Group leaves by resolved style
          const leafsByStyle = new Map<string, string[]>();

          leafPaths.forEach((leaf) => {
            const normalized = normalizeLeafPath(leaf);
            const resolvedStyle = resolveStyle(
              normalized.style,
              patternDefaults,
              configDefaults
            );
            const styleKey = getStyleKey(resolvedStyle);
            const className = getOrCreateStyleClass(styleKey);

            if (!leafsByStyle.has(className)) {
              leafsByStyle.set(className, []);
            }
            leafsByStyle.get(className)!.push(normalized.path);
          });

          const groupTag = elementClass ? `<g class="${elementClass}">` : `<g>`;
          svgContent += `  ${groupTag}`;

          // Draw leaves by style class
          leafsByStyle.forEach((paths, className) => {
            if (paths.length > 0) {
              svgContent += `<path class="${className}" d="${paths.join(
                " "
              )}" />`;
            }
          });

          // Draw skeleton on top
          if (skeletonPaths.length > 0) {
            svgContent += `<path class="skeleton" d="${skeletonPaths.join(
              " "
            )}" style="stroke:${finalSkeletonColor};stroke-width:${finalSkeletonThickness};" />`;
          }

          svgContent += `</g>\n`;
        };

        // 左端
        if (charIndexInSegment === 0)
          renderTrianglePart("HALF_LEFT", 0, "edge-L");

        // 本体
        renderTrianglePart("FULL", 0);

        // 右端
        if (charIndexInSegment === patternChars.length - 1) {
          renderTrianglePart("HALF_RIGHT", halfSideLength, "edge-R");
          xPosition += halfSideLength; // 右端分進める
        }

        xPosition += halfSideLength; // 本体分進める
      });
    });
  });

  // Add dynamically generated style classes
  if (styleClassMap.size > 0) {
    svgContent += `  <style>\n`;
    styleClassMap.forEach((className, styleKey) => {
      const [thicknessStr, color] = styleKey.split("|");
      svgContent += `    .${className} { stroke: ${color}; stroke-width: ${thicknessStr}; fill: none; stroke-linecap: round; stroke-linejoin: round; }\n`;
    });
    svgContent += `  </style>\n`;
  }

  svgContent += `</svg>`;
  return svgContent;
}

/**
 * SVGファイルを出力
 */
export function writeKumikoSVG(svgContent: string, outputPath: string): void {
  writeFileSync(outputPath, svgContent);
  console.log(`Generated: ${outputPath}`);
}
