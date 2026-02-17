# Login Page — React Hook Form Explanation

This document explains the React Hook Form usage in the login page file:

- Source: [apps/user-ui/src/app/(routes)/login/page.tsx](apps/user-ui/src/app/(routes)/login/page.tsx#L1-L200)

Overview
- The page uses `react-hook-form` to manage form state and validation.
- Auxiliary UI state uses React `useState` for `passwordVisible`, `serverError`, and `rememberMe`.
- The `onSubmit` handler is currently a placeholder; it should call your auth API and handle navigation and server errors.

Line-by-line (code snippets and explanation)

1. 'use client';
   - Enables React client-side rendering for this Next.js app route (required for hooks like useState/useForm).

2. import GoogleButton ... import { useForm } from 'react-hook-form';
   - Imports components and the `useForm` hook which provides form helpers (`register`, `handleSubmit`, `formState`, etc.).

3. type FormData = { email: string; password: string; };
   - TypeScript type describing the form values. Passing this generic to `useForm<FormData>()` gives typed form values and helps with autocompletion.

4. const Login = () => {
   - The functional component for the login page.

5.   const [passwordVisible, setPasswordVisible] = useState(false);
   - Local UI state to toggle password input visibility.

6.   const [serverError, setServerError] = useState<string | null>(null);
   - Holds any error string returned from the server during submission.

7.   const [rememberMe, setRememberMe] = useState(false);
   - Tracks the checkbox state; this is not stored in react-hook-form and is handled separately as a regular piece of state.

8.   const router = useRouter();
   - Next.js `useRouter` for navigation after successful login (currently unused, but intended for redirecting).

9.   const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();
   - `useForm<FormData>()` returns several helpers; destructured here:
     - `register` — function that connects inputs to the RHF internal state and validation rules.
     - `handleSubmit` — wrapper that validates the form and passes typed data to `onSubmit` when valid.
     - `formState.errors` — an object containing validation errors for each field (if any).

10.  const onSubmit = (data: FormData) => { }
   - Submission callback passed to `handleSubmit`. `data` will be typed as `FormData`. Implement API call, error handling and redirect here.

FORM FIELDS

Email input block:
- `<input type="email" ... {...register('email', { required: 'Email is required', pattern: { value: /.../, message: 'Invalid email address' } })} />`
  - `register('email', rules)` does three main things:
    1. Registers the input under the `email` key in the form state.
    2. Attaches validation rules: `required` and a `pattern` regex for basic email validation.
    3. Returns `ref`, `onChange`, `onBlur` props (spread into the input) so RHF can manage value and validation.
  - If validation fails, `errors.email` will be set. The code displays the message via `{errors.email && <p>{String(errors.email.message)}</p>}`.

Password input block:
- The input toggles `type` between `password` and `text` using `passwordVisible`.
- It's registered with `register('password', { required: 'password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })`.
- `minLength` validation runs on submit/blurs and sets `errors.password` if it fails.
- A separate button toggles visibility using `setPasswordVisible(!passwordVisible)`.

Checkbox (Remember Me):
- Implemented with standard React state (`rememberMe`) rather than RHF. Either approach is fine; if you want RHF to manage it, register it (e.g., `register('rememberMe')`) and include it in your `FormData` type.

Form submit button and server error display:
- `<form onSubmit={handleSubmit(onFormSubmit)}>` wraps the form. `handleSubmit` validates all registered fields and only calls `onSubmit` with valid `data`.
- `onFormSubmit` should:
  1. Clear `serverError` (`setServerError(null)`).
  2. Call your auth API (e.g., `fetch`/`axios`) with `data` and optionally `rememberMe`.
  3. On success, redirect using `router.push('/some-route')`.
  4. On failure, set a useful `serverError` message via `setServerError(...)`.
- The component displays `serverError` under the submit button when present.

Notes, suggestions, and common patterns
- Resetting the form: use `const { reset } = useForm()` if you need to clear fields after success: `reset()`.
- Setting errors from server: use RHF's `setError` (from `useForm`) to attach server-side errors to specific fields:
  - Example: `setError('email', { type: 'server', message: 'Email not found' })`.
- Watching values: use `watch` from `useForm` for reactive logic based on field values.
- Controlled components / custom inputs: RHF's `Controller` can be used for third-party controlled components.
- Accessibility: ensure `aria-invalid` and `aria-describedby` map to the error element IDs for better a11y.

Implementation checklist (to finish `onSubmit`):
1. Clear previous errors: `setServerError(null)`.
2. Call auth API with `data` and `rememberMe`.
3. On success: store token/session, then `router.push('/')`.
4. On known field errors: use `setError('email', { message: '...' })`.
5. On unknown errors: `setServerError('Unexpected error...')`.

