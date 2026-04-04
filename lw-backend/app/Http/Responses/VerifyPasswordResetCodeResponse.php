<?php

namespace App\Http\Responses;

final class VerifyPasswordResetCodeResponse
{
    /**
     * @return array<string, string>
     */
    public static function fromPlainToken(string $plainToken): array
    {
        return [
            'reset_token' => $plainToken,
        ];
    }
}
