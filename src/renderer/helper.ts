import type { BasePatternOptions, LeafPath } from "../types";

export function buildPatternResult(
  base: {
    skeleton: string[];
    leaves: LeafPath[];
    clipPath?: string;
  },
  options: BasePatternOptions
) {
  return {
    ...base,
    skeletonColor: options.skeletonColor,
    leafColor: options.leafColor,
    skeletonThickness: options.skeletonThickness,
    leafThickness: options.leafThickness,
  }
}