<?php

namespace App\Http\Responses;

use App\Models\Team;

final class TeamSummaryResponse
{
    /**
     * @param  list<string>  $memberTeamIds
     * @return array<string, mixed>
     */
    public static function from(Team $team, array $memberTeamIds, ?string $viewerId, bool $hasPendingRequest = false): array
    {
        $membersCount = $team->users_count ?? $team->users()->count();

        return [
            'id' => $team->id,
            'name' => $team->name,
            'logo_url' => $team->logo_url,
            'gradient_preset' => $team->gradient_preset,
            'members_count' => (int) $membersCount,
            'is_member' => in_array($team->id, $memberTeamIds, true),
            'is_creator' => $viewerId !== null && (string) $team->created_by === (string) $viewerId,
            'has_pending_request' => $hasPendingRequest,
        ];
    }
}
