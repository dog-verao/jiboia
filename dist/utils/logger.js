"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.red = exports.green = exports.log = void 0;
exports.log = console.log;
const green = (msg) => `\x1b[32m${msg}\x1b[0m`;
exports.green = green;
const red = (msg) => `\x1b[31m${msg}\x1b[0m`;
exports.red = red;
