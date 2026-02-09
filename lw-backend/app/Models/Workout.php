<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workout extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'workout_datetime',
        'source',
    ];

    protected $casts = [
        'workout_datetime' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
