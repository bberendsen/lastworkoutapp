# Agent notes — Last Workout (`lw`)

## Backend API shape (`lw-backend`)

When adding or changing Laravel HTTP endpoints:

1. **Form requests** — Put validation in dedicated classes under `app/Http/Requests/`, one concern per action (e.g. `SendPasswordResetCodeRequest`, `CompletePasswordResetRequest`). Controllers type-hint the request; use `$request->validated()` / `validated('key')` instead of inline `$request->validate()`.

2. **JSON responses** — Put stable response payloads in dedicated classes under `app/Http/Responses/`. Prefer `final` classes with static factories (e.g. `LoginApiResponse::from()`, `SendPasswordResetCodeResponse::make()`, `VerifyPasswordResetCodeResponse::fromPlainToken()`). Controllers return `response()->json(...)` with those arrays (and status codes for errors).

3. **Controllers** — Keep them thin: authorize via form requests / policies, delegate validation to requests, assemble responses from response classes, keep domain logic in services or models when it grows beyond a few lines.

4. **Naming** — Match action names: password reset uses `SendPasswordResetCodeRequest`, `VerifyPasswordResetCodeRequest`, `CompletePasswordResetRequest` and paired `*Response` / `*ErrorResponse` types.

Reference implementation: `app/Http/Controllers/PasswordController.php` and its `Requests` / `Responses` neighbors.
