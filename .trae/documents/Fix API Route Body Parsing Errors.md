I will fix the "Response body object should not be disturbed" and "useContext" errors in your API routes by refactoring how the request body is parsed. These errors typically occur in Next.js 15 when using `req.text()` on a request stream that has been touched by internal middleware or when using standard `Request` instead of `NextRequest`.

### Plan: Refactor API Routes to use `NextRequest`

I will update `delete-user`, `verify-user`, and `update-balance` routes to:
1.  **Import `NextRequest`**: Switch from standard `Request` to Next.js's `NextRequest`.
2.  **Use `req.json()`**: Replace the manual `req.text()` + `JSON.parse()` with the built-in `req.json()` method, which is safer and optimized for Next.js API routes.
3.  **Improve Error Handling**: Ensure JSON parsing errors are caught specifically.

**Files to be modified:**
1.  `frontend/src/app/api/admin/delete-user/route.ts`
2.  `frontend/src/app/api/admin/verify-user/route.ts`
3.  `frontend/src/app/api/admin/update-balance/route.ts`

This change follows Next.js best practices and resolves the stream locking issues.