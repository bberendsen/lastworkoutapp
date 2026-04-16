<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'username',
        'first_name',
        'last_name',
        'birthdate',
        'email',
        'password',
        'has_subscription',
        'longest_streak',
        'xp',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'xp' => 'integer',
        ];
    }

    public function workouts()
    {
        return $this->hasMany(Workout::class);
    }

    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_user')
            ->withPivot('participates_in_challenges')
            ->withTimestamps();
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }

    public function notificationDismissals(): HasMany
    {
        return $this->hasMany(UserNotificationDismissal::class);
    }

    public function notificationReads(): HasMany
    {
        return $this->hasMany(UserNotificationRead::class);
    }

    protected static function booted()
    {
        static::creating(function ($user) {
            $user->id = (string) Str::uuid();
        });
    }
}
