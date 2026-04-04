<?php

namespace App\Http\Responses;

final class VerifyPasswordResetCodeErrorResponse
{
    /**
     * @return array<string, string>
     */
    public static function invalidOrExpired(): array
    {
        return [
            'message' => 'Invalid or expired code. Request a new one.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function codeExpired(): array
    {
        return [
            'message' => 'This code has expired. Request a new one.',
        ];
    }
}
