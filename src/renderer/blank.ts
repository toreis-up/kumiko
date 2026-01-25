import { PatternRenderer, BasePatternOptions } from "../types";
import { buildPatternResult } from "./helper";

/**
 * 空白 (Blank) パターン生成ロジック
 * 何も描画しない
 */
export const createBlankPattern = (
  options: BasePatternOptions = {}
): PatternRenderer => {
  return () => {
    return buildPatternResult(
      { skeleton: [], leaves: [] },
      options
    )
  };
};
