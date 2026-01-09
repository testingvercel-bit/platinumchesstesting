The error `TypeError: Response body object should not be disturbed or locked` is caused by the custom Express server in `backend/src/index.ts` consuming the request body globally before Next.js processes it.

When `app.use(express.json())` and `app.use(express.urlencoded(...))` are used globally, they read the request stream for *every* incoming request. By the time the request reaches the Next.js handler (which you're calling via `req.text()` in your API routes), the stream is already drained/locked, causing the crash.

To fix this, we need to:
1.  **Remove the global body parsing middleware** from `backend/src/index.ts`.
2.  **Apply the middleware only to the specific Express routes** that need it (the PayFast payment routes).

This ensures that for all other routes (including your Next.js API routes like `update-balance`, `verify-user`, `delete-user`), the request body stream remains intact for Next.js to handle.

### Proposed Changes

**File:** `backend/src/index.ts`

```typescript
// Define middleware for specific routes
const bodyParser = [
  express.urlencoded({ extended: false }),
  express.json()
];

// Remove these global middlewares:
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());

// Apply to specific routes only:
app.post("/payments/deposit/form", ...bodyParser, async (req, res) => { ... });
app.post("/payments/payfast/notify", ...bodyParser, async (req, res) => { ... });
```

The `[TypeError: Cannot read properties of null (reading 'useContext')]` errors are likely side effects of the request failing mid-process or the client receiving an unexpected error response. Fixing the root cause (body parsing) should resolve the stability issues.
