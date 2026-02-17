# Signup Page — Hooks, Handlers, and Flow (Beginner Friendly)

Source: [apps/user-ui/src/app/(routes)/signup/page.tsx](<apps/user-ui/src/app/(routes)/signup/page.tsx#L1-L240>)

This document explains the hooks, handler functions and the full flow used in the Sign Up page. It focuses on parts that differ from the Login page (so shared concepts like `useForm` basics and validation rules are omitted or referenced briefly).

---

## High-level flow

1. User fills the signup form (name, email, password) and submits.
2. `onSubmit` calls the `signupMutation.mutate(data)` (react-query) which posts to the backend.
3. On success, the mutation's `onSuccess` saves `userData`, shows the OTP UI, starts a resend timer, and disables resend for the cooldown period.
4. User enters OTP digits in 4 single-character inputs. Handlers manage input changes, focus movement, Backspace behavior and paste handling.
5. `resendOtp` (placeholder) can be used to request a new OTP; the timer prevents abusing resends.

---

## Hooks and state (line-by-line focused)

- `const [passwordVisible, setPasswordVisible] = useState(false);`
  - Purpose: UI toggle for showing/hiding password characters.
  - Use case: improves UX by letting users see what they typed.
  - Implementation note: toggles input `type` between `text` and `password`.

- `const [serverError, setServerError] = useState<string | null>(null);`
  - Purpose: hold server-level error messages returned from API calls (e.g., "Email already registered").
  - Use case: show a short message below the form when the backend returns an error.

- `const [showOtp, setShowOtp] = useState(false);`
  - Purpose: toggle whether to show the OTP verification UI or the signup form.
  - Flow: initially false (show form); set to true in mutation `onSuccess` to show OTP entry.

- `const [rememberMe, setRememberMe] = useState(false);`
  - Purpose: simple checkbox state; not critical to RHF here.
  - Use case: toggles whether the app should remember the user after login.

- `const [canResend, setCanResend] = useState(true);`
  - Purpose: whether user can click "Resend OTP".
  - Use case: prevents rapid repeated OTP requests; toggled to `false` immediately after sending OTP and set back after `timer` expires.

- `const [timer, setTimer] = useState(60);`
  - Purpose: countdown (seconds) for resend cooldown.
  - Use case: shows user how long until they can resend OTP.

- `const [otp, setOtp] = useState(['', '', '', '']);`
  - Purpose: store four OTP digits as strings in an array.
  - Use case: renders 4 single-character inputs whose `value` is bound to the corresponding `otp[index]`.
  - Implementation detail: storing as strings keeps leading zeros and makes slice/paste easy.

- `const [userData, setUserData] = useState<FormData | null>(null);`
  - Purpose: temporarily store the submitted signup form data (name, email, password).
  - Why: required when the server expects the email (or other data) again for OTP verification; also used for multi-stage flows.

- `const inputRefs = useRef<(HTMLInputElement | null)[]>([]);`
  - Purpose: keep references to OTP input DOM nodes to programmatically focus them.
  - Use case: when a digit is typed, focus moves to the next input; on Backspace in an empty input, focus moves to the previous input.
  - Why `useRef`: refs persist across renders without triggering re-renders (ideal for DOM nodes).

- `const router = useRouter();`
  - Purpose: Next.js navigation helper for redirecting on successful flows.

- `const { register, handleSubmit, formState: { errors } } = useForm<FormData>();`
  - Brief: form management and validation (already covered in login doc). Kept here because signup registers the `name` field additionally.

---

## Timer helper: `startResendTimer()`

What it does

- Creates an interval that decrements `timer` every second (`setInterval`).
- When `timer` reaches 1, it clears the interval, sets `canResend` to `true`, and returns 0 so the displayed timer shows 0.

Why this pattern

- Using a local `setInterval` with `setTimer(prev => prev - 1)` ensures correct repeated decrements even if React batches updates.
- Clearing the interval when reaching zero prevents leaked timers.

Use cases

- Provide visual cooldown to user after OTP sent.
- Prevents accidental or malicious rapid OTP requests.

Implementation caveat

- This function creates an interval each time it runs — ensure it gets called only when needed and the interval is cleared properly to avoid memory leaks.

---

## Network mutation: `signupMutation` (react-query useMutation)

Code structure

- `useMutation({ mutationFn: async (data: FormData) => axios.post(...), onSuccess: (_, formData) => { ... } })`.

Breakdown and reasons

- `useMutation` is chosen instead of calling `axios` directly because it provides:
  - automatic caching & deduplication controls (not often used for a signup, but consistent app pattern),
  - `isLoading` / `isError` / `isSuccess` flags for UI states,
  - easy `onSuccess`, `onError` callbacks for orchestrating follow-up logic.

`mutationFn`

- Posts the signup form to the server.
- Important: the frontend endpoint must match the gateway/back-end mount. In this code the correct path is `/api/v1/register` (or, if going through the gateway prefix `/auth`, the final path to call is `${NEXT_PUBLIC_SERVER_URI}/auth/api/v1/register`).

`onSuccess`

- Receives the server response and the original `formData` (as the second arg per react-query signature in this project).
- Actions performed:
  - `setUserData(formData)` — keep submitted info for verification step.
  - `setShowOtp(true)` — switch view to OTP input.
  - `setCanResend(false)` — disable immediate resend.
  - `setTimer(60)` — reset the cooldown timer.
  - `startResendTimer()` — begin countdown.

Why store `formData` here

- The OTP verification endpoint often needs the `email` (and sometimes password/name) to complete the account — storing `formData` avoids asking the user to re-enter it.

Error handling

- Not shown: add `onError` to map server errors to `serverError` or to `setError` (react-hook-form) for field-specific messages.

---

## Submission handler: `onSubmit` (form submit flow)

What it does

- Called by `handleSubmit(onSubmit)` from `react-hook-form`.
- Executes `signupMutation.mutate(data)` where `data` is the typed `FormData`.

Why this pattern

- Let `react-hook-form` handle client-side validation first, then hand validated data to react-query mutation which manages the async call and lifecycle.

Beginner tip

- Do not `await` the mutate call; use `onSuccess`/`onError` for follow-up logic. If you need to `await`, use `mutation.mutateAsync(data)` instead.

---

## OTP handlers

These functions manage the 4 separate single-character inputs for OTP. They cover typing, pasting, Backspace, focus movement and state updates.

### `handleOtpChange(index: number, value: string)`

Behavior (implemented in file)

1. If `value === ''` (user pressed Backspace and the input value becomes empty):
   - Update `otp[index]` to `''` and return early.
   - This is critical: earlier implementations that rejected non-digits would ignore `''`, making Backspace appear to do nothing.

2. For non-empty input (typing or paste):
   - Take `lastChar = value.slice(-1)` — this is robust for paste events where multiple characters might be present; using `slice(-1)` picks the last character typed/pasted.
   - If `lastChar` is not a digit (regex `/^[0-9]$/`) return (ignore invalid char).
   - Update `otp[index] = lastChar`.
   - Move focus to `inputRefs.current[index + 1]` if it exists (auto-advance).

Why this approach

- Allowing empty string lets Backspace clear the visible character and state.
- Accepting only the last character on paste makes paste behavior predictable: users can paste `1234` into the first box and only the last character ends up in that box; (optional improvement: implement full-paste fill that distributes digits across boxes — see suggestions later).
- Auto-advance improves UX: users type digits continuously.

Edge-cases handled

- Prevents non-digit characters.
- Prevents multiple-digit writes in a single slot by taking last char.

### `handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>)`

Behavior

- If the user presses `Backspace`, and the current `otp[index]` is empty, and `index > 0`, then focus moves to previous input: `inputRefs.current[index - 1]?.focus()`.

Why this matters

- When a user is at an empty slot and wants to delete the previous digit, pressing Backspace should move focus back and allow deletion there. This small UX detail is expected in OTP inputs.

Implementation note

- This handler only moves focus; the actual deletion on the previous field will happen via its own key or change event.

---

## `resendOtp()` (placeholder)

What it should do (recommended behavior)

1. Prevent immediate resend if `canResend` is false.
2. Call an endpoint like `/api/v1/forgot-password` or `/api/v1/resend-otp` with `userData.email`.
3. On success: set `canResend(false)`, reset `timer` to 60, call `startResendTimer()`.
4. On error: show server message via `setServerError`.

Why the placeholder exists

- The template reserves resend behavior but implementation depends on the backend route for resending OTP.

---

## Important beginner-level reasons for choosing certain patterns

- useState for simple UI state: local booleans and small pieces of state are perfectly suited for `useState`. They are easy to reason about and do not require external libraries.

- useRef for input DOM nodes: to call `.focus()` imperatively on the next/previous input without triggering re-renders; refs are the canonical choice for DOM access in React.

- react-hook-form for form state: it keeps form inputs uncontrolled (reading from DOM via refs), making forms performant and simpler for many inputs. It also integrates validation succinctly.

- react-query `useMutation` for async calls: isolates side effects (network calls) and provides `onSuccess` / `onError` lifecycle hooks that are ideal for multi-stage flows like signup→OTP.

---

## Full flow recap (implementation wiring)

1. User fills form; `react-hook-form` collects values and validates on submit.
2. `onSubmit` calls `signupMutation.mutate(formData)`.
3. `mutationFn` sends POST to the backend (must match gateway path). On success, backend usually returns a message like "OTP sent".
4. `onSuccess` receives `formData`, stores it in `userData`, shows OTP UI (`setShowOtp(true)`) and starts cooldown timer.
5. OTP UI: 4 inputs rendered. Each input value is `otp[index]` and they share handlers:
   - `onChange -> handleOtpChange(index, e.target.value)`
   - `onKeyDown -> handleOtpKeyDown(index, e)`
6. Entering digits auto-advances focus. Backspace clears and moves focus backward when needed.
7. After entering OTP digits, the UI should submit them together to a verify endpoint (not shown in the file; add a handler that collects `otp.join('')` and posts alongside `userData.email`).
8. `resendOtp()` should call backend to resend and restart cooldown.

---

## Practical improvements & suggestions

- Full OTP paste behavior: detect paste on the first input and distribute digits across the `otp` array (use `onPaste` handler). This is friendlier for users who copy a full OTP from email.

- Field-level validation: show an inline error if a pasted char is invalid. Use `setServerError` for server-level errors.

- Accessibility: add `aria-label` or `aria-labelledby` for each OTP input, use `input.id` and `label.htmlFor`, and set `input.inputMode='numeric'` to bring number keyboard on mobile.

- Debounce repeated focus changes if needed and avoid reading/writing state too eagerly — but current small logic is fine.

- If OTP length can vary, make `otp` array length a constant (e.g., `const OTP_LENGTH = 4`) and derive UI from it.

- Implement `resendOtp` with server call and map errors using react-query `useMutation` or `axios` + `setServerError`.

- `startResendTimer` could be made more robust by returning a cleanup function to cancel the interval on unmount.

---

## Example: verify submission (suggested handler — not implemented in source)

- Collect `const otpString = otp.join('')` and send `POST /api/v1/verify` with body `{ email: userData.email, otp: otpString, password: userData.password, name: userData.name }`.
- On success, redirect with `router.push('/')` or show success message.
- On server error, map field errors with `setServerError` or `setError` on react-hook-form.

---

## Deep dive: TanStack Query (react-query) and how it's used here

This project uses TanStack Query (commonly referenced as `react-query`) to manage asynchronous server interactions. Below is a focused explanation of concepts, how they are implemented in the signup page, and why we use them.

What TanStack Query provides (high-level)

- Declarative async state: `isLoading`, `isError`, `isSuccess`, `data` and `error` values for queries and mutations.
- Automatic caching and invalidation for GET-style queries (not used heavily for signup but useful elsewhere).
- Helper hooks for mutations (`useMutation`) that centralize network calls and lifecycle hooks (`onSuccess`, `onError`, `onSettled`).
- Built-in retrying, deduping and cancellation support.

Why `useMutation` is used for signup

- The signup flow is a write/side-effect (POST) operation, so `useMutation` is the appropriate tool. It helps orchestrate:
  - triggering the network request,
  - reporting loading/error state to UI,
  - running follow-up behavior (`onSuccess`) to show OTP UI and start timers,
  - wrapping and centralizing error handling.

How `useMutation` is wired in the signup page

- `mutationFn`: async function that performs the `axios.post(...)` call. It returns the server response body (`response.data`).
- `mutate(data)` vs `mutateAsync(data)`:
  - `mutate(data)` triggers the mutation and returns immediately; use `onSuccess`/`onError` callbacks for follow-up.
  - `mutateAsync(data)` returns a Promise and can be `await`ed when you prefer imperative control.
- `onSuccess`: called after the mutation resolves. The signup page uses this to:
  - store submitted `userData` (needed for verification),
  - show the OTP UI (`setShowOtp(true)`),
  - disable resend and start the cooldown timer.

Common `useMutation` options you might add

- `onError(error)`: map server errors to UI (e.g., `setServerError(error.message)` or `setError('email', { message: ... })`).
- `onSettled`: runs in both success/failure cases to perform cleanup (e.g., stop spinners).
- `retry`: control automatic retries on failure (defaults exist; often not needed for signup).

Error handling with axios + react-query

- Axios throws when the response status is outside 2xx. The thrown error object has `error.response.data` where backends typically put structured error messages.
- Best practice in this app:
  1. In `onError`, inspect `error.response?.data` and either `setServerError(...)` for global errors or `setError(field, { message })` to attach an error to a specific form field.
  2. The `packages/error-handler` on the backend formats errors consistently (see `AppError` subclasses), so the frontend can reliably parse `response.data.message` and `response.data.statusCode`.

Integration with react-hook-form

- Use `handleSubmit(onSubmit)` to validate client-side before triggering the mutation.
- In `onError`, convert server-side validation errors to RHF field errors using `setError(name, { message })` so errors appear under inputs.

Advanced: using a shared `queryClient`

- A `QueryClient` is normally created and provided at app root via `QueryClientProvider`.
- For signup you rarely need to invalidate cached GET queries, but in other flows you would call `queryClient.invalidateQueries('someKey')` in `onSuccess` to refresh data after a mutation.

---

## End-to-end network & gateway wiring (how frontend -> gateway -> service maps in this repo)

Files referenced in the repo:

- `apps/api-gateway/src/main.ts` — the gateway is an Express server that proxies certain paths to backend services.
  - It currently mounts `app.use('/auth', proxy('http://localhost:6001'))`, so requests to the gateway must use the `/auth` prefix to reach the auth service.
  - Example: `POST http://localhost:8080/auth/api/v1/register` => proxies to `http://localhost:6001/api/v1/register` on the auth service.
- `apps/auth-service/src/main.ts` — the auth service mounts `app.use('/api', authRouter)` where `authRouter` maps `/v1` to `auth.routes.ts`.
  - Full path for `register` route: `POST /api/v1/register` on the auth service.

How this affects the frontend

- The frontend uses `NEXT_PUBLIC_SERVER_URI` as a base host. If this points at the gateway (http://localhost:8080) then the frontend must call the gateway path (`/auth/...`) or the gateway must be configured to proxy `/api` paths as well.
- There are two main options:
  1. Frontend calls `http://localhost:8080/auth/api/v1/register` (preferred if gateway proxies `/auth`).
  2. Change gateway to proxy `/api` paths, then frontend can call `http://localhost:8080/api/v1/register`.

Headers, cookies and CORS

- The auth controller sets cookies (`setCookie(res, 'accessToken', ...)`) so consider:
  - Gateway must forward `Set-Cookie` properly (proxy config may need to preserve headers), and the frontend must call with `axios` `withCredentials: true` if cookies are used for auth.
  - CORS on auth service allows `origin: ['http://localhost:3000']` — when running via gateway, ensure gateway forwards requests in a way accepted by CORS or adjust the CORS origins accordingly.

---

## Backend error handling and how frontend should consume it

- The backend uses `packages/error-handler` with `AppError` subclasses (`ValidationError`, `AuthenticationError`, etc.).
- `error-middleware` formats these into `{ message, statusCode, details? }`.

Frontend parsing strategy (recommended)

1. In axios catch or `onError` of `useMutation`, check `err.response?.data`.
2. If `statusCode === 400` or `ValidationError`, either use `setError(field, { message })` or show `setServerError(message)`.
3. For other codes, show a general error or a retry option.

Example:

```ts
signupMutation = useMutation({
  mutationFn: async (data) => axios.post(url, data),
  onError: (err) => {
    const payload = err.response?.data;
    if (payload?.statusCode === 400 && payload.details?.field) {
      setError(payload.details.field, { message: payload.message });
    } else {
      setServerError(payload?.message || 'Unexpected error');
    }
  },
});
```

---

## Redis rules, OTP restrictions and rate limiting (how they affect flows)

- `apps/auth-service/src/middleware/auth.middleware.ts` implements OTP rate controls using Redis keys:
  - `otp_lock:${email}` — account lock after multiple failed attempts (30min).
  - `otp_spam_lock:${email}` — too many OTP requests (1 hour).
  - `otp_cooldown:${email}` — 60s cooldown between requests.
  - `otp_request_count:${email}` — increments and triggers spam lock when exceeding threshold.

Frontend implications

- The backend will return `ValidationError` messages when these locks exist. Show these messages to user (via `setServerError`) and disable resend UI appropriately.

---

## Small implementation / UX tips specific to this codebase

- Use `mutateAsync` if you need sequential imperative flow (e.g., after signup, immediately call verify in the same function).
- When calling gateway endpoints that set cookies, pass `axios.post(url, data, { withCredentials: true })` and ensure gateway/ backend `CORS` and proxy preserve credentials.
- For timers, clean up intervals on unmount using `useEffect(() => { return () => clearInterval(interval) })` when `startResendTimer` returns the interval id.

---

I added these explanations and practical integration notes to help you connect how `useMutation`, `axios`, the API gateway and auth service interact end-to-end. If you want, I can now:

- implement `resendOtp()` with a `useMutation` and proper error handling, and wire the verify OTP endpoint, or
- adjust the frontend base URL to always call the gateway path (`/auth/...`) and ensure `withCredentials` is used for cookies.

---

## Code references (where to find the implementation in this repo)

Below are the exact files and short code snippets from this repository that implement the concepts discussed above. Use these to quickly locate the code.

- Signup page (React + RHF + react-query)
  - File: [apps/user-ui/src/app/(routes)/signup/page.tsx](<apps/user-ui/src/app/(routes)/signup/page.tsx#L1-L240>)
  - Key snippets:
    - State, refs, and form setup:
      ```tsx
      const [otp, setOtp] = useState(['', '', '', '']);
      const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
      const {
        register,
        handleSubmit,
        formState: { errors },
      } = useForm<FormData>();
      ```
    - Mutation network call (axios + useMutation):
      ```ts
      const signupMutation = useMutation({
        mutationFn: async (data: FormData) => {
          const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/v1/register`, data);
          return response.data;
        },
        onSuccess: (_, formData) => {
          /* show OTP, start timer */
        },
      });
      ```
    - OTP handlers:
      ```ts
      const handleOtpChange = (index: number, value: string) => {
        /* accepts '' and digits */
      };
      const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        /* backspace focus */
      };
      ```

- API Gateway (proxies to auth-service)
  - File: [apps/api-gateway/src/main.ts](apps/api-gateway/src/main.ts#L1-L200)
  - Key snippet:
    ```ts
    // Connect auth service: /auth/* -> auth-service
    app.use('/auth', proxy('http://localhost:6001'));
    ```

- Auth service main (express mount)
  - File: [apps/auth-service/src/main.ts](apps/auth-service/src/main.ts#L1-L200)
  - Key snippet:
    ```ts
    // mount v1 router under /api
    app.use('/api', authRouter);
    ```

- Router wiring (v1)
  - File: [apps/auth-service/src/routes/index.ts](apps/auth-service/src/routes/index.ts#L1-L40)
  - Key snippet:
    ```ts
    const v1Router: Router = Router();
    v1Router.use('/v1', authRouter);
    export default v1Router;
    ```

- Auth routes (register, verify, login)
  - File: [apps/auth-service/src/routes/v1/auth.routes.ts](apps/auth-service/src/routes/v1/auth.routes.ts#L1-L80)
  - Key snippet:
    ```ts
    authRouter.post('/register', authMiddleware.validateRegistration, authMiddleware.checkOtpRestrictions, authMiddleware.trackOtpRequests, authController.userRegistration);
    authRouter.post('/verify', authMiddleware.validateVerifyBody, authController.verifyUser);
    authRouter.post('/login', authMiddleware.validateLoginBody, authController.loginUser);
    ```

- Auth controller (registration handler)
  - File: [apps/auth-service/src/controllers/auth.controller.ts](apps/auth-service/src/controllers/auth.controller.ts#L1-L120)
  - Key snippet:
    ```ts
    const userRegistration = async (req, res, next) => {
      const { name, email, password } = req.body;
      const result = await authService.authinitiateRegistrationService(name, email, password);
      res.status(200).json({ success: true, message: result.message });
    };
    ```

- Middleware: OTP restrictions and request tracking
  - File: [apps/auth-service/src/middleware/auth.middleware.ts](apps/auth-service/src/middleware/auth.middleware.ts#L1-L220)
  - Key snippets:

    ```ts
    // check for locks/cooldowns via redis keys
    if (await redis.get(`otp_lock:${email}`)) {
      return next(new ValidationError('Account locked'));
    }

    // track request counts
    await redis.set(otpRequestKey, String(count + 1), 'EX', 3600);
    ```

- Error handling package (AppError and middleware)
  - File: [packages/error-handler/index.ts](packages/error-handler/index.ts#L1-L200)
  - File: [packages/error-handler/error-middleware.ts](packages/error-handler/error-middleware.ts#L1-L200)
  - Key snippet (middleware):
    ```ts
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ message: err.message, statusCode: err.statusCode, ...(err.details && { details: err.details }) });
    }
    ```

- Where cookies are set (login flow example)
  - File: [apps/auth-service/src/controllers/auth.controller.ts](apps/auth-service/src/controllers/auth.controller.ts#L1-L200)
  - Key snippet:
    ```ts
    const response = await authService.loginUser(email, password);
    setCookie(res, 'accessToken', response.accessToken);
    setCookie(res, 'refreshToken', response.refreshToken);
    ```

If you want, I can expand any of the snippets above into a small walkthrough that traces one request end-to-end (frontend click → gateway proxy → auth route → controller → middleware → redis checks → response → frontend success/error handling). Tell me which path you'd like me to trace with annotated code steps.

---

## Where I saved this

- `docs/frontend/SIGNUP-HOOKS-FLOW.md`

If you'd like, I can:

- implement `resendOtp()` and verify submission (the verify endpoint), or
- add full-paste OTP filling, or
- include a minimal sample `onSuccess`/`onError` mapping using `setError`. Which should I do next?
