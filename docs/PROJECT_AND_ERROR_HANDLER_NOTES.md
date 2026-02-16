# Eshop project – setup & error-handler notes

> **See also:** [00-START-HERE](00-START-HERE.md) for the full step-by-step guide, and [01-PROJECT-SETUP](01-PROJECT-SETUP.md) through [09-CONFIGURATION](09-CONFIGURATION.md) for detailed docs.

---

## Part 1: Project scaffolding & setup (step-by-step)

### 1. Initialise Nx workspace

- Create a new Nx monorepo (e.g. with **create-nx-workspace** or **npx create-nx-workspace**).
- Choose preset (e.g. **apps**, **ts**, **node**) and name (e.g. **eshop**).
- This creates root `package.json`, `nx.json`, `tsconfig.base.json`, and often `.github/workflows/ci.yml`.

**Typical command:**
```bash
npx create-nx-workspace@latest eshop
# Pick options: apps, npm, etc.
```

---

### 2. Add applications (auth-service, api-gateway)

- **auth-service**: Node/Express app (e.g. `@nx/express` or webpack-based).
- **api-gateway**: Another Node app; can use **esbuild** for build (faster, no webpack).

**Example (conceptual):**
```bash
nx g @nx/express:application auth-service --directory=apps/auth-service
nx g @nx/node:application api-gateway --directory=apps/api-gateway
# Or use Nx plugins / manual project.json + package.json
```

- **auth-service** gets `apps/auth-service/` with `project.json`, `webpack.config.js`, `src/main.ts`.
- **api-gateway** gets `apps/api-gateway/` with build/serve defined in `package.json` under `"nx": { "targets": { ... } }` (no separate `project.json` if using package.json config).

---

### 3. Workspace configuration (root)

- **package.json**
  - `"workspaces": ["apps/*"]` (and optionally `"packages/*"` if you add shared packages).
  - Script: `"dev": "nx run-many --target=serve --all"` so one command runs all serve targets.
    - Script: `"dev": "nx run-many --target=serve --all --configuration=development"` so one command runs all serve targets in **development** (sourcemaps, dev build for api-gateway).
    
- **nx.json**
  - Plugins (e.g. `@nx/js`, `@nx/webpack`, `@nx/jest`) and `targetDefaults` (e.g. `test`/`build` `dependsOn`).
  - Optional: `namedInputs.sharedGlobals` including `.github/workflows/ci.yml` so CI is part of Nx inputs.

---

### 4. Set ports per app

- **auth-service**: In `apps/auth-service/src/main.ts` use `process.env.PORT || 6001` (e.g. 6001).
- **api-gateway**: In `apps/api-gateway/src/main.ts` use `process.env.PORT || 8080` (e.g. 8080).
- Ports can also be set via env in `project.json`/`package.json` serve options if needed.

---

### 5. Proxy setup (api-gateway → auth-service)

- In **api-gateway** `src/main.ts`:
  - Install: `express-http-proxy`.
  - Mount proxy: `app.use('/auth', proxy('http://localhost:6001'))`.
- So `GET http://localhost:8080/auth/...` is forwarded to `http://localhost:6001/...`.
- Frontend (e.g. on 3000) talks to 8080; gateway forwards `/auth` to auth-service on 6001.

---

### 6. Shared code (e.g. error-handler)

- Create **packages/error-handler/** with `index.ts` (AppError + subclasses) and `error-middleware.ts`.
- No need for a separate package.json if consumed via relative path:
  - In auth-service: `import { errorMiddleware } from '../../../packages/error-handler/error-middleware';`
- Alternatively, add `packages/error-handler/package.json` and add to `workspaces` for `@eshop/error-handler` import.

---

### 7. Run everything

```bash
npm run dev
# Runs: nx run-many --target=serve --all --configuration=development
# Builds (development) then serves auth-service and api-gateway.
```

- **`--configuration=development`** ensures both apps use development build (e.g. api-gateway gets sourcemaps, not production optimisations).
- Use Nx TUI: press **1** / **2** to see per-app logs; **Enter** to expand output.

---

### Issues encountered & fixes

| Issue | Cause | Fix |
|-------|--------|-----|
| Only **1 serve task** (auth-service) | api-gateway not discovered or no serve target | Ensure api-gateway has `serve` in `package.json` under `"nx": { "targets": { "serve": { ... } } }` (or project.json). Nx discovers projects from config. |
| **auth-service build fails** (ENOENT) | Assets folder or email template path missing | Ensure `apps/auth-service/src/assets/` exists. For email templates, path must use `apps/auth-service` (see [06-EMAIL](06-EMAIL.md)). |
| **api-gateway build fails** (TS6133) | Unused imports (`swaggerUi`, `axios`) with `noUnusedLocals` | Remove unused imports or use them. |
| **api-gateway runs build:production** | `run-many --target=serve --all` doesn’t force development; build default can be production | Use `"dev": "nx run-many --target=serve --all --configuration=development"` so both apps serve (and build) in development. |
| **Cannot GET /api** on 8080 | No `/api` route on api-gateway | Use existing route (e.g. `/gateway-health`) or add `app.get('/api', ...)`. |
| **CI runs without you configuring it** | Nx scaffold adds `.github/workflows/ci.yml` | Delete or edit the file if you don’t want CI; otherwise it runs `lint`, `test`, `build`, `typecheck` on push/PR. |
| **Prisma DbNull** | Prisma bundled with esbuild | Add `@packages/libs/prisma` to esbuild `external` (see [02-BUILD-SYSTEM](02-BUILD-SYSTEM.md)). |
| **ioredis Unhandled error event** | Redis connection fails | Add `redis.on('error', ...)` in packages/libs/redis (see [07-REDIS](07-REDIS.md)). |
| **Email: No recipients defined** | Wrong sendOtp arg order | Use `sendOtp(name, email, template)` (see [06-EMAIL](06-EMAIL.md)). |
| **Serve shows “Waiting for task...”** | Nx TUI default message | Normal; task is running. Use keys 1/2 or Enter to see logs. |

---

### Useful commands (recap)

```bash
# Create workspace (once)
npx create-nx-workspace@latest eshop

# Add app (conceptual)
nx g @nx/express:application auth-service --directory=apps/auth-service

# Run all serves
npm run dev

# Build single project
npx nx build @eshop/auth-service
npx nx build @eshop/api-gateway

# List projects
npx nx show projects
```

---

## Part 2: Error middleware & AppError classes (notes)

### Error middleware (4-arg = error handler)

- **Signature:** `(err, req, res, next) => { ... }`
  - Express treats **4-parameter** middleware as **error-handling** middleware.
  - When any route/middleware calls `next(someError)`, Express runs this with `err` set.
- **Registration:** `app.use(errorMiddleware)` **after** routes so it catches errors from them.
- **Behaviour:**
  - If `err instanceof AppError`: log, then `res.status(err.statusCode).json({ message, statusCode, ...details })`.
  - Else: log as “Unhandled error”, respond with `500` and generic `"Internal server error"`, set `isOperational: false` in JSON.

---

### AppError (base class)

- **Extends** built-in `Error` so `instanceof AppError` works.
- **Fields:** `statusCode`, `isOperational`, optional `details` (all set in constructor, typically `readonly`).
- **Constructor:** `(message, statusCode, isOperational, details?)` → `super(message)`, assign fields, `Error.captureStackTrace(this)`.
- **Role:** Single “known error” type; middleware only sends `statusCode`/message/details for these.

---

### Child classes (caller passes only what varies)

- Child constructor takes **message** (with default) and optional **details**.
- **Fixed** values are passed inside the child via `super(message, statusCode, true, details)`:
  - **NotFoundError** → 404
  - **ValidationError** → 400
  - **AuthenticationError** → 401
  - **ForbiddenError** → 403
  - **DatabaseError** → 500 (e.g. `isOperational: false` in your current code)
  - **RateLimitError** → 429
- So **all** AppError constructor args are still passed; the **child** supplies status code and operational flag so the caller can’t get them wrong.

---

### Quick reference

| Class | HTTP | Use when |
|-------|------|----------|
| NotFoundError | 404 | Resource doesn’t exist |
| ValidationError | 400 | Invalid input |
| AuthenticationError | 401 | Not logged in / invalid or expired auth |
| ForbiddenError | 403 | Logged in but not allowed |
| DatabaseError | 500 | DB/operational server error |
| RateLimitError | 429 | Too many requests |

---

### Usage example

```ts
// In a route or service
if (!user) throw new NotFoundError('User not found');
if (!isValid(body)) throw new ValidationError('Invalid input', { fields: ['email'] });
if (!token) throw new AuthenticationError('Invalid or expired token');
```

Middleware then turns these into consistent JSON responses with the correct status code.

---

## Part 3: Error-handling practices

### Controller catch block: use `return next(error)`

In the controller’s catch block, forward errors to the error middleware:

```ts
try {
  const result = await authService.doSomething();
  res.json(result);
} catch (error) {
  return next(error);
}
```

- `return` avoids running more controller code and prevents double responses.
- `next(error)` sends the error to the 4-arg error middleware, which formats and sends the response.

---

### When a condition fails inside the try block

| Layer        | Use                     | Reason |
|-------------|-------------------------|--------|
| **Service** | `throw new ValidationError(...)` | Services have no `next`; they signal errors by throwing |
| **Controller** | `throw new ValidationError(...)` | The catch block receives it and calls `next(error)` |
| **Middleware** | `return next(new ValidationError(...))` | Middleware has `next`; call it directly and stop further logic |

**Controller example:**
```ts
try {
  if (!req.params.id) throw new ValidationError('ID required');
  const user = await authService.getUser(req.params.id);
  if (!user) throw new NotFoundError('User not found');
  res.json(user);
} catch (error) {
  return next(error);
}
```

**Middleware example:**
```ts
if (!emailRegex.test(email)) {
  return next(new ValidationError('Invalid email address'));
}
next();
```

---

### How `next(error)` reaches the error middleware

Express distinguishes error middleware by its **arity** (number of parameters):

- Regular middleware: `(req, res, next)` — 3 args
- Error middleware: `(err, req, res, next)` — 4 args

When you call `next(error)`:

1. Express treats it as an error (because an argument was passed).
2. It skips the rest of the normal middleware chain.
3. It finds the next 4-arg handler and invokes it with `(err, req, res, next)`.

**Middleware chain (auth-service):**
```
cors → express.json → cookieParser
  → routes (e.g. POST /api/register)
  → app.use(errorMiddleware)   ← registered last; 4-arg handler
```

The error middleware must be registered **after** all routes. Any `next(error)` from a route or earlier middleware will then reach it.
