<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Team extends Model
{
    public const GRADIENT_PRESETS = [
        'amber_emerald',
        'rose_violet',
        'sky_indigo',
        'ocean_teal',
        'sunset_orange',
        'midnight_purple',
    ];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'logo_url',
        'gradient_preset',
        'created_by',
    ];

    protected static function booted(): void
    {
        static::creating(function (Team $team): void {
            if (! $team->id) {
                $team->id = (string) Str::uuid();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_user')->withTimestamps();
    }

    public function joinRequests(): HasMany
    {
        return $this->hasMany(TeamJoinRequest::class);
    }

    public function workouts(): HasMany
    {
        return $this->hasMany(Workout::class);
    }

    /** Eager-load members with per-user workout counts attributed to this team. */
    public function loadMembersForDetail(): void
    {
        $teamId = $this->id;
        $this->load([
            'users' => fn ($q) => $q
                ->orderBy('username')
                ->withCount([
                    'workouts as team_workouts_count' => fn ($q2) => $q2->where('team_id', $teamId),
                ]),
        ]);
    }
}
