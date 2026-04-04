<?php

namespace App\Http\Responses;

final class JoinRequestRejectedResponse
{
    /**
     * @return array<string, string>
     */
    public static function make(): array
    {
        return [
            'message' => 'Join request declined.',
        ];
    }
}
