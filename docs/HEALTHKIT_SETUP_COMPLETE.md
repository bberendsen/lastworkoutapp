# HealthKit Integration - Setup Complete ✅

The HealthKit integration has been implemented! Here's what was done and what you need to do next.

## ✅ What's Been Implemented

### Backend Changes
- **`WorkoutController::store`** now accepts:
  - Optional `source` parameter (`manual` | `apple_health` | `watch`)
  - Optional `workout_datetime` parameter (ISO date string)
  - If not provided, defaults to `source: 'manual'` and `workout_datetime: now()`
- The "one workout per day" rule still applies (one per calendar day per user)

### Frontend Changes
- **Installed `@capgo/capacitor-health`** plugin
- **Installed `@capacitor/app`** plugin for app lifecycle events
- **Created `HealthService`** (`src/app/services/healthService.ts`):
  - Requests HealthKit authorization
  - Queries workouts from HealthKit
  - Syncs new workouts to your backend
  - Tracks last sync date to avoid duplicates
- **Updated `WorkoutService`** to support `source` and `workout_datetime` parameters
- **Updated `AppComponent`** to automatically sync HealthKit workouts:
  - When the app becomes active (user opens app or switches back)
  - On initial app load (after splash screen)

### iOS Configuration
- **Added HealthKit privacy descriptions** to `Info.plist`:
  - `NSHealthShareUsageDescription`: "Last Workout reads your workouts from Apple Health to automatically log them in the app."
  - `NSHealthUpdateUsageDescription`: "Last Workout does not write to Apple Health."

## 🔧 What You Need to Do Manually

### 1. Enable HealthKit Capability in Xcode

1. Open your iOS project in Xcode:
   ```bash
   cd lw-frontend
   npx cap open ios
   ```

2. Select the **App** target in the project navigator

3. Go to **Signing & Capabilities** tab

4. Click **+ Capability** button

5. Search for and add **HealthKit**

6. In the HealthKit capability settings:
   - ✅ Enable **HealthKit**
   - Optionally enable **Background Delivery** (for automatic sync when new workouts are added to HealthKit)

7. Save and close Xcode

### 2. Test the Integration

1. **Build and run the app** on a physical iOS device (HealthKit doesn't work in the simulator):
   ```bash
   npm run build
   npx cap sync ios
   npx cap run ios --target "Your iPhone Name"
   ```

2. **First time setup**:
   - When the app opens, it will request HealthKit authorization
   - Grant permission to read health data
   - The app will automatically sync workouts from the last 7 days

3. **Test workflow**:
   - Complete a workout on your Apple Watch or iPhone (using Fitness app or any app that writes to HealthKit)
   - Open the Last Workout app
   - The app should automatically detect and sync the new workout
   - Check your homescreen - you should see the workout logged!

## 📋 How It Works

1. **Onboarding (new users)**: After setting their weekly goal, users see a **Connect Apple Health** screen. On iPhone they can tap **Allow access** to open the system Health permission dialog, then **Continue** or **Skip for now**.
2. **First sync**: If they allow access, the app immediately syncs workouts from the last 7 days.
3. **When app opens/returns to foreground**: If HealthKit is available and was authorized, the app syncs new workouts since last sync.
4. **Deduplication**: The backend allows only one workout per calendar day per user; duplicate dates are skipped.
5. **Backend**: Workouts are stored with `source: 'apple_health'` and the workout's start date.
6. **Storage**: Last sync date is stored in localStorage so we don’t re-sync old workouts.

## 🐛 Troubleshooting

### HealthKit not syncing?
- Make sure you're testing on a **physical device** (not simulator)
- Check that HealthKit capability is enabled in Xcode
- Verify authorization was granted (check iOS Settings → Privacy & Security → Health → Last Workout app)
- Check browser console for errors

### Workouts not appearing?
- Ensure workouts are actually in Apple Health (check Health app)
- Verify the workout date is within the sync window (last 7 days or since last sync)
- Check backend logs to see if workouts are being posted
- The "one workout per day" rule applies - if you manually logged a workout today, HealthKit workouts for today will be skipped

### Want to force a full resync?
You can reset the last sync date:
```typescript
// In browser console or add a debug button
localStorage.removeItem('healthkit_last_sync_date');
```

## 📝 Next Steps (Optional Enhancements)

- Add a manual "Sync Now" button in settings
- Show sync status/loading indicator
- Add background sync support (requires Background Delivery capability)
- Filter workouts by type (running, cycling, etc.)
- Show which workouts came from HealthKit vs manual in the UI
