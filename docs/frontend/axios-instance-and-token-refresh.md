# Axios instance and token refresh – explained

This doc explains `src/utils/axiosInstance.ts`: what it does, why it exists, and how it works line by line. No prior knowledge of axios or JWT is assumed.

---

## 1. Why this file exists

When you log in, the backend gives you two tokens:

- **Access token** – short-lived (e.g. 7 days in this app). The frontend sends it with **every API request** so the server knows who you are. It’s stored in an **HTTP-only cookie** (the browser sends it automatically; JavaScript cannot read it).
- **Refresh token** – also stored in an HTTP-only cookie. It’s used **only** to get a **new access token** when the current one expires.

If the access token expires and you don’t do anything, the next API call returns **401 Unauthorized**. Instead of sending the user to login on every 401, we:

1. Detect 401 on any request.
2. Call a **refresh-token** endpoint (with cookies; the backend reads the refresh token from the cookie).
3. Backend issues new cookies (new access + refresh).
4. **Retry the original request** that got 401.

The logic that does “on 401 → refresh → retry” lives in **axios response interceptors** on a **shared axios instance**. All API calls that need auth should use this instance so they all get this behavior automatically.

---

## 2. What is axios?

**Axios** is a library to send HTTP requests from the browser (or Node): GET, POST, etc. You can use the global `axios`:

```ts
axios.get('/api/users');
axios.post('/api/login', { email, password });
```

**Axios instance** = a configured copy of axios (e.g. base URL, default headers, interceptors). You create it with `axios.create({ ... })`. Every request made with that instance uses the same config and the same interceptors. So we create **one** instance, add the “on 401 → refresh → retry” logic to it, and export it. Anywhere we do `axiosInstance.get(...)` or `axiosInstance.post(...)`, we get automatic token refresh.

---

## 3. What are interceptors?

**Interceptors** are functions that run for every request (or every response) when you use that axios instance.

- **Request interceptor** – runs **before** the request is sent. You can change the request (e.g. add headers). Here we only pass the config through.
- **Response interceptor** – runs **after** the response is received. You can change the response or, on **error**, do something (e.g. refresh token and retry). That’s where our 401 handling lives.

So the flow is:

1. You call `axiosInstance.get('/api/something')`.
2. Request interceptor runs → request goes out (with cookies, because of `withCredentials: true`).
3. Server responds (e.g. 401).
4. Response interceptor runs. If 401, we call refresh, then retry the same request; otherwise we reject with the error.

---

## 4. Line-by-line breakdown (with code snippets)

### Imports and creating the instance

```ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});
```

- **`axios.create(...)`** – creates a new axios instance with the given config.
- **`baseURL`** – every request URL is relative to this (e.g. if baseURL is `https://api.example.com`, then `get('/users')` becomes `GET https://api.example.com/users`).
- **`withCredentials: true`** – the browser will send **cookies** for this origin with every request made by this instance, and will store any **Set-Cookie** headers the server sends. Without this, cookies are not sent, so the server would never see the access/refresh tokens.

---

### Shared state for refresh logic

```ts
let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];
```

- **`isRefreshing`** – “Is a refresh request in progress right now?” We only want **one** refresh at a time. If five API calls get 401 at once, we refresh once, then retry all five with the new token.
- **`refreshSubscribers`** – list of callbacks. Each callback means “when refresh finishes, retry this one request.” So when multiple requests get 401 while one refresh is in progress, we don’t start another refresh; we **queue** those requests (push a callback each). When the single refresh completes, we run all callbacks so each queued request is retried.

---

### Logout helper

```ts
//handle logout and prevent infinite refresh loop
const handleLogout = () => {
    if(window.location.pathname !== '/login'){
        window.location.href = '/login';
    }
}
```

- If refresh **fails** (e.g. refresh token expired or invalid), we redirect to `/login` so the user can log in again.
- **Why check pathname?** So we don’t redirect in a loop if we’re already on the login page (e.g. login request failed with 401). So: “if we’re not already on login, go to login.”

---

### Subscriber helpers (queue for retries)

```ts
//handle adding a new access token to queued requests
const subscribeTokenRefresh = (cb: () => void) => {
    refreshSubscribers.push(cb);
}

//execute queued requests after refresh
const subscriberTokenRefresh = () => {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
}
```

- **`subscribeTokenRefresh(cb)`** – add a callback to the queue. Each callback will **retry one** original request (by calling `axiosInstance(originalRequest)` in the interceptor).
- **`subscriberTokenRefresh()`** – called **after** a successful refresh. We run every queued callback (so every failed request is retried), then clear the array so we don’t retry them again later.

So: “While refresh is in progress, failed requests don’t trigger another refresh; they subscribe. When refresh succeeds, we run all subscribers so they retry.”

---

### Request interceptor

```ts
//handle API requests with custom interceptors
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error),
);
```

- **First function** – runs for every **successful** request config. We don’t change anything; we just return `config` so the request is sent as-is (with cookies already attached by `withCredentials`).
- **Second function** – runs if something throws before the request is sent. We just reject so the caller sees the error. So this interceptor is a no-op for normal requests; it’s there so we can add logic later (e.g. attach a header) if needed.

---

### Response interceptor – the 401 / refresh / retry logic

```ts
//handle expired tokens and refresh logic
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
```

- **First function** – for **successful** responses (2xx), we return the response unchanged.
- **Second function** – for **errors** (network error or HTTP error like 401). We get the **original request** from `error.config` so we can retry it later.

---

### Only act on 401, and only if we haven’t already retried

```ts
        //prevent infinite retry loop
        if(error.response.status === 401 && !originalRequest._retry){
```

- **`error.response.status === 401`** – the server said “Unauthorized” (usually = access token missing or expired).
- **`!originalRequest._retry`** – we haven’t already tried to refresh and retry this exact request. We’ll set `_retry = true` below so that if the **retried** request gets 401 again (e.g. refresh failed or token still invalid), we don’t retry again and again → **prevents infinite loop**.

If it’s not 401, or we already retried, we skip to `return Promise.reject(error)` at the end.

---

### Case A: Refresh is already in progress – queue this request

```ts
            if(isRefreshing){
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => {
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }
```

- **`isRefreshing === true`** – another request already got 401 and started a refresh. So we **don’t** start a second refresh.
- We **subscribe**: push a callback that, when run, will retry `originalRequest` with `axiosInstance(originalRequest)` and resolve the promise with that result.
- We **return a Promise** that will resolve when that callback runs (after refresh finishes). So this failed request “waits” until refresh is done, then is retried once.

---

### Case B: We are the first 401 – start refresh and retry

```ts
            originalRequest._retry = true;
            isRefreshing = true;
            try{
                await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URI}/auth/api/v1/refresh-token`, {}, {withCredentials: true});
                isRefreshing = false;
                subscriberTokenRefresh();
                return axiosInstance(originalRequest);
            }catch(refreshError){
                isRefreshing = false;
                refreshSubscribers = [];
                handleLogout();
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
)
```

- **`originalRequest._retry = true`** – mark this request as “we already tried refresh for this one,” so we won’t retry it again if it gets 401 again.
- **`isRefreshing = true`** – so any other 401 that happens while we refresh will go into the “if(isRefreshing)” branch and subscribe instead of starting another refresh.
- **`axios.post(..., {}, { withCredentials: true })`** – call the **refresh-token** endpoint. No body needed; the server reads the **refresh token from the cookie**. We use plain `axios` (not `axiosInstance`) so this call is **not** intercepted and doesn’t trigger our own 401 logic. Server responds with new cookies (Set-Cookie).
- **`isRefreshing = false`** – refresh done.
- **`subscriberTokenRefresh()`** – run all queued callbacks so every request that subscribed while we were refreshing gets retried.
- **`return axiosInstance(originalRequest)`** – retry the **current** request (the one that got 401). Now the browser has the new cookies, so this retry should succeed (or fail for a real reason, not “token expired”).
- **`catch(refreshError)`** – refresh failed (e.g. 401 from refresh endpoint = refresh token invalid/expired). We clear the queue, redirect to login, and reject with the **original** error so the caller doesn’t think the original request “succeeded.”

Finally, **`return Promise.reject(error)`** (the one outside the `if`) – for any error that is **not** 401, or is 401 but we already retried (`_retry` was true), we just reject so the caller sees the error.

---

### Export

```ts
export default axiosInstance;
```

Use this instance everywhere you need to call your API with auth (cookies). For example:

```ts
import axiosInstance from '@/utils/axiosInstance';

const data = await axiosInstance.get('/api/protected');
```

Those calls will automatically send cookies and, on 401, trigger refresh + retry once.

---

## 5. Use cases (when this runs)

| Situation | What happens |
|-----------|----------------|
| Normal API call, token valid | Request goes out with cookies → 200 → response returned. No interceptor “logic” for success path. |
| API call, access token expired (401) | Response interceptor sees 401, calls refresh (cookie with refresh token sent), gets new cookies, retries original request. User doesn’t see an error. |
| Several API calls at once, all get 401 | First one sets `isRefreshing`, starts refresh. Others subscribe. When refresh finishes, all are retried. Only one refresh request. |
| Refresh fails (e.g. refresh token expired) | `catch` runs: redirect to `/login`, clear queue, reject. User has to log in again. |
| Request fails for another reason (e.g. 404, 500) | Not 401, so we don’t refresh; we `Promise.reject(error)`. Caller handles the error. |

---

## 6. One diagram (flow)

```
You: axiosInstance.get('/api/me')
  → request interceptor (pass through)
  → GET /api/me (with cookies)
  → Server: 401 (access token expired)

Response interceptor:
  → Is it 401 and not already retried? Yes.
  → Is refresh in progress? No.
  → Set _retry = true, isRefreshing = true
  → POST /auth/api/v1/refresh-token (with cookies)
  → Server: 200 + Set-Cookie (new access + refresh)
  → isRefreshing = false, run subscribers
  → Retry: GET /api/me (with new cookies)
  → Server: 200
  → Return that response to you

You get the 200 as if the first request had succeeded.
```

---

## 7. Summary

- **What:** A shared axios instance that sends cookies on every request and, when the server returns 401, calls the refresh-token endpoint once, then retries the failed request(s).
- **Why:** So the app can keep using an expired access token transparently (refresh and retry) instead of forcing login on every 401.
- **How:** Response interceptor detects 401, uses a single in-flight refresh and a queue of “retry” callbacks, prevents infinite retry with `_retry`, and redirects to login if refresh fails.

Use `axiosInstance` for all authenticated API calls so this behavior is consistent across the app.


test1
test2