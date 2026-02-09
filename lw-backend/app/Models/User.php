<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
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
    ];

    protected $hidden = [
        'password',
    ];

    public function workouts()
    {
        return $this->hasMany(Workout::class);
    }

    protected static function booted()
{
    static::creating(function ($user) {
        $user->id = (string) Str::uuid();
    });
}
}

