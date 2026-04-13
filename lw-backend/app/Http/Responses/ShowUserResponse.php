<?php

namespace App\Http\Responses;

use App\Models\User;

final class ShowUserResponse
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
            'birthdate' => $user->birthdate,
            'email' => $user->email,
            'has_subscription' => (bool) $user->has_subscription,
            'xp' => (int) ($user->xp ?? 0),
        ];
    }
}
