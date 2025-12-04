import type { PatternFactoryRegistry } from "../types";
import { PATTERN_TYPES } from "../types/pattern";
import { createAsanohaPattern } from "./asanoha";
import { createGomaPattern } from "./goma";
import { createKakuPattern } from "./kaku";
import { createBlankPattern } from "./blank";

export { createAsanohaPattern } from "./asanoha";
export { createGomaPattern } from "./goma";
export { createKakuPattern } from "./kaku";
export { createBlankPattern } from "./blank";
export { PATTERN_TYPES } from "../types/pattern";

/**
 * Pattern factory registry with metadata
 * Each factory is registered with its ID and metadata
 */
export const PATTERN_FACTORIES: PatternFactoryRegistry = {
  [PATTERN_TYPES.ASANOHA]: {
    id: PATTERN_TYPES.ASANOHA,
    name: "Asanoha (Hemp Leaf)",
    factory: createAsanohaPattern,
  },
  [PATTERN_TYPES.GOMA]: {
    id: PATTERN_TYPES.GOMA,
    name: "Goma (Sesame)",
    factory: createGomaPattern,
  },
  [PATTERN_TYPES.KAKU]: {
    id: PATTERN_TYPES.KAKU,
    name: "Kaku-Asanoha (Angular Hemp Leaf)",
    factory: createKakuPattern,
  },
  [PATTERN_TYPES.BLANK]: {
    id: PATTERN_TYPES.BLANK,
    name: "Blank (Empty)",
    factory: createBlankPattern,
  },
} as const;
