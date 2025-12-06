import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { extname, dirname, join } from "node:path";
import type { KumikoConfig, OutputFormat } from "./types";
import {
  generateKumikoSVG,
  writeKumikoSVG,
  convertSVGToImage,
} from "./generator";
import { parseInputFile } from "./parser";
import { loadPatternConfig } from "./pattern-config";

/**
 * Detect output format from file extension
 */
function detectFormatFromExtension(filePath: string): OutputFormat {
  const ext = extname(filePath).toLowerCase().slice(1);
  const validFormats: OutputFormat[] = ["svg", "png", "jpg", "jpeg", "webp"];

  if (validFormats.includes(ext as OutputFormat)) {
    return ext as OutputFormat;
  }

  return "svg"; // Default to SVG
}

/**
 * Generate output filename with specified format
 */
function generateOutputFilename(
  inputPath: string,
  format: OutputFormat
): string {
  const dir = dirname(inputPath);
  const filename =
    extname(inputPath) === ""
      ? inputPath
      : inputPath.slice(0, -extname(inputPath).length);
  const baseName = filename.split(/[\\/]/).pop() || "kumiko";

  const extension = format === "jpeg" ? "jpg" : format;
  return join(dir, `${baseName}.${extension}`);
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
        "Output file path (if not specified, uses input filename with format extension). Format is auto-detected from extension or --format option",
      type: "string",
    })
    .option("format", {
      alias: "f",
      description:
        "Output format (svg, png, jpg, jpeg, webp). If not specified, detected from -o extension or defaults to svg",
      type: "string",
      choices: ["svg", "png", "jpg", "jpeg", "webp"],
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
    .option("skeleton-thickness", {
      description:
        "Skeleton stroke thickness (as a multiplier of side-length, e.g., 0.04 for default)",
      type: "number",
    })
    .option("leaf-thickness", {
      description:
        "Leaf stroke thickness (as a multiplier of side-length, e.g., 0.015 for default)",
      type: "number",
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

  // Determine output format and filename
  let outputFormat: OutputFormat = "svg";

  // Priority 1: --format option
  if (argv.format) {
    outputFormat = argv.format as OutputFormat;
  }
  // Priority 2: -o extension
  else if (argv.output) {
    outputFormat = detectFormatFromExtension(argv.output);
  }

  // Generate output filename based on format
  const outputFilename =
    argv.output || generateOutputFilename(argv.input, outputFormat);

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
    outputFormat,
    colors: {
      skeleton: argv.skeletonColor,
      leaf: argv.leafColor,
      background: argv.backgroundColor,
    },
    thickness: {
      skeleton: argv.skeletonThickness,
      leaf: argv.leafThickness,
    },
  };

  const svgContent = generateKumikoSVG(grid, config, patternConfig);

  // Output based on format
  try {
    if (outputFormat === "svg") {
      writeKumikoSVG(svgContent, config.outputFilename);
    } else {
      await convertSVGToImage(svgContent, config.outputFilename, outputFormat);
    }
  } catch (error) {
    console.error(`Error generating output: ${error}`);
    process.exit(1);
  }
}

main().catch(console.error);
