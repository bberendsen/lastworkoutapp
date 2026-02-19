<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workout;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Bryan3UserWithWorkoutsSeeder extends Seeder
{
    public function run(): void
    {
        // 1️⃣ User aanmaken
        $user = User::create([
            'id' => (string) Str::uuid(),
            'username' => 'bryan3',
            'first_name' => 'bryan',
            'last_name' => 'berendsen',
            'birthdate' => '1994-01-01',
            'email' => 'berendsen@example.com',
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
