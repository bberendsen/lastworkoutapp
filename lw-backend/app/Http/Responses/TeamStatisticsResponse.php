<?php

namespace App\Http\Responses;

use App\Services\UserXpService;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

final class TeamStatisticsResponse
{
    /**
     * @param  Collection<int, object>  $weeklyRows
     * @param  Collection<int, array{day: string, workouts: int, contributors: array<int, array{initials: string, label: string, workouts: int}>}>  $currentWeekByDay
     * @param  Collection<int, array{week_starts_at: string, week_ends_at: string, workouts: int}>  $weeklyTotals
     * @return array<string, mixed>
     */
    public static function from(
        int $totalWorkouts,
        int $workoutsThisWeek,
        int $totalXp,
        int $xpThisWeek,
        CarbonInterface $weekStart,
        CarbonInterface $weekEnd,
        Collection $weeklyRows,
        Collection $currentWeekByDay,
        Collection $weeklyTotals
    ): array {
        $rate = UserXpService::WORKOUT_XP;

        return [
            'total_workouts' => $totalWorkouts,
            'workouts_this_week' => $workoutsThisWeek,
            'total_xp' => $totalXp,
            'xp_this_week' => $xpThisWeek,
            'week_starts_at' => $weekStart->toIso8601String(),
            'week_ends_at' => $weekEnd->toIso8601String(),
            'weekly_ranking' => $weeklyRows->map(function (object $r) use ($rate): array {
                $w = (int) $r->workouts_this_week;

                return [
                    'user_id' => (string) $r->id,
                    'username' => $r->username,
                    'first_name' => $r->first_name,
                    'last_name' => $r->last_name,
                    'workouts_this_week' => $w,
                    'xp_this_week' => $w * $rate,
                ];
            })->values()->all(),
            'current_week_by_day' => $currentWeekByDay->values()->all(),
            'last_12_weeks' => $weeklyTotals->values()->all(),
        ];
    }
}
