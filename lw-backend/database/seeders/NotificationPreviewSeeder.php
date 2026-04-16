<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\TeamChallengeCompletion;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Models\UserNotificationDismissal;
use App\Models\Workout;
use App\Services\NotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NotificationPreviewSeeder extends Seeder
{
    public function run(): void
    {
        $primaryUser = User::query()->orderBy('created_at')->first();
        if (! $primaryUser) {
            $this->command?->warn('No users found. Create a user first.');
            return;
        }

        $requester = $this->ensureUser('notif_requester');
        $supportA = $this->ensureUser('notif_support_a');
        $supportB = $this->ensureUser('notif_support_b');

        // Ensure preview can be seen again after using "clear".
        UserNotificationDismissal::query()->where('user_id', $primaryUser->id)->delete();

        $team = Team::query()->firstOrCreate(
            ['name' => 'Notification Preview Team'],
            [
                'gradient_preset' => 'sky_indigo',
                'created_by' => $primaryUser->id,
                'logo_url' => null,
            ]
        );

        if ((string) $team->created_by !== (string) $primaryUser->id) {
            $team->created_by = $primaryUser->id;
            $team->save();
        }

        $team->users()->syncWithoutDetaching([
            $primaryUser->id => ['participates_in_challenges' => true],
            $supportA->id => ['participates_in_challenges' => true],
        ]);

        TeamJoinRequest::query()->where('user_id', $requester->id)->delete();
        TeamJoinRequest::query()->firstOrCreate([
            'team_id' => $team->id,
            'user_id' => $requester->id,
        ]);

        TeamChallengeCompletion::query()->updateOrCreate(
            ['team_id' => $team->id, 'challenge_type' => 'consistency_kings'],
            ['completed_at' => now()->subHours(3)]
        );

        Workout::query()->where('user_id', $primaryUser->id)->where('source', 'notification_preview')->delete();
        Workout::query()->where('user_id', $supportA->id)->where('source', 'notification_preview')->delete();

        $currentWeekStart = CarbonImmutable::now()->startOfWeek();
        $previousWeekStart = $currentWeekStart->subWeek();

        // User XP delta: more workouts this week than last week.
        Workout::query()->create([
            'user_id' => $primaryUser->id,
            'team_id' => null,
            'workout_datetime' => $currentWeekStart->addDays(1)->setHour(8),
            'source' => 'notification_preview',
        ]);
        Workout::query()->create([
            'user_id' => $primaryUser->id,
            'team_id' => null,
            'workout_datetime' => $currentWeekStart->addDays(2)->setHour(8),
            'source' => 'notification_preview',
        ]);
        Workout::query()->create([
            'user_id' => $primaryUser->id,
            'team_id' => null,
            'workout_datetime' => $currentWeekStart->addDays(3)->setHour(8),
            'source' => 'notification_preview',
        ]);
        Workout::query()->create([
            'user_id' => $primaryUser->id,
            'team_id' => null,
            'workout_datetime' => $previousWeekStart->addDays(2)->setHour(8),
            'source' => 'notification_preview',
        ]);

        // Team XP delta: fewer workouts this week than last week.
        Workout::query()->create([
            'user_id' => $supportA->id,
            'team_id' => $team->id,
            'workout_datetime' => $currentWeekStart->addDays(1)->setHour(10),
            'source' => 'notification_preview',
        ]);
        Workout::query()->create([
            'user_id' => $supportA->id,
            'team_id' => $team->id,
            'workout_datetime' => $previousWeekStart->addDays(1)->setHour(10),
            'source' => 'notification_preview',
        ]);
        Workout::query()->create([
            'user_id' => $supportA->id,
            'team_id' => $team->id,
            'workout_datetime' => $previousWeekStart->addDays(2)->setHour(10),
            'source' => 'notification_preview',
        ]);
        Workout::query()->create([
            'user_id' => $supportA->id,
            'team_id' => $team->id,
            'workout_datetime' => $previousWeekStart->addDays(3)->setHour(10),
            'source' => 'notification_preview',
        ]);

        /** @var NotificationService $notificationService */
        $notificationService = app(NotificationService::class);
        $notificationService->recordJoinApproved($primaryUser, $team->name);
        $notificationService->recordJoinRejected($primaryUser, $team->name);

        // Keep helper users clean from accidental team membership.
        $supportB->teams()->detach();

        $this->command?->info('Notification preview data seeded for user: '.$primaryUser->username);
    }

    private function ensureUser(string $username): User
    {
        return User::query()->firstOrCreate(
            ['username' => $username],
            [
                'id' => (string) Str::uuid(),
                'first_name' => 'Notif',
                'last_name' => ucfirst(str_replace('_', ' ', $username)),
                'birthdate' => '1992-01-01',
                'email' => $username.'@example.com',
                'password' => bcrypt('password'),
                'has_subscription' => false,
            ]
        );
    }
}
