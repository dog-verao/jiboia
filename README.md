# Jiboia 🐍

> Keep your frontend and backend **100% in sync** with auto-generated, strongly typed API clients — all powered by your OpenAPI spec.

---

## 🚀 What is Jiboia?

Jiboia is a developer tool that reads your backend's OpenAPI YAML files and generates:
- Typed request/response objects
- Fully typed client functions (fetch or axios)
- Enum-safe definitions
- Output ready to be consumed in your frontend app

No more:
- Manual contract translation
- Runtime surprises from mismatched types
- Tedious syncing between repos

---

## 🧠 Core Concepts

- You define the API schema in OpenAPI (`.yaml`)
- Joboia CLI reads it and generates:
  - TypeScript `.d.ts` files (types only)
  - Optional `.ts` files (typed client functions)
- You choose where to place the output:
  - Local folder
  - Push to GitHub repo
  - Publish to private npm

---


## 📦 Installation

Install Jiboia globally or use `npx`:

```bash
npm install -g jiboia
# or use it via npx
npx jiboia
```

## 🧱 Setup

# Backend

```bash
npx jiboia init --backend
```
This creates a jiboia.config.js file with the following default config:

```js
module.exports = {
  inputDir: "./api-schemas",
  outputDir: "./generated-types",
  ignore: ["common.yaml"],
  emitClients: false,
  client: "fetch"
};
```
Then, install the required dependency:
```bash
npm install --save-dev openapi-typescript
```
- ❗ This package is required in the backend project to convert OpenAPI YAML files to TypeScript types.

Make sure your api-schemas folder contains OpenAPI 3.x-compatible .yaml or .yml files.

# Frontend

```bash
npx jiboia init --frontend
```
This creates a jiboia.config.js file like this:

```js
module.exports = {
  backendTypesPath: "../backend/generated-types"
};
```

Add the following to your frontend project's tsconfig.json to use the backend types:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@api-types/*": ["../backend/generated-types/*"]
    }
  }
}
```
- Replace ../backend/generated-types/* with the actual relative path from your frontend to the backend generated-types folder.

## ⚙️ Usage

```bash
npx jiboia generate
```
This will:

- Load your jiboia.config.js

- Parse all OpenAPI .yaml or .yml files

- Generate .d.ts TypeScript files in the specified outputDir

- Skip any files listed in the ignore array

## ✅ Supported Features
Generate types from .yaml or .yml OpenAPI files
Ignore specific schema files
Use shared types across frontend and backend via path aliases
Colorful CLI logs for better feedback

## 🔍 Requirements
Node.js >= 16

Backend project must install openapi-typescript as a devDependency

```bash
npm install --save-dev openapi-typescript
```
## 💡 Tips
Restart your TypeScript server (Cmd+Shift+P → Restart TS Server) after adding path aliases.

Ensure your YAML files follow OpenAPI 3.x format, or the type generation will fail.

## 🐍 Why "Jiboia"?
Jiboia means boa constrictor in Portuguese — like the snake, this tool wraps around your API schema and keeps your types safe and tight. 🐍

## Local Testing:
npm run build
npm link

### backend
npm install --save-dev openapi-typescript
npm link jiboia
npx jiboia init --backend

```js
module.exports = {
  inputDir: "./apiv2/schemas",
  outputDir: "./generated-types",
  ignore: ["common.yaml"],
  emitClients: false,
  client: "fetch"
};
````
npx jiboia generate


### frontend
npx jiboia init --frontend
