# Signup Page — Line-by-line Annotated Code Explanations (Beginner Friendly)

Source: [apps/user-ui/src/app/(routes)/signup/page.tsx](<apps/user-ui/src/app/(routes)/signup/page.tsx#L1-L240>)

This document explains the signup page code literally, line-by-line, and includes a short "Foundations" primer for complete beginners. Read the Foundations first if you are new to React, TypeScript, HTTP or the libraries used.

---

Foundations (short primer)

- React basics
  - Components: functions that return JSX. Example: `const MyComp = () => <div />`.
  - `useState(initial)` stores local state. `const [x, setX] = useState(0)`.
  - `useRef()` stores a mutable object with `.current` that survives renders and doesn't trigger re-renders.
  - `useEffect(effect, deps)` runs side-effects; return a cleanup function.

- Controlled vs uncontrolled inputs
  - Controlled input: React state is the source of truth (`value={state}` + `onChange={...}`).
  - Uncontrolled input: the DOM stores the value; libraries like react-hook-form read values via refs when needed.

- Immutability
  - Clone arrays/objects before mutating: `const next = [...arr]; next[i] = v; setArr(next)`.

- TypeScript basics
  - `type FormData = { name: string; email: string }` declares the expected shape for objects.

- react-hook-form (RHF)
  - `register('field')` wires an input to RHF and optional validation rules.
  - `handleSubmit(onSubmit)` validates and calls `onSubmit(data)` with typed `data`.
  - `formState.errors` has validation messages.

- TanStack Query (`useMutation`)
  - `useMutation` manages POST-like side-effects: it accepts a `mutationFn` and callbacks (`onSuccess`, `onError`).
  - Trigger with `mutate(data)` (fire and rely on callbacks) or `mutateAsync(data)` (returns a Promise).

- axios basics
  - `axios.post(url, data)` sends JSON and returns a Promise resolving `response`; errors throw and include `error.response.data`.

- Gateway/proxy basics
  - If gateway proxies `/auth/*` to the auth service, the frontend must call the gateway path with `/auth` prefix for requests to reach the auth service.

- Cookies and CORS
  - For cookies to be sent/received, use `withCredentials: true` on axios/fetch and enable credentials in server CORS.

---

Now the code and literal explanations. For each block, I show the actual code (copied from the file) and then a line-by-line explanation.

1. Imports and type definitions

```tsx
'use client';
import GoogleButton from '@/shared/components/google-button';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { set, useForm } from 'react-hook-form';
import axios from 'axios';

type FormData = {
  name: string;
  email: string;
  password: string;
};
```

Line-by-line:

- `'use client';` — marks the file as a Next.js client component so hooks run in the browser.
- `GoogleButton` — UI component for Google auth.
- `useMutation` — TanStack Query hook used below to perform the signup POST and handle lifecycle.
- `Eye`, `EyeOff` — icons for the password visibility toggle.
- `Link` — Next.js link component for client-side navigation.
- `useRouter` — Next.js hook for programmatic navigation (`router.push`).
- `React, useRef, useState` — React core and hooks used throughout.
- `set, useForm` — `useForm` from react-hook-form (note: the `set` import looks unused and can be removed).
- `axios` — HTTP client used for POST calls.
- `type FormData` — TypeScript type for the form payload ensuring code is typed.

2. Component start and state/references

```tsx
const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
```

Line-by-line:

- `const SignUp = () => {` — starts the React functional component.
- `passwordVisible` — boolean showing whether password input should display text.
- `serverError` — string to display server messages below the form.
- `showOtp` — state deciding whether to show the OTP UI instead of the form.
- `rememberMe` — boolean for the Remember Me checkbox; not part of RHF here.
- `canResend` — whether the user can click "Resend OTP"; initially true.
- `timer` — countdown seconds used for resend cooldown, starts at 60.
- `otp` — array of four strings storing each OTP digit.
- `userData` — stores the form data returned to allow verify step to reuse email/password.
- `inputRefs` — array of refs to DOM input elements for programmatic `.focus()`.
- `router` — Next.js router for redirection.
- `useForm<FormData>()` — sets up react-hook-form; `register` connects inputs, `handleSubmit` validates and returns typed data on submit, `errors` contains validation errors.

3. Timer helper (startResendTimer)

```tsx
const startResendTimer = () => {
  const interval = setInterval(() => {
    setTimer((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setCanResend(true);
        return 0; // reset timer for next time
      }
      return prev - 1;
    });
  }, 1000);
};
```

Line-by-line:

- `startResendTimer` — function that starts a 1-second repeating interval.
- `setInterval` — sets up a timer that runs every 1000 ms (1s).
- `setTimer(prev => { ... })` — functional update reads the latest timer value and decrements it safely.
- `if (prev <= 1)` — when countdown finishes, clear interval, re-enable resend and set timer to 0.
- `clearInterval(interval)` — prevents the interval from continuing (avoids memory leak).
- `setCanResend(true)` — allows user to resend again.
- `return prev - 1` — otherwise decrement timer.

Note: This function does not return the interval id; a small improvement would be to return the id so a `useEffect` cleanup can clear it on unmount.

4. Signup mutation (useMutation)

```tsx
const signupMutation = useMutation({
  mutationFn: async (data: FormData) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/v1/register`, data);
    return response.data;
  },
  onSuccess: (_, formData) => {
    setUserData(formData);
    setShowOtp(true);
    setCanResend(false);
    setTimer(60);
    startResendTimer();
  },
});
```

Line-by-line:

- `useMutation({ ... })` — creates a mutation to perform the signup POST and handle result.
- `mutationFn` — the async function that performs the network call.
- ``axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/api/v1/register`, data)`` — sends form `data` to the configured server. `NEXT_PUBLIC_SERVER_URI` is an env var pointing to the gateway host.
- `return response.data` — resolve the mutation with the server response body.
- `onSuccess: (_, formData) => { ... }` — executed after success; the second arg (`formData`) is the variables used when calling `mutate` (some typed signatures vary).
- `setUserData(formData)` — store submitted data for the next step (verify with OTP).
- `setShowOtp(true)` — show the OTP UI.
- `setCanResend(false)` — disable resend until timer completes.
- `setTimer(60); startResendTimer()` — reset and start the resend cooldown.

Why use react-query here?

- It centralizes the async call, provides UI flags (if needed), and gives clean lifecycle hooks for handling success/failure.

5. onSubmit handler

```tsx
const onSubmit = (data: FormData) => {
  signupMutation.mutate(data);
};
```

Line-by-line:

- `onSubmit` receives `data` that RHF validated.
- `signupMutation.mutate(data)` triggers the mutation; follow-up logic happens in `onSuccess` or `onError`.

6. OTP handlers

```tsx
const handleOtpChange = (index: number, value: string) => {
  if (value === '') {
    const newOtp = [...otp];
    newOtp[index] = '';
    setOtp(newOtp);
    return;
  }

  const lastChar = value.slice(-1);
  if (!/^[0-9]$/.test(lastChar)) return;

  const newOtp = [...otp];
  newOtp[index] = lastChar;
  setOtp(newOtp);

  if (index < inputRefs.current.length - 1) {
    inputRefs.current[index + 1]?.focus();
  }
};

const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Backspace' && !otp[index] && index > 0) {
    inputRefs.current[index - 1]?.focus();
  }
};
```

Line-by-line (handleOtpChange):

- `handleOtpChange(index, value)` — called when the OTP input at `index` changes.
- `if (value === '')` — handles deletion: if the input becomes empty, update state accordingly and return.
- `const lastChar = value.slice(-1)` — take the last character from the input (robust for paste events).
- `if (!/^[0-9]$/.test(lastChar)) return;` — ignore non-digit characters.
- `const newOtp = [...otp]; newOtp[index] = lastChar; setOtp(newOtp);` — immutably update the OTP array.
- `if (index < inputRefs.current.length - 1) inputRefs.current[index+1]?.focus()` — auto-advance focus to next input.

Line-by-line (handleOtpKeyDown):

- `handleOtpKeyDown(index, e)` — runs for keydown events.
- `if (e.key === 'Backspace' && !otp[index] && index > 0)` — if current input is empty and user presses Backspace, move focus to previous input.
- `inputRefs.current[index - 1]?.focus()` — programmatically focus previous input.

Why these behaviors matter

- Without `value === ''` handling earlier, backspace-produced empty values were rejected and deletion didn't persist.
- Taking `lastChar` handles paste into a single field gracefully.

7. resendOtp, render and verify placeholders

```tsx
  const resendOtp = () => {}

  return (
    <div className="w-full pt-10 pb-20 min-h-[85vh] bg-gray-100">
      ...
      {!showOtp ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          /* name, email, password inputs registered with RHF */
        </form>
      ) : (
        <div>
          /* otp inputs mapped from `otp` array and `inputRefs` */
          <button className='w-full mt-4'>Verify OTP</button>
          <p>{canResend ? <button onClick={resendOtp}>Resend OTP</button> : `Resend OTP in ${timer}s`}</p>
        </div>
      )}
    </div>
  );
};

export default SignUp;
```

Line-by-line:

- `resendOtp` — placeholder; implement as a mutation that calls a resend endpoint, updates `canResend`/`timer` and handles errors.
- `return (...)` — top-level JSX; when `showOtp` is false show the form, otherwise show the OTP UI.
- OTP inputs: each input's `ref` is saved into `inputRefs.current[index]`, `value={otp[index]}`, `onChange` uses `handleOtpChange`, and `onKeyDown` uses `handleOtpKeyDown`.
- `Verify OTP` button should gather `otp.join('')` and call the verify endpoint with `userData.email` (not implemented in source).
- Resend UI shows a clickable button when allowed or a countdown string when disabled.

---

Quick references (where things live in repo):

- Signup component: `apps/user-ui/src/app/(routes)/signup/page.tsx`.
- Gateway: `apps/api-gateway/src/main.ts` (proxies `/auth/*` to auth-service).
- Auth router: `apps/auth-service/src/routes/v1/auth.routes.ts` (register/verify/login endpoints).
- Auth controller: `apps/auth-service/src/controllers/auth.controller.ts`.
- Middleware (otp restrictions): `apps/auth-service/src/middleware/auth.middleware.ts`.
- Error handling: `packages/error-handler/*`.

---

If you'd like deeper explanations for any single line or concept (for example, how `useRef` focusing works in the DOM, or how to parse axios errors and map them into `setError` for react-hook-form), tell me which line or topic and I'll expand it with examples and small diagrams.
