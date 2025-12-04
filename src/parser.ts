import { readFileSync, existsSync } from "node:fs";
import { extname, resolve } from "node:path";

const SUPPORTED_EXTENSIONS = [".txt", ".csv", ".json"];

/**
 * Validate input file
 */
function validateInputFile(filePath: string): void {
  // Check if file exists
  if (!existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }

  // Check file extension
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file format: ${ext}\nSupported formats: ${SUPPORTED_EXTENSIONS.join(
        ", "
      )}`
    );
  }
}

/**
 * Parse input file and extract grid pattern lines
 * Supports: .txt, .csv, .json formats
 */
export function parseInputFile(filePath: string): string[] {
  // Validate file before reading
  validateInputFile(filePath);

  const ext = extname(filePath).toLowerCase();
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

  if (ext === ".json") {
    return parseJSON(content);
  } else if (ext === ".csv") {
    return parseCSV(content);
  } else {
    // Default: .txt or any other supported extension
    return parsePlainText(content);
  }
}

/**
 * Parse plain text format (one pattern per line)
 * Example:
 * K | k | k | K
 * A A | G G | A A
 * A | A | A | A
 */
function parsePlainText(content: string): string[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

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
    return data as string[];
  } else if (data && typeof data === "object" && "grid" in data) {
    const grid = (data as { grid: unknown }).grid;
    if (!Array.isArray(grid)) {
      throw new Error("'grid' property must be an array");
    }
    if (grid.length === 0) {
      throw new Error("'grid' array is empty");
    }
    return grid as string[];
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
  const lines = content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return "";
      // Convert CSV format to internal format with pipes
      return trimmed
        .split(",")
        .map((cell) => cell.trim())
        .join(" | ");
    })
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error(
      "No valid pattern lines found in CSV file (all lines are empty or comments)"
    );
  }

  return lines;
}
