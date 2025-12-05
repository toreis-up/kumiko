import type { LeafPath, StyleSpec } from "../types";

/**
 * Normalize color representation to a canonical format
 * Converts various color formats to lowercase hex format
 */
export function normalizeColor(color: string): string {
  // Convert to lowercase and trim
  const normalized = color.trim().toLowerCase();

  // If it's already a hex color, return as-is
  if (/^#[0-9a-f]{6}$/.test(normalized) || /^#[0-9a-f]{3}$/.test(normalized)) {
    return normalized;
  }

  // For rgb/rgba, we'd need more complex parsing
  // For now, just return the normalized lowercase version
  return normalized;
}

/**
 * Normalize thickness value to a consistent precision
 * Rounds to 3 decimal places to avoid floating point differences
 */
export function normalizeThickness(thickness: number): number {
  return Math.round(thickness * 1000) / 1000;
}

/**
 * Generate a unique key for a style specification
 * Used for generating consistent CSS class names
 */
export function getStyleKey(style: Required<StyleSpec>): string {
  const normalizedColor = normalizeColor(style.color);
  const normalizedThickness = normalizeThickness(style.thickness);
  return `${normalizedThickness}|${normalizedColor}`;
}

/**
 * Normalize a LeafPath to a consistent object format
 * Type-safe helper that converts string | object to object
 */
export function normalizeLeafPath(leaf: LeafPath): {
  path: string;
  style: StyleSpec;
} {
  if (typeof leaf === "string") {
    return { path: leaf, style: {} };
  }
  return { path: leaf.path, style: leaf.style || {} };
}

/**
 * Resolve the final style by merging defaults with overrides
 * Priority: leaf.style > pattern defaults > config defaults
 */
export function resolveStyle(
  leafStyle: StyleSpec | undefined,
  patternDefaults: StyleSpec,
  configDefaults: StyleSpec
): Required<StyleSpec> {
  return {
    color:
      leafStyle?.color ??
      patternDefaults.color ??
      configDefaults.color ??
      "#000000",
    thickness:
      leafStyle?.thickness ??
      patternDefaults.thickness ??
      configDefaults.thickness ??
      1,
  };
}
