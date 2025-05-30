import fs from 'fs';
import path from 'path';
import { log, green, red } from '../utils/logger';

const backendConfig = `module.exports = {
  inputDir: "./api-schemas",
  outputDir: "./generated-types",
  ignore: ["common.yaml"],
  emitClients: false,
  client: "fetch"
};
`;

export async function initBackend() {
  const configPath = path.resolve("jiboia.config.js");
  if (fs.existsSync(configPath)) {
    log(green("✅ jiboia.config.js already exists."));
    return;
  }

  fs.writeFileSync(configPath, backendConfig);
  log(green("✅ jiboia.config.js created."));
  log("📝 Please update it with your actual OpenAPI schema paths.");
} 