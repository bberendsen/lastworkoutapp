<?php

namespace App\Http\Controllers;

use App\Models\Workout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkoutController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $workout = Workout::create([
            'user_id' => $validated['user_id'],
            'workout_datetime' => now(),
            'source' => 'manual',
        ]);

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
