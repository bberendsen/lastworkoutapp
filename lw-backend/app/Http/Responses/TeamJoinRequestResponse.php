<?php

namespace App\Http\Responses;

use App\Models\TeamJoinRequest;

final class TeamJoinRequestResponse
{
    /**
     * @return array<string, mixed>
     */
    public static function from(TeamJoinRequest $request): array
    {
        $user = $request->user;

        return [
            'id' => $request->id,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'age' => $user->birthdate ? $user->birthdate->age : null,
            ],
        ];
    }
}
