"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBackend = initBackend;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const backendConfig = `module.exports = {
  inputDir: "./api-schemas",
  outputDir: "./generated-types",
  ignore: ["common.yaml"],
  emitClients: false,
  client: "fetch"
};
`;
async function initBackend() {
    const configPath = path_1.default.resolve("jiboia.config.js");
    if (fs_1.default.existsSync(configPath)) {
        (0, logger_1.log)((0, logger_1.green)("✅ jiboia.config.js already exists."));
        return;
    }
    fs_1.default.writeFileSync(configPath, backendConfig);
    (0, logger_1.log)((0, logger_1.green)("✅ jiboia.config.js created."));
    (0, logger_1.log)("📝 Please update it with your actual OpenAPI schema paths.");
}
