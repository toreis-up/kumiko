export interface KumikoConfig {
  sideLength: number;
  outputFilename: string;
  colors: { skeleton: string; leaf: string; background: string };
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
    };
  };
}

// Full pattern configuration file format
export interface PatternConfigFile {
  characters: PatternCharacterConfig;
}
