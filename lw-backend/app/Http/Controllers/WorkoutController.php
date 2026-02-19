<?php

namespace App\Http\Controllers;

use App\Models\Workout;
use App\Services\StreakService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkoutController extends Controller
{
    public function __construct(
        private StreakService $streakService
    ) {
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'source' => 'sometimes|string|in:manual,apple_health,watch',
            'workout_datetime' => 'sometimes|date',
        ]);

        $source = $validated['source'] ?? 'manual';
        $workoutDatetime = isset($validated['workout_datetime']) 
            ? Carbon::parse($validated['workout_datetime'])
            : Carbon::now();

        // Check if user already has a workout for this calendar day
        $alreadyLoggedToday = Workout::where('user_id', $validated['user_id'])
            ->whereDate('workout_datetime', $workoutDatetime->toDateString())
            ->exists();

        if ($alreadyLoggedToday) {
            return response()->json([
                'message' => 'You can only log one workout per day.',
            ], 422);
        }

        $workout = Workout::create([
            'user_id' => $validated['user_id'],
            'workout_datetime' => $workoutDatetime,
            'source' => $source,
        ]);

        $this->streakService->updateLongestStreakIfNeeded($validated['user_id']);

        return response()->json($workout, 201);
    }

    public function latest($userId)
    {
        $workout = Workout::where('user_id', $userId)
            ->latest('workout_datetime')
            ->first();

        return response()->json($workout);
    }

    public function byUser($userId)
    {
        $workouts = Workout::where('user_id', $userId)
            ->orderBy('workout_datetime', 'desc')
            ->get();

        return response()->json($workouts);
    }

    public function leaderboard()
    {
        $leaderboard = DB::table('workouts')
            ->join('users', 'users.id', '=', 'workouts.user_id')
            ->select(
                'users.id',
                'users.username',
                DB::raw('MAX(workouts.workout_datetime) as last_workout')
            )
            ->groupBy('users.id', 'users.username')
            ->orderByDesc('last_workout')
            ->get();

        return response()->json($leaderboard);
    }
}
