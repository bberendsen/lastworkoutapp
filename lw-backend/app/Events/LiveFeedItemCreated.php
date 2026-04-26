<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveFeedItemCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param array<string, mixed> $item
     */
    public function __construct(public array $item) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('live-feed')];
    }

    public function broadcastAs(): string
    {
        return 'live-feed.item.created';
    }

    /**
     * @return array{item: array<string, mixed>}
     */
    public function broadcastWith(): array
    {
        return ['item' => $this->item];
    }
}
