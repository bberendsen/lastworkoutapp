<?php

namespace App\Http\Responses;

final class NotificationsListResponse
{
    /**
     * @param  list<array{id:string,type:string,title:string,body:string,event_datetime:?string,is_unread:bool,action_url:?string}>  $items
     * @return array{
     *   items:list<array{id:string,type:string,title:string,body:string,event_datetime:?string,is_unread:bool,action_url:?string}>,
     *   unread_count:int
     * }
     */
    public static function from(array $items): array
    {
        return [
            'items' => $items,
            'unread_count' => count(array_filter($items, fn (array $item): bool => (bool) ($item['is_unread'] ?? false))),
        ];
    }
}
