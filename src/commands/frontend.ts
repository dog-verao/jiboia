import fs from 'fs';
import path from 'path';
import { log, green } from '../utils/logger';

const frontendConfig = `module.exports = {
  backendTypesPath: "../backend/generated-types"
};
`;

export async function initFrontend() {
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