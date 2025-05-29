#!/usr/bin/env node
import fs from "fs";
import path from "path";
import glob from "glob";
import { execSync } from "child_process";
import yaml from "yaml";

const log = console.log;
const green = (msg: string) => `\x1b[32m${msg}\x1b[0m`;
const red = (msg: string) => `\x1b[31m${msg}\x1b[0m`;

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

// --- Init Templates ---
const backendConfig = `module.exports = {
  inputDir: "./api-schemas",
  outputDir: "./generated-types",
  ignore: ["common.yaml"],
  emitClients: false,
  client: "fetch"
};
`;

const frontendConfig = `module.exports = {
  backendTypesPath: "../backend/generated-types"
};
`;

async function initBackend() {
  const configPath = path.resolve("jiboia.config.js");
  if (fs.existsSync(configPath)) {
    log(green("✅ jiboia.config.js already exists."));
    return;
  }

  fs.writeFileSync(configPath, backendConfig);
  log(green("✅ jiboia.config.js created."));
  log("📝 Please update it with your actual OpenAPI schema paths.");
}

async function initFrontend() {
  const configPath = path.resolve("jiboia.config.js");
  if (fs.existsSync(configPath)) {
    log(green("✅ jiboia.config.js already exists."));
    return;
  }

  fs.writeFileSync(configPath, frontendConfig);
  log(green("✅ jiboia.config.js created."));
  log("📝 Add this to your tsconfig.json:");
  log(`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@api-types/*": ["../backend/generated-types/*"]
    }
  }
}`);
}

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
 * - Removes leading slash
 * - Replaces internal slashes with underscores
 * - Replaces hyphens with underscores
 * - Removes curly braces from path parameters
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

    const map: Record<string, string> = {};

    // Extract paths from the OpenAPI schema
    Object.keys(doc.paths).forEach(route => {
      const key = normalizePathKey(route);
      map[key] = route;
    });

    return map;
  } catch (error) {
    console.error('Error extracting paths:', error);
    return {};
  }
}

async function generateTypes() {
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
      const foundPaths = extractPathsFromSchema(inputPath);
      allPaths = { ...allPaths, ...foundPaths };
    } catch (error) {
      log(red(`❌ Failed to run openapi-typescript. Please install it by running:`));
      log(red(`   npm install openapi-typescript --save-dev`));
      process.exit(1);
    }
  }

  // Create paths.ts
  const pathsFile = `// Auto-generated route map
export const paths = {
${Object.entries(allPaths)
      .map(([key, val]) => `  ${key}: "${val}",`)
      .join('\n')}
} as const;
`;

  fs.writeFileSync(path.join(outputDir, 'paths.ts'), pathsFile);
  log(green('✅ paths.ts generated'));

  log(green("✅ Done"));
}

// --- Main Entry ---
(async function main() {
  log("🐍 Jiboia — the OpenAPI type sync tool\n");

  if (command === "init") {
    if (subcommand === "--backend") {
      await initBackend();
    } else if (subcommand === "--frontend") {
      await initFrontend();
    } else {
      log(red("❌ Invalid init command. Use --backend or --frontend."));
    }
  } else if (command === "generate") {
    await generateTypes();
  } else {
    log(red("❌ Unknown command. Use init or generate."));
  }
})();
