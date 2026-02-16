# Email – Send Mail, EJS Templates

## Overview

- **Library**: nodemailer + ejs
- **Location**: `apps/auth-service/src/utils/send-mail/index.ts`
- **Templates**: `apps/auth-service/src/utils/email-templates/*.ejs`

---

## sendEmail(to, subject, templateName, data)

```ts
await sendEmail(email, "Verify Your Email", "user-activation-mail", { name, otp });
```

1. Load EJS template: `{templateName}.ejs`
2. Render with `data`
3. Send via nodemailer

---

## Template Path

```ts
path.join(process.cwd(), 'apps', 'auth-service', 'src', 'utils', 'email-templates', `${templateName}.ejs`)
```

- Must use `apps/auth-service` because the app runs from monorepo root.
- Templates live in `src/`, not `dist/`.

---

## SMTP Config

From `.env`:

```env
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="app-password"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
```

For Gmail: use an App Password, not the main password. The `from` field should be `"Name <email@example.com>"` (include closing `>`).

---

## Nodemailer Transport

```ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }
});
```

---

## sendOtp Argument Order

Correct call:

```ts
sendOtp(name, email, "user-activation-mail")
```

- `sendOtp(name: string, email: string, template: string)`
- Sends to `email`; `name` and `otp` are passed into the template.

---

## Template Example (user-activation-mail.ejs)

Receives: `{ name, otp }`. Use `<%= name %>` and `<%= otp %>` in EJS.
