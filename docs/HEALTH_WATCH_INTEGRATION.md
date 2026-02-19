# Integrating iPhone / Apple Watch Workouts

This guide outlines how to connect workouts completed on the iPhone (e.g. Fitness app) or Apple Watch to the Last Workout app so they are logged automatically.

You have two main integration options (they can be combined):

1. **HealthKit** – The iPhone app reads workout data from Apple Health. Workouts recorded on the Watch or iPhone (Fitness, third‑party apps) that write to HealthKit will show up here.
2. **WatchConnectivity** – The Watch app sends a “workout completed” message to the iPhone app, which then logs the workout to your backend. You already have a Watch app and `WatchSessionManager`; this extends that flow.

---

## Option 1: HealthKit integration (recommended for “any workout from Health”)

HealthKit is the central store for workouts on iOS. Many apps (Apple Fitness, Strava, etc.) write workouts there. Your iPhone app can read them and sync to your backend.

### 1. Backend: support external source and optional time

- In **`WorkoutController::store`**:
  - Accept optional `source` (e.g. `manual` | `apple_health` | `watch`) and optional `workout_datetime` (ISO string).
  - If `workout_datetime` is provided, use it; otherwise use `now()`.
  - Keep your “one workout per day” rule: either one per day per user regardless of source, or one manual + one `apple_health` per day (your choice; one per day total is simpler).
- Validate `source` against a whitelist and `workout_datetime` as a valid date.

### 2. iOS project: HealthKit capability and privacy

- In Xcode, select the **App** target → **Signing & Capabilities** → **+ Capability** → add **HealthKit**. Enable **HealthKit** and, if shown, **Background Delivery** (optional; for background sync).
- In **Info.plist** add:
  - **Privacy - Health Share Usage Description** (`NSHealthShareUsageDescription`): e.g. “Last Workout reads your workouts from Apple Health to log them in the app.”
  - **Privacy - Health Update Usage Description** (`NSHealthUpdateUsageDescription`): e.g. “Last Workout does not write to Health.” (or omit if you never write).

### 3. Capacitor: Health plugin

- Install a HealthKit-capable plugin, e.g. **`@capgo/capacitor-health`** (supports Capacitor 8 and read/write health data):
  ```bash
  npm install @capgo/capacitor-health
  npx cap sync ios
  ```
- In the plugin docs, request **read** authorization for **workouts** (and any other types you need). The exact type name may be `workout` or `workoutType` depending on the plugin.

### 4. Angular: Health service and sync logic

- Create a small **HealthService** (or extend an existing one) that:
  - Uses the Capacitor Health plugin to request authorization and read workouts in a time range (e.g. last 7 days or since last sync).
  - For each workout returned:
    - Checks if you already have a workout for that **date** for the current user (e.g. call your backend or compare with last-synced list).
    - If not, calls your backend `POST /workouts` with `source: 'apple_health'` and `workout_datetime` set to the Health workout’s start (or end) time.
- Run this sync:
  - When the app becomes active (e.g. in `AppComponent` or a guard that runs after login), and/or
  - On a timer (e.g. every 15–30 minutes) while the app is in foreground, and/or
  - Via background delivery (if you enabled it and the plugin supports it), so new HealthKit workouts trigger a sync when the app is woken.

### 5. Deduplication and “one per day”

- Backend: your existing “one workout per day” check should consider the **calendar day** of `workout_datetime` (in the user’s timezone or server timezone). Decide whether:
  - **Strict**: at most one workout per user per day (any source), or
  - **By source**: e.g. one `manual` and one `apple_health` per day.
- Client: before POSTing a Health workout for day D, you can avoid unnecessary 422s by checking your local list or a lightweight “has workout for date” endpoint if you add one.

---

## Option 2: WatchConnectivity (Watch → iPhone → backend)

Here the Watch app explicitly tells the iPhone app “a workout was completed,” and the iPhone app logs it to your API. You already have `WatchSessionManager` on the iPhone and a Watch app that sends messages.

### 1. Backend

- Same as Option 1: accept optional `source` and `workout_datetime` in `POST /workouts`. Use `source: 'watch'` for these entries.

### 2. Watch app: send “workout completed”

- When the user completes a workout in the Watch app (or the Watch detects completion via WorkoutKit/HealthKit), send a message to the iPhone, e.g.:
  ```swift
  // Example payload
  ["type": "workout_completed", "date": ISO8601 string or timestamp]
  ```
- Use `WCSession.default.sendMessage(_:replyHandler:errorHandler:)` (or transferUserInfo for delivery when the app is not immediately reachable).

### 3. iPhone app: receive and forward to backend

- In **`WatchSessionManager.session(_:didReceiveMessage:)`** (and, if you use it, `didReceiveUserInfo`), detect `type == "workout_completed"`.
- The native layer does **not** have your auth token or user ID. Two approaches:
  - **A. Notify the web layer (recommended)**  
    - From Swift, call into the Capacitor bridge (e.g. a custom Capacitor plugin that fires an event or returns data). The plugin exposes “workout completed (date)” to the TypeScript app.  
    - In Angular, listen for that event; get the current `userId` and auth token (from your auth service), then call `POST /workouts` with `source: 'watch'` and optional `workout_datetime`.
  - **B. Native HTTP**  
    - Store a limited backend token / user id in the Keychain (set from the web layer after login). In Swift, when you receive “workout completed,” build the request, add the token, and POST to your backend. More moving parts and security considerations.

### 4. Start Watch session from the iPhone

- So that the iPhone is ready to receive, call **`WatchSessionManager.shared.start()`** from the **iPhone** app (e.g. in **AppDelegate** `application(_:didFinishLaunchingWithOptions:)`), not only from the Watch. Your Watch app can still call it for its own session if needed, but the iPhone must activate the session to receive messages.

### 5. One workout per day

- Same as Option 1: backend enforces one per day (or your chosen rule). If the Watch sends multiple “workout completed” for the same day, the second POST can return 422 and the app can ignore or show “already logged.”

---

## Suggested order of implementation

1. **Backend** – Add optional `source` and `workout_datetime` to `POST /workouts` and keep a clear “one per day” rule.
2. **HealthKit (Option 1)** – Add capability, plugin, and Angular sync so any HealthKit workout can be synced. This covers Watch workouts that are written to Health by the system or other apps.
3. **WatchConnectivity (Option 2)** – If you want the Watch app itself to trigger logs (e.g. from a “Log workout” button or WorkoutKit), add the message from Watch and the Capacitor plugin + Angular handler on the iPhone.

If you tell me whether you prefer “HealthKit only,” “Watch only,” or “both,” I can turn this into a concrete task list (file-by-file) next.
