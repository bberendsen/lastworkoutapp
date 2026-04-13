<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserXpMilestoneAward extends Model
{
    protected $fillable = [
        'user_id',
        'milestone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
