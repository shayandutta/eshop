````markdown
# Login Page — Line-by-line Annotated Code Explanations (Beginner Friendly)

Source: [apps/user-ui/src/app/(routes)/login/page.tsx](<apps/user-ui/src/app/(routes)/login/page.tsx#L1-L200>)

This document copies important blocks from the real source and explains each line in detail so you can understand how the form, validation and login request work.

---

1. Imports, types and component start

```tsx
'use client';
import GoogleButton from '@/shared/components/google-button';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
```
````

Explanation (line-by-line):

- `'use client';` — mark this component as client-side in Next.js so hooks run in the browser.
- `GoogleButton` — shared component for social sign-in.
- `useMutation` — react-query hook to perform and manage POST requests.
- `axios, AxiosError` — HTTP client and error type for typed error handling.
- `Eye, EyeOff` — icons used to toggle password visibility.
- `Link` and `useRouter` — Next.js helpers for navigation.
- `React, useState` — React and local state hook.
- `useForm` — react-hook-form's main hook to register inputs and validate.
- `type FormData` — TypeScript type describing the form shape; passed to `useForm<FormData>()` for typing.

2. State and form hookup

```tsx
const [passwordVisible, setPasswordVisible] = useState(false);
const [serverError, setServerError] = useState<string | null>(null);
const [rememberMe, setRememberMe] = useState(false);
const router = useRouter();

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>();
```

Explanation:

- `passwordVisible` controls whether the password input shows plain text.
- `serverError` stores a string returned by the backend to display to the user.
- `rememberMe` tracks that checkbox locally (not part of RHF here).
- `router` is used to redirect after success.
- `register` attaches inputs to RHF, `handleSubmit` validates and calls your submit handler, `errors` contains validation issues.

3. Login mutation (network call)

```tsx
const loginMutation = useMutation({
  mutationFn: async (data: FormData) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/login`, data, { withCredentials: true });
    return response.data;
  },
  onSuccess: (data) => {
    setServerError(null);
    router.push('/');
  },
  onError: (error: AxiosError) => {
    const errorMessage = (error.response?.data as { message?: string })?.message || 'Invalid credentials';
    setServerError(errorMessage);
  },
});
```

Explanation:

- `useMutation` centralizes the async POST and gives lifecycle hooks (`onSuccess`, `onError`).
- `withCredentials: true` ensures cookies (httpOnly) are sent/received across the gateway; important for session-based auth.
- `onSuccess` clears errors and redirects home.
- `onError` extracts a friendly message from `error.response?.data` and saves it to `serverError`.

4. onFormSubmit and form wiring

```tsx
const onFormSubmit = (data: FormData) => {
  loginMutation.mutate(data);
};
```

Explanation:

- `handleSubmit(onFormSubmit)` (in the JSX) will call this with validated `data` — typed as `FormData`.
- `loginMutation.mutate(data)` triggers the network call; while pending `loginMutation.isPending` can be used to disable the button.

5. Form inputs (key lines)

```tsx
<form onSubmit={handleSubmit(onFormSubmit)}>
  <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^[a-zA-Z0-9._%-+]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, message: 'Invalid email address' } })} />
  {errors.email && <p>{String(errors.email.message)}</p>}

  <input type={passwordVisible ? 'text' : 'password'} {...register('password', { required: 'password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })} />
  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)}>
    {passwordVisible ? <Eye /> : <EyeOff />}
  </button>

  <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />

  <button type="submit" disabled={loginMutation.isPending}>
    {loginMutation.isPending ? 'Logging in...' : 'Login'}
  </button>

  {serverError && <p>{serverError}</p>}
</form>
```

Explanation (high level):

- `register('field', rules)` wires the input to RHF and attaches validation rules. RHF returns refs and handlers which are spread into the input.
- Validation errors appear in `errors`, and messages are shown to the user.
- Visibility toggle is a `button` with `type="button"` to avoid submitting the form.
- `disabled={loginMutation.isPending}` prevents duplicates while awaiting the server.

---

If you want deeper explanations for any single line (e.g., how `withCredentials` works cross-domain, or how to move `rememberMe` into RHF), tell me which line and I'll expand further.

```

```
