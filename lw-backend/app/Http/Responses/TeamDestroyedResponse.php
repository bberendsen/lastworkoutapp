<?php

namespace App\Http\Responses;

final class TeamDestroyedResponse
{
    /**
     * @return array<string, string>
     */
    public static function make(): array
    {
        return [
            'message' => 'Team deleted.',
        ];
    }
}
