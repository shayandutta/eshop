# Build System – esbuild, Webpack, Bundling

## Overview

| App | Builder | Bundle | Output |
|-----|---------|--------|--------|
| **auth-service** | @nx/esbuild | Yes | `apps/auth-service/dist/main.js` |
| **api-gateway** | @nx/esbuild | No | `apps/api-gateway/dist/*.js` (transpiled) |

---

## auth-service (esbuild, bundled)

### Config: `apps/auth-service/project.json`

```json
"build": {
  "executor": "@nx/esbuild:esbuild",
  "options": {
    "platform": "node",
    "outputPath": "apps/auth-service/dist",
    "format": ["cjs"],
    "bundle": true,
    "main": "apps/auth-service/src/main.ts",
    "tsConfig": "apps/auth-service/tsconfig.app.json",
    "assets": [
      "apps/auth-service/src/assets",
      "apps/auth-service/src/swagger-output.json"
    ],
    "external": [
      "@prisma/client",
      "@prisma/client/*",
      "@packages/libs/prisma"
    ]
  }
}
```

### Why `external`?

- **Prisma**: Bundling Prisma leads to `TypeError: Cannot read properties of undefined (reading 'DbNull')` because the generated runtime (`runtime2.NullTypes.DbNull`) doesn't resolve correctly when inlined.
- **Solution**: Mark `@packages/libs/prisma` as external so it’s required at runtime from `packages/libs/prisma` and not bundled.

### Runtime

- Built app runs with `node -r tsconfig-paths/register -r ts-node/register apps/auth-service/dist/main.js`
- `tsconfig-paths/register`: resolves `@packages/*` to `packages/*`
- `ts-node/register`: lets Node load `.ts` files (e.g. Prisma lib)

### tsconfig.app.json

```json
"include": [
  "src/**/*.ts",
  "../../packages/**/*.ts"
]
```

Allows importing from `packages/` directly.

---

## api-gateway (esbuild, transpile only)

### Config: `apps/api-gateway/package.json` (nx targets)

```json
"build": {
  "executor": "@nx/esbuild:esbuild",
  "options": {
    "platform": "node",
    "outputPath": "apps/api-gateway/dist",
    "format": ["cjs"],
    "bundle": false,
    "main": "apps/api-gateway/src/main.ts",
    "tsConfig": "apps/api-gateway/tsconfig.app.json",
    "assets": ["apps/api-gateway/src/assets"]
  }
}
```

- `bundle: false`: esbuild only transpiles; output mirrors source structure.
- No Prisma/Redis; no externals needed.

---

## Webpack

- Webpack configs exist in some apps (e.g. `webpack.config.js`) but **are not used**.
- Current builds use **esbuild** via Nx.

---

## Build vs Serve

| Target | Action |
|--------|--------|
| `nx run auth-service:build` | Build to `dist/` |
| `nx run auth-service:serve` | Build (if needed) then run `node dist/main.js` |
| `nx run auth-service:build:production` | Build without sourcemaps |
