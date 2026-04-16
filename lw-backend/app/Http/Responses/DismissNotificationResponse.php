<?php

namespace App\Http\Responses;

final class DismissNotificationResponse
{
    /**
     * @return array{message:string}
     */
    public static function make(): array
    {
        return ['message' => 'Notification dismissed.'];
    }
}
