"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTypes = generateTypes;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = __importDefault(require("glob"));
const child_process_1 = require("child_process");
const yaml_1 = __importDefault(require("yaml"));
const logger_1 = require("../utils/logger");
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
        (0, logger_1.log)((0, logger_1.red)("❌ jiboia.config.js not found in the current directory."));
        return;
    }
    const config = require(configPath);
    const { inputDir, outputDir, ignore = [] } = config;
    if (!fs_1.default.existsSync(inputDir)) {
        (0, logger_1.log)((0, logger_1.red)(`❌ Input directory not found: ${inputDir}`));
        return;
    }
    // Recursive glob pattern for .yaml and .yml files
    const yamlFiles = glob_1.default.sync("**/*.{yaml,yml}", { cwd: inputDir });
    if (!yamlFiles.length) {
        (0, logger_1.log)((0, logger_1.red)("✖ No .yaml or .yml files found on ➡️ " + inputDir));
        return;
    }
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    (0, logger_1.log)((0, logger_1.green)("✅ Loaded config"));
    (0, logger_1.log)(`📘 Parsed ${yamlFiles.length} .yaml/.yml files`);
    for (const file of yamlFiles) {
        if (ignore.includes(path_1.default.basename(file)))
            continue;
        const inputPath = path_1.default.join(inputDir, file);
        const yamlContent = fs_1.default.readFileSync(inputPath, "utf-8");
        if (!isOpenApiSpec(yamlContent)) {
            (0, logger_1.log)((0, logger_1.red)(`⚠️ Skipping ${file}: Not a valid OpenAPI 3.x spec.`));
            continue;
        }
        const outputPath = path_1.default.join(outputDir, file).replace(/\.(yaml|yml)$/, ".d.ts");
        // Ensure output directory exists
        fs_1.default.mkdirSync(path_1.default.dirname(outputPath), { recursive: true });
        (0, logger_1.log)(`🔄 Generating types for: ${file}`);
        try {
            (0, child_process_1.execSync)(`npx openapi-typescript "${inputPath}" -o "${outputPath}"`, {
                stdio: "inherit",
            });
        }
        catch (error) {
            (0, logger_1.log)((0, logger_1.red)(`❌ Failed to run openapi-typescript. Please install it by running:`));
            (0, logger_1.log)((0, logger_1.red)(`   npm install openapi-typescript --save-dev`));
            process.exit(1);
        }
    }
    (0, logger_1.log)((0, logger_1.green)("✅ Done"));
}
