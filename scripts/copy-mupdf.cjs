#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

// Resolve main entry of mupdf first
const mupdfMainPath = path.dirname(require.resolve("mupdf"));
// Construct the path to package.json from there
const mupdfPackageJsonPath = path.join(mupdfMainPath, "package.json");

// You probably don't directly need the package.json for the operations that follow,
// so I'm leaving the rest of the script unchanged:

const wasmPath = path.join(mupdfMainPath, "mupdf-wasm.wasm");
const jsPath = path.join(mupdfMainPath, "mupdf-wasm.js");

// Copy files to public directory
fs.copyFileSync(wasmPath, "./public/mupdf-wasm.wasm");
fs.copyFileSync(jsPath, "./public/mupdf-wasm.js");
