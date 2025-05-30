"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePaths = generatePaths;
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
/**
 * Normalizes a path string into a valid TypeScript identifier
 */
function normalizePathKey(path) {
    return path
        .replace(/^\//, '') // remove leading slash
        .replace(/\//g, '_') // replace internal slashes
        .replace(/-/g, '_') // replace hyphens with underscores
        .replace(/{.*?}/g, match => match.slice(1, -1)); // remove {} from path params
}
/**
 * Extracts all paths from an OpenAPI schema file
 */
function extractPathsFromSchema(filePath) {
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf8');
        const doc = yaml_1.default.parse(content);
        if (!doc || !doc.paths) {
            return {};
        }
        const pathMap = {};
        Object.keys(doc.paths).forEach(route => {
            const key = normalizePathKey(route);
            pathMap[key] = route;
        });
        return pathMap;
    }
    catch (error) {
        console.error('Error extracting paths:', error);
        return {};
    }
}
/**
 * Generates paths.ts file for easier frontend consumption
 */
function generatePathsFile(allPaths, outputDir) {
    const pathsContent = `// Auto-generated paths for easy frontend consumption
export const paths = {
${Object.entries(allPaths)
        .map(([key, path]) => `  ${key}: "${path}",`)
        .join('\n')}
} as const;

// Type-safe handler access
export type HandlerKey = keyof typeof handlers;
export type HandlerPath = typeof handlers[HandlerKey];

// Helper function to get path with parameters
export function getPath<T extends HandlerKey>(
  handler: T, 
  params?: Record<string, string | number>
): string {
  let path = handlers[handler];
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(\`{\${key}}\`, String(value));
    });
  }
  
  return path;
}

// Export individual handlers for direct access
${Object.entries(allPaths)
        .map(([key, path]) => `export const ${key.toUpperCase()}_HANDLER = "${path}";`)
        .join('\n')}
`;
    fs_1.default.writeFileSync(path_1.default.join(outputDir, 'paths.ts'), pathsContent);
}
async function generatePaths() {
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
    let allPaths = {};
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
            // Extract paths from this schema file
            const filePaths = extractPathsFromSchema(inputPath);
            allPaths = { ...allPaths, ...filePaths };
        }
        catch (error) {
            (0, logger_1.log)((0, logger_1.red)(`❌ Failed to run openapi-typescript. Please install it by running:`));
            (0, logger_1.log)((0, logger_1.red)(`   npm install openapi-typescript --save-dev`));
            process.exit(1);
        }
    }
    // Generate the handlers.ts file for frontend consumption
    generatePathsFile(allPaths, outputDir);
    (0, logger_1.log)((0, logger_1.green)("✅ handlers.ts generated for easy frontend access"));
    (0, logger_1.log)((0, logger_1.green)("✅ Done"));
}
