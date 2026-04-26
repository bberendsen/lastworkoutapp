<?php

namespace App\Http\Responses;

use App\Enums\TeamChallengeType;
use App\Models\TeamChallengeCompletion;
use App\Models\Workout;
use App\Services\UserXpService;
use Illuminate\Support\Collection;

final class WorkoutFeedResponse
{
    /**
     * @param  Collection<int, object>  $workoutRows
     * @param  Collection<int, object>  $challengeRows
     * @return array<string, mixed>
     */
    public static function fromRows(Collection $workoutRows, Collection $challengeRows, int $page, int $perPage): array
    {
        $workoutItems = $workoutRows->map(function (object $row): array {
            return self::workoutItem(
                workoutId: (string) $row->id,
                userId: (string) $row->user_id,
                teamId: $row->team_id ? (string) $row->team_id : null,
                workoutDatetime: $row->workout_datetime,
                username: (string) $row->username,
                firstName: (string) $row->first_name,
                lastName: (string) $row->last_name,
                xpTotal: (int) $row->xp_total,
                teamName: $row->team_name ? (string) $row->team_name : null,
                teamLogoUrl: $row->team_logo_url ? (string) $row->team_logo_url : null
            );
        });

        $challengeItems = $challengeRows->map(function (object $row): array {
            $challengeType = TeamChallengeType::from((string) $row->challenge_type);

            return self::challengeItem(
                completionId: (string) $row->id,
                teamId: (string) $row->team_id,
                completedAt: $row->completed_at,
                teamName: (string) $row->team_name,
                teamLogoUrl: $row->team_logo_url ? (string) $row->team_logo_url : null,
                challengeType: $challengeType
            );
        });

        $allItems = $workoutItems
            ->concat($challengeItems)
            ->sortByDesc('event_datetime')
            ->values();

        $offset = max(0, ($page - 1) * $perPage);
        $items = $allItems->slice($offset, $perPage)->values();
        $hasMore = $allItems->count() > ($offset + $items->count());

        return [
            'items' => $items->all(),
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'has_more' => $hasMore,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromWorkoutModel(Workout $workout): array
    {
        $workout->loadMissing(['user:id,username,first_name,last_name,xp', 'team:id,name,logo_url']);

        return self::workoutItem(
            workoutId: (string) $workout->id,
            userId: (string) $workout->user_id,
            teamId: $workout->team_id ? (string) $workout->team_id : null,
            workoutDatetime: optional($workout->workout_datetime)->toISOString(),
            username: (string) ($workout->user?->username ?? ''),
            firstName: (string) ($workout->user?->first_name ?? ''),
            lastName: (string) ($workout->user?->last_name ?? ''),
            xpTotal: (int) ($workout->user?->xp ?? 0),
            teamName: $workout->team?->name,
            teamLogoUrl: $workout->team?->logo_url
        );
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromChallengeCompletionModel(TeamChallengeCompletion $completion): array
    {
        $completion->loadMissing('team:id,name,logo_url');
        $challengeType = TeamChallengeType::from($completion->challenge_type);

        return self::challengeItem(
            completionId: (string) $completion->id,
            teamId: (string) $completion->team_id,
            completedAt: optional($completion->completed_at)->toISOString(),
            teamName: (string) ($completion->team?->name ?? ''),
            teamLogoUrl: $completion->team?->logo_url,
            challengeType: $challengeType
        );
    }

    /**
     * @return array<string, mixed>
     */
    private static function workoutItem(
        string $workoutId,
        string $userId,
        ?string $teamId,
        mixed $workoutDatetime,
        string $username,
        string $firstName,
        string $lastName,
        int $xpTotal,
        ?string $teamName,
        ?string $teamLogoUrl
    ): array {
        $first = strtoupper(substr($firstName, 0, 1));
        $last = strtoupper(substr($lastName, 0, 1));
        $initials = trim($first.$last);
        if ($initials === '') {
            $initials = strtoupper(substr($username, 0, 2));
        }
        if ($initials === '') {
            $initials = '??';
        }

        return [
            'id' => 'workout:'.$workoutId,
            'event_type' => 'workout',
            'event_datetime' => $workoutDatetime,
            'workout_datetime' => $workoutDatetime,
            'user' => [
                'id' => $userId,
                'username' => $username,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'initials' => $initials,
                'xp_total' => $xpTotal,
                'xp_earned' => UserXpService::WORKOUT_XP,
            ],
            'team' => [
                'id' => $teamId,
                'name' => $teamName,
                'logo_url' => $teamLogoUrl,
            ],
            'challenge' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function challengeItem(
        string $completionId,
        string $teamId,
        mixed $completedAt,
        string $teamName,
        ?string $teamLogoUrl,
        TeamChallengeType $challengeType
    ): array {
        return [
            'id' => 'challenge:'.$completionId,
            'event_type' => 'challenge',
            'event_datetime' => $completedAt,
            'workout_datetime' => null,
            'user' => null,
            'team' => [
                'id' => $teamId,
                'name' => $teamName,
                'logo_url' => $teamLogoUrl,
            ],
            'challenge' => [
                'type' => $challengeType->value,
                'title' => $challengeType->title(),
                'xp_reward' => $challengeType->xpReward(),
            ],
        ];
    }
}
