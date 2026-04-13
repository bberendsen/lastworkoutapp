<?php

namespace App\Http\Responses;

use App\Models\User;

final class TeamMemberResponse
{
    /**
     * @return array<string, mixed>
     */
    public static function from(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'team_workouts_count' => (int) ($user->team_workouts_count ?? 0),
            'xp' => (int) ($user->xp ?? 0),
        ];
    }
}
