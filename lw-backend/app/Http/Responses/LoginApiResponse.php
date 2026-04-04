<?php

namespace App\Http\Responses;

use App\Models\User;

final class LoginApiResponse
{
    /**
     * @return array<string, mixed>
     */
    public static function from(User $user, string $plainTextToken): array
    {
        return [
            'access_token' => $plainTextToken,
            'token_type'   => 'Bearer',
            'user'         => ShowUserResponse::from($user),
        ];
    }
}
