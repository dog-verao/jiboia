"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initFrontend = initFrontend;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const frontendConfig = `module.exports = {
  backendTypesPath: "../backend/generated-types"
};
`;
async function initFrontend() {
    const configPath = path_1.default.resolve("jiboia.config.js");
    if (fs_1.default.existsSync(configPath)) {
        (0, logger_1.log)((0, logger_1.green)("✅ jiboia.config.js already exists."));
        return;
    }
    fs_1.default.writeFileSync(configPath, frontendConfig);
    (0, logger_1.log)((0, logger_1.green)("✅ jiboia.config.js created."));
    (0, logger_1.log)("📝 Add this to your tsconfig.json:");
    (0, logger_1.log)(`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@api-types/*": ["../backend/generated-types/*"]
    }
  }
}`);
}
