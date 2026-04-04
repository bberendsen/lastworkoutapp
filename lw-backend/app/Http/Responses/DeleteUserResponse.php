<?php

namespace App\Http\Responses;

final class DeleteUserResponse
{
    /**
     * @return array<string, string>
     */
    public static function make(): array
    {
        return [
            'message' => 'Your account has been deleted.',
        ];
    }
}
