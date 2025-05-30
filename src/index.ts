#!/usr/bin/env node
import { log, red } from './utils/logger';
import { initBackend } from './commands/backend';
import { initFrontend } from './commands/frontend';
import { generateTypes } from './commands/generate-types';
import { generatePaths } from './commands/generate-paths';

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

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
    await generatePaths();
  } else {
    log(red("❌ Unknown command. Use init or generate."));
  }
})();
