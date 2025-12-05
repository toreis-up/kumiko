import type {
  AsanohaOptions,
  GomaOptions,
  KakuOptions,
  BlankOptions,
  PATTERN_TYPES,
  SakuraOptions,
} from "./pattern";

export interface KumikoConfig {
  sideLength: number;
  outputFilename: string;
  colors: { skeleton: string; leaf: string; background: string };
  thickness?: { skeleton?: number; leaf?: number };
}

// Pattern character to pattern type mapping - using pattern type IDs
export interface PatternCharacterConfig {
  [charKey: string]:
    | {
        type: typeof PATTERN_TYPES.ASANOHA;
        options?: AsanohaOptions;
      }
    | {
        type: typeof PATTERN_TYPES.GOMA;
        options?: GomaOptions;
      }
    | {
        type: typeof PATTERN_TYPES.KAKU;
        options?: KakuOptions;
      }
    | {
        type: typeof PATTERN_TYPES.BLANK;
        options?: BlankOptions;
      }
    | {
        type: typeof PATTERN_TYPES.SAKURA;
        options?: SakuraOptions;
      };
}

// Full pattern configuration file format
export interface PatternConfigFile {
  characters: PatternCharacterConfig;
}
