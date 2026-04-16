<?php

namespace App\Services;

use App\Enums\TeamChallengeType;
use App\Models\TeamJoinRequest;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\UserNotificationDismissal;
use App\Models\UserNotificationRead;
use App\Models\Workout;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * @return list<array{
     *   id:string,
     *   type:string,
     *   title:string,
     *   body:string,
     *   event_datetime:?string,
     *   is_unread:bool,
     *   action_url:?string
     * }>
     */
    public function listFor(User $user): array
    {
        $archiveBefore = CarbonImmutable::now()->subDays(30);
        $dismissedKeys = UserNotificationDismissal::query()
            ->where('user_id', $user->id)
            ->pluck('notification_key')
            ->all();
        $readKeys = UserNotificationRead::query()
            ->where('user_id', $user->id)
            ->pluck('notification_key')
            ->all();

        $items = collect();

        $items = $items
            ->concat($this->pendingJoinRequestsForTeamOwner($user))
            ->concat($this->storedDecisionNotifications($user))
            ->concat($this->teamChallengeNotifications($user))
            ->concat($this->weekOverWeekXpNotifications($user));

        $visibleItems = $items
            ->reject(fn (array $row): bool => in_array($row['id'], $dismissedKeys, true))
            ->reject(function (array $row) use ($archiveBefore): bool {
                $eventAt = $row['event_datetime'] ?? null;
                if (! is_string($eventAt) || $eventAt === '') {
                    return false;
                }

                return CarbonImmutable::parse($eventAt)->lt($archiveBefore);
            })
            ->map(function (array $row) use ($readKeys): array {
                $row['is_unread'] = ! in_array($row['id'], $readKeys, true);
                return $row;
            })
            ->sortByDesc(fn (array $row): int => isset($row['event_datetime']) && $row['event_datetime'] ? strtotime($row['event_datetime']) : 0)
            ->values()
            ->all();

        return $visibleItems;
    }

    public function dismiss(User $user, string $notificationKey): void
    {
        UserNotificationDismissal::query()->updateOrCreate(
            ['user_id' => $user->id, 'notification_key' => $notificationKey],
            ['dismissed_at' => now()]
        );
    }

    public function markRead(User $user, string $notificationKey): void
    {
        UserNotificationRead::query()->updateOrCreate(
            ['user_id' => $user->id, 'notification_key' => $notificationKey],
            ['read_at' => now()]
        );
    }

    public function recordJoinApproved(User $targetUser, string $teamName): void
    {
        UserNotification::query()->create([
            'user_id' => $targetUser->id,
            'type' => 'join_request_approved',
            'title' => 'Je verzoek is goedgekeurd',
            'body' => "Je bent geaccepteerd bij {$teamName}.",
            'meta' => ['team_name' => $teamName],
            'event_datetime' => now(),
        ]);
    }

    public function recordJoinRejected(User $targetUser, string $teamName): void
    {
        UserNotification::query()->create([
            'user_id' => $targetUser->id,
            'type' => 'join_request_rejected',
            'title' => 'Je verzoek is afgekeurd',
            'body' => "Je join-verzoek voor {$teamName} is afgekeurd.",
            'meta' => ['team_name' => $teamName],
            'event_datetime' => now(),
        ]);
    }

    /** @return Collection<int, array{id:string,type:string,title:string,body:string,event_datetime:?string,is_unread:bool,action_url:?string}> */
    private function pendingJoinRequestsForTeamOwner(User $user): Collection
    {
        $createdTeamIds = $user->teams()->where('teams.created_by', $user->id)->pluck('teams.id')->all();
        if (empty($createdTeamIds)) {
            return collect();
        }

        return TeamJoinRequest::query()
            ->whereIn('team_id', $createdTeamIds)
            ->with(['user:id,username', 'team:id,name'])
            ->orderByDesc('created_at')
            ->limit(25)
            ->get()
            ->map(function (TeamJoinRequest $request): array {
                $username = $request->user?->username ?? 'Iemand';
                $teamName = $request->team?->name ?? 'je team';
                return [
                    'id' => 'pending_request:'.$request->id,
                    'type' => 'join_request_new',
                    'title' => 'Nieuw verzoek om te joinen',
                    'body' => "{$username} wil joinen bij {$teamName}.",
                    'event_datetime' => optional($request->created_at)->toISOString(),
                    'is_unread' => true,
                    'action_url' => '/teams/'.(string) $request->team_id.'?tab=requests',
                ];
            });
    }

    /** @return Collection<int, array{id:string,type:string,title:string,body:string,event_datetime:?string,is_unread:bool,action_url:?string}> */
    private function storedDecisionNotifications(User $user): Collection
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->whereIn('type', ['join_request_approved', 'join_request_rejected'])
            ->orderByDesc('event_datetime')
            ->limit(50)
            ->get()
            ->map(fn (UserNotification $notification): array => [
                'id' => 'stored_notification:'.$notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'body' => $notification->body,
                'event_datetime' => optional($notification->event_datetime)->toISOString(),
                'is_unread' => true,
                'action_url' => null,
            ]);
    }

    /** @return Collection<int, array{id:string,type:string,title:string,body:string,event_datetime:?string,is_unread:bool,action_url:?string}> */
    private function teamChallengeNotifications(User $user): Collection
    {
        $teamId = $user->teams()->pluck('teams.id')->first();
        if (! $teamId) {
            return collect();
        }

        $rows = \DB::table('team_challenge_completions')
            ->join('teams', 'teams.id', '=', 'team_challenge_completions.team_id')
            ->where('team_challenge_completions.team_id', $teamId)
            ->orderByDesc('team_challenge_completions.completed_at')
            ->limit(25)
            ->get([
                'team_challenge_completions.id',
                'team_challenge_completions.challenge_type',
                'team_challenge_completions.completed_at',
                'teams.name as team_name',
            ]);

        return collect($rows)->map(function (object $row): array {
            $challengeType = TeamChallengeType::from((string) $row->challenge_type);
            return [
                'id' => 'challenge_completion:'.(string) $row->id,
                'type' => 'team_challenge_completed',
                'title' => 'Team challenge behaald',
                'body' => sprintf('%s behaalde "%s" (+%d XP).', (string) $row->team_name, $challengeType->title(), $challengeType->xpReward()),
                'event_datetime' => CarbonImmutable::parse((string) $row->completed_at)->toISOString(),
                'is_unread' => true,
                'action_url' => null,
            ];
        });
    }

    /** @return Collection<int, array{id:string,type:string,title:string,body:string,event_datetime:?string,is_unread:bool,action_url:?string}> */
    private function weekOverWeekXpNotifications(User $user): Collection
    {
        $now = CarbonImmutable::now();
        $currentWeekStart = $now->startOfWeek();
        $previousWeekStart = $currentWeekStart->subWeek();
        $previousWeekEnd = $currentWeekStart->subSecond();

        $currentWeekWorkouts = Workout::query()
            ->where('user_id', $user->id)
            ->where('workout_datetime', '>=', $currentWeekStart)
            ->count();
        $previousWeekWorkouts = Workout::query()
            ->where('user_id', $user->id)
            ->whereBetween('workout_datetime', [$previousWeekStart, $previousWeekEnd])
            ->count();

        $items = collect();
        if ($currentWeekWorkouts !== $previousWeekWorkouts) {
            $items->push([
                'id' => 'user_xp_delta',
                'type' => $currentWeekWorkouts > $previousWeekWorkouts ? 'user_xp_up' : 'user_xp_down',
                'title' => $currentWeekWorkouts > $previousWeekWorkouts
                    ? 'Je doet meer XP dan vorige week'
                    : 'Je doet minder XP dan vorige week',
                'body' => sprintf(
                    'Deze week: %d workouts, vorige week: %d workouts.',
                    $currentWeekWorkouts,
                    $previousWeekWorkouts
                ),
                'event_datetime' => $now->toISOString(),
                'is_unread' => true,
                'action_url' => null,
            ]);
        }

        $team = $user->teams()->first();
        if (! $team) {
            return $items;
        }

        $currentTeamWeekWorkouts = Workout::query()
            ->where('team_id', $team->id)
            ->where('workout_datetime', '>=', $currentWeekStart)
            ->count();
        $previousTeamWeekWorkouts = Workout::query()
            ->where('team_id', $team->id)
            ->whereBetween('workout_datetime', [$previousWeekStart, $previousWeekEnd])
            ->count();

        if ($currentTeamWeekWorkouts !== $previousTeamWeekWorkouts) {
            $items->push([
                'id' => 'team_xp_delta',
                'type' => $currentTeamWeekWorkouts > $previousTeamWeekWorkouts ? 'team_xp_up' : 'team_xp_down',
                'title' => $currentTeamWeekWorkouts > $previousTeamWeekWorkouts
                    ? 'Team doet meer XP dan vorige week'
                    : 'Team doet minder XP dan vorige week',
                'body' => sprintf(
                    '%s - deze week: %d workouts, vorige week: %d workouts.',
                    $team->name,
                    $currentTeamWeekWorkouts,
                    $previousTeamWeekWorkouts
                ),
                'event_datetime' => $now->toISOString(),
                'is_unread' => true,
                'action_url' => null,
            ]);
        }

        return $items;
    }
}
