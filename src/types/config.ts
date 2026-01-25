import type {
  PatternTypeId,
  PatternOptionsMap,
} from "./pattern";

export type OutputFormat = "svg" | "png" | "jpg" | "jpeg" | "webp";

export interface KumikoConfig {
  sideLength: number;
  outputFilename: string;
  outputFormat?: OutputFormat;
  colors: { skeleton: string; leaf: string; background: string };
  thickness?: { skeleton?: number; leaf?: number };
  animation?: boolean;
}

// Pattern character to pattern type mapping - using pattern type IDs
export interface PatternCharacterConfig {
  [charKey: string]: {
    [K in PatternTypeId]: {type: K, options: PatternOptionsMap[K]};
  }[PatternTypeId]
}

// Full pattern configuration file format
export interface PatternConfigFile {
  characters: PatternCharacterConfig;
}
