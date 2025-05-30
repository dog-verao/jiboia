#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
const backend_1 = require("./commands/backend");
const frontend_1 = require("./commands/frontend");
const generate_types_1 = require("./commands/generate-types");
const generate_paths_1 = require("./commands/generate-paths");
const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];
// --- Main Entry ---
(async function main() {
    (0, logger_1.log)("🐍 Jiboia — the OpenAPI type sync tool\n");
    if (command === "init") {
        if (subcommand === "--backend") {
            await (0, backend_1.initBackend)();
        }
        else if (subcommand === "--frontend") {
            await (0, frontend_1.initFrontend)();
        }
        else {
            (0, logger_1.log)((0, logger_1.red)("❌ Invalid init command. Use --backend or --frontend."));
        }
    }
    else if (command === "generate") {
        await (0, generate_types_1.generateTypes)();
        await (0, generate_paths_1.generatePaths)();
    }
    else {
        (0, logger_1.log)((0, logger_1.red)("❌ Unknown command. Use init or generate."));
    }
})();
