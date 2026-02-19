````markdown
# Forgot Password Page — Line-by-line Annotated Code Explanations (Beginner Friendly)

Source: [apps/user-ui/src/app/(routes)/forgot-password/page.tsx](<apps/user-ui/src/app/(routes)/forgot-password/page.tsx#L1-L400>)

This document copies important blocks from the forgot-password page and explains each line in depth so beginners can follow the flow: request OTP, verify, and reset password.

---

1. Imports, types and component start

```tsx
'use client';

import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

type FormData = {
  email: string;
  password: string;
};

const ForgotPassword = () => {
```
````

Explanation:

- `'use client';` — client-side component in Next.js required for hooks.
- `useMutation` — react-query's mutation hook for network actions (request OTP, reset password).
- `axios, AxiosError` — HTTP client and typed error handling.
- `Link`, `useRouter` — navigation helpers.
- `useRef, useState` — React hooks; `useRef` used to store OTP input DOM refs for focusing.
- `useForm` — react-hook-form for validating email and new password.
- `toast` — small UI notifications for success.

2. Local state and helpers

```tsx
const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
const [otp, setOtp] = useState(['', '', '', '']);
const [userEmail, setUserEmail] = useState<string | null>(null);
const [timer, setTimer] = useState(60);
const [canResend, setCanResend] = useState(true);
const [serverError, setServerError] = useState<string | null>(null);
const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
const router = useRouter();

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>();
```

Explanation:

- `step` controls which UI is shown: email form, otp inputs, or reset password form.
- `otp` stores individual digits so each digit can be its own input.
- `userEmail` remembers the email used for OTP requests, so later steps can reference it.
- `timer` and `canResend` implement resend cooldown.
- `inputRefs` holds DOM refs so we can programmatically focus next/previous OTP inputs.

3. Resend timer helper

```tsx
const startResendTimer = () => {
  const interval = setInterval(() => {
    setTimer((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setCanResend(true);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
```

Explanation:

- `startResendTimer` starts a 1-second interval that decrements `timer`.
- When `timer` reaches 0, it clears the interval and allows resending by setting `canResend` to `true`.

4. Request OTP mutation

```tsx
const requestOtpMutation = useMutation({
  mutationFn: async (email: string) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/forgot-password`, { email });
    return response.data;
  },
  onSuccess: (_, email) => {
    setUserEmail(email);
    setServerError(null);
    setStep('otp');
    setCanResend(false);
    setTimer(60);
    startResendTimer();
  },
  onError: (error: AxiosError) => {
    const errorMessage = (error.response?.data as { message?: string })?.message || 'Invalid Otp. Try again later.';
    setServerError(errorMessage);
  },
});
```

Explanation:

- Calls the `forgot-password` endpoint with `{ email }`.
- On success: saves the `email` locally, clears errors, moves UI to the `otp` step, disables resend and starts the cooldown.
- On error: extracts friendly message and sets it to `serverError`.

5. Reset password mutation

```tsx
const resetPasswordMutation = useMutation({
  mutationFn: async ({ password }: { password: string }) => {
    if (!password) return;
    const response = await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/reset-password`, {
      email: userEmail,
      otp: otp.join(''),
      newPassword: password,
    });
    return response.data;
  },
  onSuccess: () => {
    setStep('email');
    toast.success('Password reset successful. Please login with your new password.');
    setServerError(null);
    router.push('/login');
  },
  onError: (error: AxiosError) => {
    const errorMessage = (error.response?.data as { message?: string })?.message || 'Failed to reset password. Try again later.';
    setServerError(errorMessage);
  },
});
```

Explanation:

- Sends `email`, concatenated `otp` and `newPassword` to the `reset-password` endpoint.
- On success: shows a toast, clears errors and redirects to the login page.

6. OTP input logic (change and keydown handlers)

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

Explanation:

- `handleOtpChange`: accepts empty string to support Backspace clearing; otherwise takes last character (supports paste) and only accepts a digit; updates the OTP array immutably and focuses next input.
- `handleOtpKeyDown`: if Backspace pressed on an empty field, focus moves to previous input so the user can delete previous digit easily.

7. Form submission handlers

```tsx
const onSubmitEmail = ({ email }: { email: string }) => {
  requestOtpMutation.mutate(email);
};

const onSubmitPassword = ({ password }: { password: string }) => {
  resetPasswordMutation.mutate({ password });
};
```

Explanation:

- `onSubmitEmail` triggers the OTP request.
- `onSubmitPassword` triggers the reset with the current `otp` and `userEmail`.

8. JSX steps (what user sees)

- `step === 'email'`: shows an email input (registered with RHF) and a submit button that calls `requestOtpMutation`.
- `step === 'otp'`: shows 4 single-character inputs mapped from `otp`, a Verify OTP button (in source it's a simple handler that advances to reset), and a Resend OTP action controlled by `canResend` and `timer`.
- `step === 'reset'`: shows a new password input and a submit button that calls `resetPasswordMutation`.

---

If you'd like, I can also add small code examples showing how to wire `verifyOtp` as a `useMutation` (the source currently has that part commented) and how to test the flows locally with `curl` or `httpie` against the gateway endpoints.

```

```
