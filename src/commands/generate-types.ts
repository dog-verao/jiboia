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

export async function generateTypes() {
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
    } catch (error) {
      log(red(`❌ Failed to run openapi-typescript. Please install it by running:`));
      log(red(`   npm install openapi-typescript --save-dev`));
      process.exit(1);
    }
  }

  log(green("✅ Done"));
} 