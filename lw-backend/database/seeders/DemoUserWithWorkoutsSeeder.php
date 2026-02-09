<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workout;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DemoUserWithWorkoutsSeeder extends Seeder
{
    public function run(): void
    {
        // 1️⃣ User aanmaken
        $user = User::create([
            'id' => (string) Str::uuid(),
            'username' => 'demo_user',
            'first_name' => 'Demo',
            'last_name' => 'User',
            'birthdate' => '1990-01-01',
            'email' => 'demo@example.com',
            'password' => Hash::make('password'),
            'has_subscription' => false,
        ]);

        // 2️⃣ 3 workouts, 3 dagen achter elkaar
        for ($i = 0; $i < 3; $i++) {
            Workout::create([
                'user_id' => $user->id,
                'workout_datetime' => Carbon::now()->subDays($i),
                'source' => 'manual',
            ]);
        }
    }
}
