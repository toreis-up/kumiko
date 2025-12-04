export interface KumikoConfig {
  sideLength: number;
  outputFilename: string;
  colors: { skeleton: string; leaf: string; background: string };
  thickness?: { skeleton?: number; leaf?: number };
}

// Pattern character to pattern type mapping
export interface PatternCharacterConfig {
  [charKey: string]: {
    type: "asanoha" | "goma" | "kaku";
    options?: {
      ratio?: number;
      showCenterLine?: boolean;
      skeletonColor?: string;
      leafColor?: string;
      skeletonThickness?: number;
      leafThickness?: number;
    };
  };
}

// Full pattern configuration file format
export interface PatternConfigFile {
  characters: PatternCharacterConfig;
}
