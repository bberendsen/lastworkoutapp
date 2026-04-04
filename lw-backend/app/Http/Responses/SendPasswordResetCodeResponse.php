<?php

namespace App\Http\Responses;

final class SendPasswordResetCodeResponse
{
    /**
     * @return array<string, string>
     */
    public static function make(): array
    {
        return [
            'message' => 'If an account exists for this email, a code was sent.',
        ];
    }
}
