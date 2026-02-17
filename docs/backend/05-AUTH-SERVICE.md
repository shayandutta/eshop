# Auth Service – Registration, OTP, Validation

## Overview

- **Port**: 6001
- **Entry**: `apps/auth-service/src/main.ts`
- **Routes**: `/api/*` (auth router mounted at `/api`)

---

## Flow: User Registration

```
POST /api/register
  → auth.controller.userRegistration
  → validateRegistrationData(req.body, "user")
  → prisma.users.findUnique (check existing)
  → checkOtpRestrictions(email)
  → trackOtpRequests(email)
  → sendOtp(name, email, "user-activation-mail")
  → res.json({ message: "OTP sent..." })
```

---

## Validation (auth.helper)

### validateRegistrationData(data, userType)

- **user**: requires `name`, `email`, `password`
- **seller**: also requires `phone_number`, `country`
- Email validated with regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Throws `ValidationError` on failure

### checkOtpRestrictions(email)

Redis checks before sending OTP:

| Key | Meaning |
|-----|---------|
| `otp_lock:{email}` | Locked (e.g. too many failed attempts) |
| `otp_spam_lock:{email}` | Too many OTP requests (1h lock) |
| `otp_cooldown:{email}` | Must wait 60s between OTP requests |

Returns `next(ValidationError(...))` if restricted.

### trackOtpRequests(email)

- Key: `otp_request_count:{email}`
- If count ≥ 2: set `otp_spam_lock:{email}` (1h) and return ValidationError
- Otherwise: increment count (TTL 1h)

---

## OTP Flow (sendOtp)

1. Generate 4-digit OTP: `crypto.randomInt(1000, 9999)`
2. Send email via `sendEmail(email, "Verify Your Email", template, { name, otp })`
3. Store in Redis:
   - `otp:{email}` → OTP (TTL 300s)
   - `otp_cooldown:{email}` → `'true'` (TTL 60s)

---

## Strictness & Error Handling

- All validation throws `ValidationError` (400)
- `next(error)` used for async middleware (e.g. `checkOtpRestrictions`)
- Controller wraps logic in `try/catch` and passes errors to `next(error)`
- `errorMiddleware` (registered last) converts errors to JSON responses

---

## Routes

| Method | Path | Handler |
|--------|------|---------|
| POST | /api/register | userRegistration |

---

## Swagger

- Docs: `http://localhost:6001/api-docs`
- Config: `apps/auth-service/src/swagger.js` (swagger-autogen)
- Output: `swagger-output.json` (included as asset)
