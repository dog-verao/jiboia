#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = __importDefault(require("glob"));
const child_process_1 = require("child_process");
const yaml_1 = __importDefault(require("yaml"));
const log = console.log;
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
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
    const configPath = path_1.default.resolve("jiboia.config.js");
    if (fs_1.default.existsSync(configPath)) {
        log(green("✅ jiboia.config.js already exists."));
        return;
    }
    fs_1.default.writeFileSync(configPath, backendConfig);
    log(green("✅ jiboia.config.js created."));
    log("📝 Please update it with your actual OpenAPI schema paths.");
}
async function initFrontend() {
    const configPath = path_1.default.resolve("jiboia.config.js");
    if (fs_1.default.existsSync(configPath)) {
        log(green("✅ jiboia.config.js already exists."));
        return;
    }
    fs_1.default.writeFileSync(configPath, frontendConfig);
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
function isOpenApiSpec(yamlStr) {
    try {
        const doc = yaml_1.default.parse(yamlStr);
        return (typeof doc === "object" &&
            doc !== null &&
            typeof doc.openapi === "string" &&
            doc.openapi.startsWith("3."));
    }
    catch {
        return false;
    }
}
async function generateTypes() {
    const configPath = path_1.default.resolve("jiboia.config.js");
    if (!fs_1.default.existsSync(configPath)) {
        log(red("❌ jiboia.config.js not found in the current directory."));
        return;
    }
    const config = require(configPath);
    const { inputDir, outputDir, ignore = [] } = config;
    if (!fs_1.default.existsSync(inputDir)) {
        log(red(`❌ Input directory not found: ${inputDir}`));
        return;
    }
    // Recursive glob pattern for .yaml and .yml files
    const yamlFiles = glob_1.default.sync("**/*.{yaml,yml}", { cwd: inputDir });
    if (!yamlFiles.length) {
        log(red("✖ No .yaml or .yml files found on ➡️ " + inputDir));
        return;
    }
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    log(green("✅ Loaded config"));
    log(`📘 Parsed ${yamlFiles.length} .yaml/.yml files`);
    for (const file of yamlFiles) {
        if (ignore.includes(path_1.default.basename(file)))
            continue;
        const inputPath = path_1.default.join(inputDir, file);
        const yamlContent = fs_1.default.readFileSync(inputPath, "utf-8");
        if (!isOpenApiSpec(yamlContent)) {
            log(red(`⚠️ Skipping ${file}: Not a valid OpenAPI 3.x spec.`));
            continue;
        }
        const outputPath = path_1.default.join(outputDir, file).replace(/\.(yaml|yml)$/, ".d.ts");
        // Ensure output directory exists
        fs_1.default.mkdirSync(path_1.default.dirname(outputPath), { recursive: true });
        log(`🔄 Generating types for: ${file}`);
        try {
            (0, child_process_1.execSync)(`npx openapi-typescript "${inputPath}" -o "${outputPath}"`, {
                stdio: "inherit",
            });
        }
        catch (error) {
            log(red(`❌ Failed to run openapi-typescript. Please install it by running:`));
            log(red(`   npm install openapi-typescript --save-dev`));
            process.exit(1);
        }
    }
    log(green("✅ Done"));
}
// --- Main Entry ---
(async function main() {
    log("🐍 Jiboia — the OpenAPI type sync tool\n");
    if (command === "init") {
        if (subcommand === "--backend") {
            await initBackend();
        }
        else if (subcommand === "--frontend") {
            await initFrontend();
        }
        else {
            log(red("❌ Invalid init command. Use --backend or --frontend."));
        }
    }
    else if (command === "generate") {
        await generateTypes();
    }
    else {
        log(red("❌ Unknown command. Use init or generate."));
    }
})();
