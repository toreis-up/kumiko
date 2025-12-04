import { readFileSync } from "node:fs";
import { extname } from "node:path";
import type { PatternCharacterConfig, PatternConfigFile } from "./types/config";
import { PATTERN_FACTORIES } from "./renderer";
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
 * Uses PATTERN_FACTORIES to get factory functions by ID
 */
export function buildPatternRegistry(
  charConfig: PatternCharacterConfig,
  defaultSkeletonColor: string,
  defaultLeafColor: string
): Record<string, PatternRenderer> {
  const registry: Record<string, PatternRenderer> = {};

  for (const [charKey, config] of Object.entries(charConfig)) {
    const { type, options = {} } = config;

    // Get factory metadata by pattern type ID
    const factoryMetadata = PATTERN_FACTORIES[type];
    if (!factoryMetadata) {
      throw new Error(
        `Unknown pattern type: ${type} for character: ${charKey}`
      );
    }

    // Apply default colors
    const mergedOptions = {
      ...options,
      skeletonColor: options.skeletonColor || defaultSkeletonColor,
      leafColor: options.leafColor || defaultLeafColor,
    };

    // Call factory via metadata
    registry[charKey] = factoryMetadata.factory(mergedOptions as any);
  }

  return registry;
}
