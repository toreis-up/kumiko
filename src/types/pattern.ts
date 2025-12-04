export type Point = { x: number; y: number };

export interface TriangleGeometry {
  p1: Point;
  p2: Point;
  p3: Point;
  center: Point;
}

export interface RenderContext {
  geom: TriangleGeometry;
  skeletonColor: string;
  leafColor: string;
}

export type PatternRenderer = (geom: TriangleGeometry) => {
  skeleton: string[];
  leaves: string[];
  skeletonColor?: string;
  leafColor?: string;
  skeletonThickness?: number;
  leafThickness?: number;
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
  showCenterLine?: boolean;
}

export interface KakuOptions extends BasePatternOptions {
  ratio?: number;
}
