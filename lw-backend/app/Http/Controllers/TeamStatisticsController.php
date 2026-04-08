<?php

namespace App\Http\Controllers;

use App\Http\Responses\TeamStatisticsResponse;
use App\Models\Team;
use App\Models\Workout;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TeamStatisticsController extends Controller
{
    public function show(Team $team): JsonResponse
    {
        $now = Carbon::now();
        $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $totalWorkouts = Workout::where('team_id', $team->id)->count();

        $workoutsThisWeek = Workout::where('team_id', $team->id)
            ->whereBetween('workout_datetime', [$weekStart, $weekEnd])
            ->count();

        $weeklyRows = DB::table('workouts')
            ->join('users', 'users.id', '=', 'workouts.user_id')
            ->where('workouts.team_id', $team->id)
            ->whereBetween('workouts.workout_datetime', [$weekStart, $weekEnd])
            ->select(
                'users.id',
                'users.username',
                'users.first_name',
                'users.last_name',
                DB::raw('count(*) as workouts_this_week')
            )
            ->groupBy('users.id', 'users.username', 'users.first_name', 'users.last_name')
            ->orderByDesc('workouts_this_week')
            ->get();

        return response()->json(TeamStatisticsResponse::from(
            $totalWorkouts,
            $workoutsThisWeek,
            $weekStart,
            $weekEnd,
            $weeklyRows
        ));
    }
}
