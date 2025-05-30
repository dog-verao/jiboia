import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { execSync } from 'child_process';
import yaml from 'yaml';
import { log, green, red } from '../utils/logger';

/**
 * Check if a YAML string is an OpenAPI 3.x spec by verifying
 * presence of "openapi" root key with a value starting with "3."
 */
function isOpenApiSpec(yamlStr: string): boolean {
  try {
    const doc = yaml.parse(yamlStr);
    return (
      typeof doc === "object" &&
      doc !== null &&
      typeof doc.openapi === "string" &&
      doc.openapi.startsWith("3.")
    );
  } catch {
    return false;
  }
}

/**
 * Normalizes a path string into a valid TypeScript identifier
 */
function normalizePathKey(path: string): string {
  return path
    .replace(/^\//, '') // remove leading slash
    .replace(/\//g, '_') // replace internal slashes
    .replace(/-/g, '_') // replace hyphens with underscores
    .replace(/{.*?}/g, match => match.slice(1, -1)); // remove {} from path params
}

/**
 * Extracts all paths from an OpenAPI schema file
 */
function extractPathsFromSchema(filePath: string): Record<string, string> {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.parse(content);

    if (!doc || !doc.paths) {
      return {};
    }

    const pathMap: Record<string, string> = {};

    Object.keys(doc.paths).forEach(route => {
      const key = normalizePathKey(route);
      pathMap[key] = route;
    });

    return pathMap;
  } catch (error) {
    console.error('Error extracting paths:', error);
    return {};
  }
}

/**
 * Generates paths.ts file for easier frontend consumption
 */
function generatePathsFile(allPaths: Record<string, string>, outputDir: string) {
  const pathsContent = `// Auto-generated paths for easy frontend consumption
export const paths = {
${Object.entries(allPaths)
      .map(([key, path]) => `  ${key}: "${path}",`)
      .join('\n')}
} as const;

// Type-safe path access
export type PathKey = keyof typeof paths;
export type PathPath = typeof paths[PathKey];

// Helper function to get path with parameters
export function getPath<T extends PathKey>(
  path: T, 
  params?: Record<string, string | number>
): string {
  let path = paths[path];
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(\`{\${key}}\`, String(value));
    });
  }
  
  return path;
}

// Export individual path for direct access
${Object.entries(allPaths)
      .map(([key, path]) => `export const ${key.toUpperCase()}_PATH = "${path}";`)
      .join('\n')}
`;

  fs.writeFileSync(path.join(outputDir, 'paths.ts'), pathsContent);
}

export async function generatePaths() {
  const configPath = path.resolve("jiboia.config.js");
  if (!fs.existsSync(configPath)) {
    log(red("❌ jiboia.config.js not found in the current directory."));
    return;
  }

  const config = require(configPath);
  const { inputDir, outputDir, ignore = [] } = config;

  if (!fs.existsSync(inputDir)) {
    log(red(`❌ Input directory not found: ${inputDir}`));
    return;
  }

  // Recursive glob pattern for .yaml and .yml files
  const yamlFiles = glob.sync("**/*.{yaml,yml}", { cwd: inputDir });

  if (!yamlFiles.length) {
    log(red("✖ No .yaml or .yml files found on ➡️ " + inputDir));
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  log(green("✅ Loaded config"));
  log(`📘 Parsed ${yamlFiles.length} .yaml/.yml files`);

  let allPaths: Record<string, string> = {};

  for (const file of yamlFiles) {
    if (ignore.includes(path.basename(file))) continue;

    const inputPath = path.join(inputDir, file);
    const yamlContent = fs.readFileSync(inputPath, "utf-8");

    if (!isOpenApiSpec(yamlContent)) {
      log(red(`⚠️ Skipping ${file}: Not a valid OpenAPI 3.x spec.`));
      continue;
    }

    const outputPath = path.join(outputDir, file).replace(/\.(yaml|yml)$/, ".d.ts");

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    log(`🔄 Generating types for: ${file}`);
    try {
      execSync(`npx openapi-typescript "${inputPath}" -o "${outputPath}"`, {
        stdio: "inherit",
      });

      // Extract paths from this schema file
      const filePaths = extractPathsFromSchema(inputPath);
      allPaths = { ...allPaths, ...filePaths };

    } catch (error) {
      log(red(`❌ Failed to run openapi-typescript. Please install it by running:`));
      log(red(`   npm install openapi-typescript --save-dev`));
      process.exit(1);
    }
  }

  // Generate the paths.ts file for frontend consumption
  generatePathsFile(allPaths, outputDir);

  log(green("✅ paths.ts generated for easy frontend access"));
  log(green("✅ Done"));
}