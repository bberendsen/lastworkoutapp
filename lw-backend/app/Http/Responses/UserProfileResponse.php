<?php

namespace App\Http\Responses;

use App\Models\Team;
use App\Models\User;
use Carbon\CarbonInterface;

final class UserProfileResponse
{
    /**
     * @return array<string, mixed>
     */
    public static function from(
        User $user,
        ?Team $team,
        int $totalWorkouts,
        ?CarbonInterface $lastWorkoutAt,
        int $currentStreak,
        int $longestStreak
    ): array {
        $age = $user->birthdate ? $user->birthdate->age : null;

        return [
            'profile' => [
                'id' => $user->id,
                'username' => $user->username,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'age' => $age,
            ],
            'team' => $team ? [
                'id' => $team->id,
                'name' => $team->name,
                'gradient_preset' => $team->gradient_preset,
                'logo_url' => $team->logo_url,
            ] : null,
            'stats' => [
                'total_workouts' => $totalWorkouts,
                'last_workout_at' => $lastWorkoutAt?->toIso8601String(),
                'current_streak' => $currentStreak,
                'longest_streak' => $longestStreak,
            ],
        ];
    }
}
