import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { extname, dirname, join } from "node:path";
import type { KumikoConfig } from "./types";
import { generateKumikoSVG, writeKumikoSVG } from "./generator";
import { parseInputFile } from "./parser";
import { loadPatternConfig } from "./pattern-config";

/**
 * Generate output filename from input filename
 * Changes the extension to .svg
 */
function generateOutputFilename(inputPath: string): string {
  const dir = dirname(inputPath);
  const filename =
    extname(inputPath) === ""
      ? inputPath
      : inputPath.slice(0, -extname(inputPath).length);
  const baseName = filename.split(/[\\/]/).pop() || "kumiko";
  return join(dir, `${baseName}.svg`);
}

/**
 * Repeat grid pattern horizontally and vertically
 * Repeats the entire row pattern (including walls)
 * @param grid Original grid pattern
 * @param repeatX Number of times to repeat the pattern horizontally
 * @param repeatY Number of times to repeat the pattern vertically
 */
function repeatPattern(
  grid: string[],
  repeatX: number,
  repeatY: number
): string[] {
  if (repeatX < 1 || repeatY < 1) {
    throw new Error("repeatX and repeatY must be at least 1");
  }

  if (repeatX === 1 && repeatY === 1) {
    return grid;
  }

  // Repeat horizontally first - repeat the entire row pattern
  const horizontalRepeated = grid.map((row) => {
    if (repeatX === 1) {
      return row;
    }

    // Repeat the entire row pattern
    const repeatedRows = Array(repeatX).fill(row).join(" ");
    return repeatedRows;
  });

  // Then repeat vertically
  const verticalRepeated = Array(repeatY).fill(horizontalRepeated).flat();

  return verticalRepeated;
}

const DEFAULT_CONFIG: KumikoConfig = {
  sideLength: 100,
  outputFilename: "kumiko.svg",
  colors: {
    skeleton: "#633524ff",
    leaf: "#8d6e63",
    background: "#33312eff",
  },
};

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("input", {
      alias: "i",
      description: "Input file path (supports .txt, .csv, .json) - REQUIRED",
      type: "string",
      demandOption: true,
    })
    .option("output", {
      alias: "o",
      description:
        "Output SVG file path (if not specified, uses input filename with .svg extension)",
      type: "string",
    })
    .option("repeat-x", {
      description: "Number of times to repeat the pattern horizontally",
      type: "number",
      default: 1,
    })
    .option("repeat-y", {
      description: "Number of times to repeat the pattern vertically",
      type: "number",
      default: 1,
    })
    .option("pattern-config", {
      description:
        "Pattern configuration file (JSON) - defines character to pattern mapping",
      type: "string",
    })
    .option("side-length", {
      description: "Side length of the kumiko unit",
      type: "number",
      default: DEFAULT_CONFIG.sideLength,
    })
    .option("skeleton-color", {
      description: "Skeleton color (hex)",
      type: "string",
      default: DEFAULT_CONFIG.colors.skeleton,
    })
    .option("leaf-color", {
      description: "Leaf color (hex)",
      type: "string",
      default: DEFAULT_CONFIG.colors.leaf,
    })
    .option("background-color", {
      description: "Background color (hex)",
      type: "string",
      default: DEFAULT_CONFIG.colors.background,
    })
    .help()
    .alias("help", "h")
    .parse();

  // Load grid from file
  let grid: string[];
  try {
    grid = parseInputFile(argv.input);
    console.log(`Loaded grid from: ${argv.input}`);
  } catch (error) {
    console.error(`Error reading input file: ${error}`);
    process.exit(1);
  }

  // Apply pattern repetition
  try {
    grid = repeatPattern(grid, argv.repeatX, argv.repeatY);
    if (argv.repeatX > 1 || argv.repeatY > 1) {
      console.log(
        `Applied repetition: ${argv.repeatX}x (horizontal) × ${argv.repeatY}x (vertical)`
      );
    }
  } catch (error) {
    console.error(`Error applying repetition: ${error}`);
    process.exit(1);
  }

  // Determine output filename
  const outputFilename = argv.output || generateOutputFilename(argv.input);

  // Load pattern configuration if provided
  let patternConfig;
  if (argv.patternConfig) {
    try {
      patternConfig = loadPatternConfig(argv.patternConfig);
      console.log(`Loaded pattern config from: ${argv.patternConfig}`);
    } catch (error) {
      console.error(`Error reading pattern config file: ${error}`);
      process.exit(1);
    }
  }

  const config: KumikoConfig = {
    sideLength: argv.sideLength,
    outputFilename,
    colors: {
      skeleton: argv.skeletonColor,
      leaf: argv.leafColor,
      background: argv.backgroundColor,
    },
  };

  const svgContent = generateKumikoSVG(grid, config, patternConfig);
  writeKumikoSVG(svgContent, config.outputFilename);
}

main().catch(console.error);
