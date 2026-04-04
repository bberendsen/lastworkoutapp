<?php

namespace App\Http\Responses;

final class CompletePasswordResetErrorResponse
{
    /**
     * @return array<string, string>
     */
    public static function invalidSession(): array
    {
        return [
            'message' => 'Invalid or expired reset session. Start again.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function resetTokenExpired(): array
    {
        return [
            'message' => 'This reset link has expired. Request a new code.',
        ];
    }
}
