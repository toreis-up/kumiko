import { readFileSync } from "node:fs";
import { extname } from "node:path";
import type { PatternCharacterConfig, PatternConfigFile } from "./types/config";
import {
  createAsanohaPattern,
  createGomaPattern,
  createKakuPattern,
} from "./renderer";
import type { PatternRenderer } from "./types";

/**
 * Load pattern configuration from JSON file
 */
export function loadPatternConfig(filePath: string): PatternCharacterConfig {
  const ext = extname(filePath).toLowerCase();

  if (ext !== ".json") {
    throw new Error(`Pattern config file must be JSON format, got: ${ext}`);
  }

  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read pattern config file: ${filePath}\n${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  let data: PatternConfigFile;
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Invalid JSON in pattern config file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!data.characters || typeof data.characters !== "object") {
    throw new Error("Pattern config file must have a 'characters' object");
  }

  return data.characters;
}

/**
 * Build pattern registry from character configuration
 */
export function buildPatternRegistry(
  charConfig: PatternCharacterConfig,
  defaultSkeletonColor: string,
  defaultLeafColor: string
): Record<string, PatternRenderer> {
  const registry: Record<string, PatternRenderer> = {};

  for (const [charKey, config] of Object.entries(charConfig)) {
    const { type, options = {} } = config;

    const skeletonColor = options.skeletonColor || defaultSkeletonColor;
    const leafColor = options.leafColor || defaultLeafColor;

    switch (type) {
      case "asanoha":
        registry[charKey] = createAsanohaPattern({
          skeletonColor,
          leafColor,
          skeletonThickness: options.skeletonThickness,
          leafThickness: options.leafThickness,
        });
        break;

      case "goma":
        registry[charKey] = createGomaPattern({
          skeletonColor,
          leafColor,
          showCenterLine: options.showCenterLine,
          skeletonThickness: options.skeletonThickness,
          leafThickness: options.leafThickness,
        });
        break;

      case "kaku":
        registry[charKey] = createKakuPattern({
          skeletonColor,
          leafColor,
          ratio: options.ratio,
          skeletonThickness: options.skeletonThickness,
          leafThickness: options.leafThickness,
        });
        break;

      default:
        throw new Error(
          `Unknown pattern type: ${type} for character: ${charKey}`
        );
    }
  }

  return registry;
}
