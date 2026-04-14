<?php

namespace App\Http\Responses;

use App\Enums\TeamChallengeType;
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
            $first = strtoupper(substr((string) $row->first_name, 0, 1));
            $last = strtoupper(substr((string) $row->last_name, 0, 1));
            $initials = trim($first . $last);
            if ($initials === '') {
                $initials = strtoupper(substr((string) $row->username, 0, 2));
            }
            if ($initials === '') {
                $initials = '??';
            }

            return [
                'id' => 'workout:'.(string) $row->id,
                'event_type' => 'workout',
                'event_datetime' => $row->workout_datetime,
                'workout_datetime' => $row->workout_datetime,
                'user' => [
                    'id' => (string) $row->user_id,
                    'username' => (string) $row->username,
                    'first_name' => (string) $row->first_name,
                    'last_name' => (string) $row->last_name,
                    'initials' => $initials,
                    'xp_total' => (int) $row->xp_total,
                    'xp_earned' => UserXpService::WORKOUT_XP,
                ],
                'team' => [
                    'id' => $row->team_id ? (string) $row->team_id : null,
                    'name' => $row->team_name ? (string) $row->team_name : null,
                    'logo_url' => $row->team_logo_url ? (string) $row->team_logo_url : null,
                ],
                'challenge' => null,
            ];
        });

        $challengeItems = $challengeRows->map(function (object $row): array {
            $challengeType = TeamChallengeType::from((string) $row->challenge_type);

            return [
                'id' => 'challenge:'.(string) $row->id,
                'event_type' => 'challenge',
                'event_datetime' => $row->completed_at,
                'workout_datetime' => null,
                'user' => null,
                'team' => [
                    'id' => (string) $row->team_id,
                    'name' => (string) $row->team_name,
                    'logo_url' => $row->team_logo_url ? (string) $row->team_logo_url : null,
                ],
                'challenge' => [
                    'type' => $challengeType->value,
                    'title' => $challengeType->title(),
                    'xp_reward' => $challengeType->xpReward(),
                ],
            ];
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
}
