import type { KumikoConfig, OutputFormat } from "./types";
import type { PatternCharacterConfig } from "./types/config";
import { writeFileSync } from "node:fs";
import { buildPatternRegistry } from "./pattern-config";
import { Geom, normalizeLeafPath, resolveStyle, getStyleKey } from "./utils";
import defaultPatterns from "./default-patterns.json";
import sharp from "sharp";

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

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">\n`;

  svgContent += `
  <style>
    :root { --kumiko-skeleton: ${config.colors.skeleton}; --kumiko-leaf: ${config.colors.leaf}; }
    .skeleton { stroke: var(--kumiko-skeleton); stroke-width: ${skeletonThickness}; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  `;

  // Add background rectangle
  svgContent += `  <rect width="${canvasWidth}" height="${canvasHeight}" fill="${config.colors.background}" />\n`;

  // Global path collectors - accumulate all paths by style and clipPath
  const globalLeafsByStyleAndClip = new Map<string, Map<string, string[]>>();
  const globalSkeletonPaths: string[] = [];
  let globalSkeletonStyle = {
    color: config.colors.skeleton,
    thickness: skeletonThickness,
  };

  // Clip path registry - maps clipPath string to unique ID
  const clipPathRegistry = new Map<string, string>();
  let clipPathCounter = 0;

  const getOrCreateClipPathId = (clipPath: string): string => {
    if (!clipPathRegistry.has(clipPath)) {
      const clipId = `clip-${clipPathCounter}`;
      clipPathRegistry.set(clipPath, clipId);
      clipPathCounter++;
    }
    return clipPathRegistry.get(clipPath)!;
  };

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
        const getOppositeDirection = (dir: "UP" | "DOWN") =>
          dir === "UP" ? "DOWN" : "UP";

        // 共通描画処理ヘルパー
        const renderTrianglePart = (
          partShape: "FULL" | "HALF_LEFT" | "HALF_RIGHT",
          direction: "UP" | "DOWN",
          xOffset: number
        ) => {
          const triangleGeometry = Geom.calculateTriangle(
            partShape,
            direction,
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
            clipPath,
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

          // Group leaves by resolved style and clipPath, add to global collectors
          leafPaths.forEach((leaf) => {
            const normalized = normalizeLeafPath(leaf);
            const resolvedStyle = resolveStyle(
              normalized.style,
              patternDefaults,
              configDefaults
            );
            const styleKey = getStyleKey(resolvedStyle);
            const className = getOrCreateStyleClass(styleKey);

            // Get or create clipPath ID (use "none" if no clipPath)
            const clipId = clipPath ? getOrCreateClipPathId(clipPath) : "none";

            // Ensure style map exists
            if (!globalLeafsByStyleAndClip.has(className)) {
              globalLeafsByStyleAndClip.set(className, new Map());
            }
            const clipMap = globalLeafsByStyleAndClip.get(className)!;

            // Ensure clip ID array exists
            if (!clipMap.has(clipId)) {
              clipMap.set(clipId, []);
            }
            clipMap.get(clipId)!.push(normalized.path);
          });

          // Add skeleton paths to global collector
          if (skeletonPaths.length > 0) {
            globalSkeletonPaths.push(...skeletonPaths);
            // Update skeleton style if pattern provides custom values
            if (finalSkeletonColor !== globalSkeletonStyle.color) {
              globalSkeletonStyle.color = finalSkeletonColor;
            }
            if (finalSkeletonThickness !== globalSkeletonStyle.thickness) {
              globalSkeletonStyle.thickness = finalSkeletonThickness;
            }
          }
        };

        // 左端
        if (charIndexInSegment === 0)
          renderTrianglePart(
            "HALF_RIGHT",
            getOppositeDirection(triangleDirection),
            0
          );

        // 本体
        renderTrianglePart("FULL", triangleDirection, 0);

        // 右端
        if (charIndexInSegment === patternChars.length - 1) {
          renderTrianglePart(
            "HALF_LEFT",
            getOppositeDirection(triangleDirection),
            halfSideLength
          );
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

  // Add clipPath definitions
  if (clipPathRegistry.size > 0) {
    svgContent += `  <defs>\n`;
    clipPathRegistry.forEach((clipId, clipPathStr) => {
      svgContent += `    <clipPath id="${clipId}">\n`;
      svgContent += `      <path d="${clipPathStr}" />\n`;
      svgContent += `    </clipPath>\n`;
    });
    svgContent += `  </defs>\n`;
  }

  // Render all accumulated paths grouped by style and clipPath
  // Draw leaves by style class and clipPath
  globalLeafsByStyleAndClip.forEach((clipMap, className) => {
    clipMap.forEach((paths, clipId) => {
      if (paths.length > 0) {
        if (clipId === "none") {
          // No clipping
          svgContent += `  <path class="${className}" d="${paths.join(
            " "
          )}" />\n`;
        } else {
          // With clipping
          svgContent += `  <g clip-path="url(#${clipId})">\n`;
          svgContent += `    <path class="${className}" d="${paths.join(
            " "
          )}" />\n`;
          svgContent += `  </g>\n`;
        }
      }
    });
  });

  // Draw all skeleton paths in one <path> element
  if (globalSkeletonPaths.length > 0) {
    svgContent += `  <path class="skeleton" d="${globalSkeletonPaths.join(
      " "
    )}" style="stroke:${globalSkeletonStyle.color};stroke-width:${
      globalSkeletonStyle.thickness
    };" />\n`;
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

/**
 * SVG to Image conversion using sharp
 * Converts SVG string to PNG, JPG, or WebP format
 */
export async function convertSVGToImage(
  svgContent: string,
  outputPath: string,
  format: OutputFormat
): Promise<void> {
  if (format === "svg") {
    writeKumikoSVG(svgContent, outputPath);
    return;
  }

  try {
    // Convert SVG to target format using sharp
    // SVG buffer to image conversion
    let sharpPipeline = sharp(Buffer.from(svgContent));

    switch (format) {
      case "png":
        await sharpPipeline.png().toFile(outputPath);
        break;
      case "jpg":
      case "jpeg":
        await sharpPipeline
          .flatten({ background: "#ffffff" })
          .jpeg({ quality: 90 })
          .toFile(outputPath);
        break;
      case "webp":
        await sharpPipeline.webp({ quality: 90 }).toFile(outputPath);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    throw new Error(`Failed to convert SVG to ${format}: ${error}`);
  }
}
