<?php

namespace App\Http\Controllers;

use App\Http\Responses\TeamStatisticsResponse;
use App\Models\Team;
use App\Models\Workout;
use App\Services\TeamXpService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TeamStatisticsController extends Controller
{
    public function __construct(
        private TeamXpService $teamXpService
    ) {}

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

        $weekWorkouts = DB::table('workouts')
            ->join('users', 'users.id', '=', 'workouts.user_id')
            ->where('workouts.team_id', $team->id)
            ->whereBetween('workout_datetime', [$weekStart, $weekEnd])
            ->select(
                'users.id as user_id',
                'workouts.workout_datetime',
                'users.first_name',
                'users.last_name',
                'users.username'
            )
            ->get();

        $daily = [
            'Mon' => ['workouts' => 0, 'contributors' => []],
            'Tue' => ['workouts' => 0, 'contributors' => []],
            'Wed' => ['workouts' => 0, 'contributors' => []],
            'Thu' => ['workouts' => 0, 'contributors' => []],
            'Fri' => ['workouts' => 0, 'contributors' => []],
            'Sat' => ['workouts' => 0, 'contributors' => []],
            'Sun' => ['workouts' => 0, 'contributors' => []],
        ];

        foreach ($weekWorkouts as $workout) {
            $day = Carbon::parse($workout->workout_datetime)->format('D');
            if (!array_key_exists($day, $daily)) {
                continue;
            }

            $first = strtoupper(substr((string) $workout->first_name, 0, 1));
            $last = strtoupper(substr((string) $workout->last_name, 0, 1));
            $initials = $first . $last;
            if ($initials === '') {
                $initials = strtoupper(substr((string) $workout->username, 0, 2));
            }
            if ($initials === '') {
                $initials = '??';
            }

            $daily[$day]['workouts']++;
            $userKey = (string) ($workout->user_id ?? $initials);
            if (!array_key_exists($userKey, $daily[$day]['contributors'])) {
                $daily[$day]['contributors'][$userKey] = [
                    'initials' => $initials,
                    'workouts' => 0,
                ];
            }
            $daily[$day]['contributors'][$userKey]['workouts']++;
        }

        $currentWeekByDay = collect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
            ->map(function (string $day) use ($daily): array {
                $contributors = collect($daily[$day]['contributors'])
                    ->map(fn (array $c): array => [
                        'initials' => (string) $c['initials'],
                        'workouts' => (int) $c['workouts'],
                    ])
                    ->sortByDesc('workouts')
                    ->values()
                    ->all();

                $seenInitials = [];
                $contributors = collect($contributors)->map(function (array $c) use (&$seenInitials): array {
                    $initials = $c['initials'];
                    $seenInitials[$initials] = ($seenInitials[$initials] ?? 0) + 1;
                    $c['label'] = $initials . $seenInitials[$initials];
                    return $c;
                })->all();

                return [
                    'day' => $day,
                    'workouts' => (int) $daily[$day]['workouts'],
                    'contributors' => $contributors,
                ];
            });

        $weeklyTotals = collect();
        for ($i = 11; $i >= 0; $i--) {
            $start = $weekStart->copy()->subWeeks($i);
            $end = $start->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
            $count = Workout::where('team_id', $team->id)
                ->whereBetween('workout_datetime', [$start, $end])
                ->count();
            $weeklyTotals->push([
                'week_starts_at' => $start->toIso8601String(),
                'week_ends_at' => $end->toIso8601String(),
                'workouts' => $count,
            ]);
        }

        $xpBreakdown = $this->teamXpService->breakdownForTeam($team);
        $xpThisWeek = $this->teamXpService->weeklyWorkoutXpByTeamIds([$team->id])[$team->id] ?? 0;

        return response()->json(TeamStatisticsResponse::from(
            $totalWorkouts,
            $workoutsThisWeek,
            (int) $xpBreakdown['total'],
            $xpThisWeek,
            $weekStart,
            $weekEnd,
            $weeklyRows,
            $currentWeekByDay,
            $weeklyTotals
        ));
    }
}
