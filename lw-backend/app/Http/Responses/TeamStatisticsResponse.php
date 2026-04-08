<?php

namespace App\Http\Responses;

use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

final class TeamStatisticsResponse
{
    /**
     * @param  Collection<int, object>  $weeklyRows
     * @return array<string, mixed>
     */
    public static function from(
        int $totalWorkouts,
        int $workoutsThisWeek,
        CarbonInterface $weekStart,
        CarbonInterface $weekEnd,
        Collection $weeklyRows
    ): array {
        return [
            'total_workouts' => $totalWorkouts,
            'workouts_this_week' => $workoutsThisWeek,
            'week_starts_at' => $weekStart->toIso8601String(),
            'week_ends_at' => $weekEnd->toIso8601String(),
            'weekly_ranking' => $weeklyRows->map(fn (object $r): array => [
                'user_id' => (string) $r->id,
                'username' => $r->username,
                'first_name' => $r->first_name,
                'last_name' => $r->last_name,
                'workouts_this_week' => (int) $r->workouts_this_week,
            ])->values()->all(),
        ];
    }
}
