import { readFileSync, existsSync } from "node:fs";
import { extname, resolve } from "node:path";

type SupportedExtensions = ".txt" | ".csv" | ".json";

type Parser = (content: string) => string[];

const parserMap: Record<SupportedExtensions, Parser> = {
  ".txt": parsePlainText,
  ".csv": parseCSV,
  ".json": parseJSON,
};

function getParser(ext: SupportedExtensions): Parser {
  const parser = parserMap[ext];
  if (!parser) {
    throw new Error(`Unsupported file format: ${ext}`);
  }

  return parser;
}

function isSupportedExtension(ext: string): ext is SupportedExtensions {
  return Object.keys(parserMap).includes(ext);
}

/**
 * Validate input file
 */
function validateInputFile(filePath: string): SupportedExtensions {
  // Check if file exists
  if (!existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  // Check file extension
  const ext = extname(filePath).toLowerCase();
  if (!isSupportedExtension(ext)) {
    throw new Error(`Unsupported input file format: ${ext}`);
  }

  return ext;
}

/**
 * Parse input file and extract grid pattern lines
 * Supports: .txt, .csv, .json formats
 */
export function parseInputFile(filePath: string): string[] {
  // Validate file before reading
  const fileExt = validateInputFile(filePath);

  const absolutePath = resolve(filePath);

  let content: string;
  try {
    content = readFileSync(absolutePath, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read file: ${filePath}\n${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // Validate content is not empty
  if (!content.trim()) {
    throw new Error(`Input file is empty: ${filePath}`);
  }

  const parser = getParser(fileExt);
  return parser(content);
}

const splitLines = (content: string): string[] =>
  content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

function isFormattedLine(line: string): boolean {
  const segments = line.split("|").map((s) => s.trim());
  return segments.every((seg) => {
    if (seg.length === 0) return true;
    const tokens = seg.split(/\s+/).filter(Boolean);
    return tokens.every((t) => t.length === 1);
  });
}

function normalizeLine(line: string): string {
  if (isFormattedLine(line)) return line;

  return line
    .split("|")
    .map((seg) => {
      const compact = seg.trim().split(/\s+/).join("");
      return compact.length ? [...compact].join(" ") : "";
    })
    .join(" | ");
}

/**
 * Parse plain text format (one pattern per line)
 * Example:
 * K | k | k | K
 * A A | G G | A A
 * A | A | A | A
 *
 * If a line contains only characters without spaces or pipes,
 * it will be split into individual characters separated by spaces.
 * Example: "AAABBB" -> "A A A B B B"
 */
function parsePlainText(content: string): string[] {
  const lines = splitLines(content)
    .map(line => normalizeLine(line));

  if (lines.length === 0) {
    throw new Error(
      "No valid pattern lines found in file (all lines are empty or comments)"
    );
  }

  return lines;
}

/**
 * Parse JSON format
 * Expected structure:
 * {
 *   "grid": ["K | k | k | K", "A A | G G | A A", "A | A | A | A"]
 * }
 * or just an array:
 * ["K | k | k | K", "A A | G G | A A", "A | A | A | A"]
 */
function parseJSON(content: string): string[] {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Invalid JSON format: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error("JSON array is empty");
    }
    return data.map(line => normalizeLine(String(line)));
  } else if (data && typeof data === "object" && "grid" in data) {
    const grid = (data as { grid: unknown }).grid;
    if (!Array.isArray(grid)) {
      throw new Error("'grid' property must be an array");
    }
    if (grid.length === 0) {
      throw new Error("'grid' array is empty");
    }
    const validatedGrid = grid.map(line => normalizeLine(String(line)));
    return validatedGrid;
  } else {
    throw new Error(
      "Invalid JSON format. Expected array or object with 'grid' property"
    );
  }
}

/**
 * Parse CSV format (one row per line)
 * Cells are separated by commas
 * Example:
 * K,k,k,K
 * A A,G G,A A
 * A,A,A,A
 */
function parseCSV(content: string): string[] {
  const lines = splitLines(content)
    .map((line) => {
      // Convert CSV format to internal format with pipes
      return normalizeLine(line
        .split(",")
        .map((cell) => cell.trim())
        .join(" | "));
    })
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error(
      "No valid pattern lines found in CSV file (all lines are empty or comments)"
    );
  }

  return lines;
}
