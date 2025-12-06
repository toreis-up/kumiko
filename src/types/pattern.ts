export type Point = { x: number; y: number };

// Clipping boundary for edge triangles
export interface ClipBoundary {
  type: "vertical"; // 垂直線でクリップ
  x: number; // クリップラインのx座標
  remainSide: "left" | "right"; // どちら側を残すか
}

export interface TriangleGeometry {
  p1: Point;
  p2: Point;
  p3: Point;
  center: Point;
  full: { p1: Point; p2: Point; p3: Point; center: Point };
  partShape?: "FULL" | "HALF_LEFT" | "HALF_RIGHT";
  clipBoundary?: ClipBoundary;
}

export interface RenderContext {
  geom: TriangleGeometry;
  skeletonColor: string;
  leafColor: string;
}

// Style specification for individual paths
export interface StyleSpec {
  thickness?: number;
  color?: string;
}

// Leaf path can be a simple string or an object with style
export type LeafPath =
  | string
  | {
      path: string;
      style?: StyleSpec;
    };

export type PatternRenderer = (geom: TriangleGeometry) => {
  skeleton: string[];
  leaves: LeafPath[];
  skeletonColor?: string;
  leafColor?: string;
  skeletonThickness?: number;
  leafThickness?: number;
  clipPath?: string; // SVG path string for visual clipping boundary
};

// Common pattern options
export interface BasePatternOptions {
  skeletonColor?: string;
  leafColor?: string;
  skeletonThickness?: number;
  leafThickness?: number;
}

// Pattern-specific options
export interface AsanohaOptions extends BasePatternOptions {}

export interface GomaOptions extends BasePatternOptions {
  inset?: number;
}

export interface KakuOptions extends BasePatternOptions {
  ratio?: number;
}

export interface SakuraOptions extends BasePatternOptions {
  flowerThickness?: number;
  flowerColor?: string;
  inset?: number;
}

// Blank pattern options (no special options)
export interface BlankOptions extends BasePatternOptions {}

// Pattern factory function type
export type PatternFactory<T extends BasePatternOptions = BasePatternOptions> =
  (options?: T) => PatternRenderer;

// Pattern type identifiers - acts as literal types for pattern names
export const PATTERN_TYPES = {
  ASANOHA: "asanoha",
  GOMA: "goma",
  KAKU: "kaku",
  BLANK: "blank",
  SAKURA: "sakura",
} as const;

export type PatternTypeId = (typeof PATTERN_TYPES)[keyof typeof PATTERN_TYPES];

// Pattern factory metadata with ID
export interface PatternFactoryMetadata<
  T extends BasePatternOptions = BasePatternOptions
> {
  id: PatternTypeId;
  name: string;
  factory: PatternFactory<T>;
}

// Strict pattern factory registry type - indexed by ID
export interface PatternFactoryRegistry {
  [PATTERN_TYPES.ASANOHA]: PatternFactoryMetadata<AsanohaOptions>;
  [PATTERN_TYPES.GOMA]: PatternFactoryMetadata<GomaOptions>;
  [PATTERN_TYPES.KAKU]: PatternFactoryMetadata<KakuOptions>;
  [PATTERN_TYPES.BLANK]: PatternFactoryMetadata<BlankOptions>;
  [PATTERN_TYPES.SAKURA]: PatternFactoryMetadata<SakuraOptions>;
}
