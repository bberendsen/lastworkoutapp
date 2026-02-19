<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Workout;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class FiveExtraUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'username' => 'alice',
                'first_name' => 'Alice',
                'last_name' => 'Johnson',
                'birthdate' => '1992-05-15',
                'email' => 'alice@example.com',
                'workouts_count' => 5,
            ],
            [
                'username' => 'bob',
                'first_name' => 'Bob',
                'last_name' => 'Smith',
                'birthdate' => '1988-08-22',
                'email' => 'bob@example.com',
                'workouts_count' => 3,
            ],
            [
                'username' => 'charlie',
                'first_name' => 'Charlie',
                'last_name' => 'Brown',
                'birthdate' => '1995-11-10',
                'email' => 'charlie@example.com',
                'workouts_count' => 7,
            ],
            [
                'username' => 'diana',
                'first_name' => 'Diana',
                'last_name' => 'Prince',
                'birthdate' => '1990-03-20',
                'email' => 'diana@example.com',
                'workouts_count' => 4,
            ],
            [
                'username' => 'eve',
                'first_name' => 'Eve',
                'last_name' => 'Williams',
                'birthdate' => '1993-07-05',
                'email' => 'eve@example.com',
                'workouts_count' => 6,
            ],
        ];

        foreach ($users as $userData) {
            // User aanmaken of ophalen
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'id' => (string) Str::uuid(),
                    'username' => $userData['username'],
                    'first_name' => $userData['first_name'],
                    'last_name' => $userData['last_name'],
                    'birthdate' => $userData['birthdate'],
                    'password' => Hash::make('password'),
                    'has_subscription' => false,
                ]
            );

            // Workouts aanmaken
            $workoutsCount = $userData['workouts_count'];
            for ($i = 0; $i < $workoutsCount; $i++) {
                $workoutDate = Carbon::now()->subDays($i);
                Workout::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'workout_datetime' => $workoutDate,
                    ],
                    [
                        'source' => 'manual',
                    ]
                );
            }
        }
    }
}