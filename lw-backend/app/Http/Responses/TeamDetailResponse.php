<?php

namespace App\Http\Responses;

use App\Models\Team;
use App\Models\User;

final class TeamDetailResponse
{
    /**
     * @param  array{
     *     total: int,
     *     from_members: int,
     *     from_challenges: int,
     *     progress_band: array{from: int, to: int, progress: float},
     *     xp_this_week?: int
     * }  $xpBreakdown
     * @return array<string, mixed>
     */
    public static function from(Team $team, ?User $viewer, array $xpBreakdown): array
    {
        $members = $team->relationLoaded('users')
            ? $team->users
            : $team->users()->orderBy('username')->get();

        $memberPayloads = $members->map(fn (User $u) => TeamMemberResponse::from($u))->values()->all();

        $viewerId = $viewer ? (string) $viewer->id : null;

        $hasPendingRequest = false;
        if ($viewerId !== null) {
            $hasPendingRequest = $team->joinRequests()
                ->where('user_id', $viewerId)
                ->exists();
        }

        $isCreator = $viewerId !== null && (string) $team->created_by === $viewerId;
        $pendingJoinRequestsCount = $isCreator
            ? (int) ($team->join_requests_count ?? $team->joinRequests()->count())
            : 0;

        $isMember = $viewerId !== null && $members->contains(fn (User $u) => (string) $u->id === $viewerId);

        $alreadyInAnotherTeam = $viewer !== null && ! $isMember && $viewer->teams()->exists();

        return [
            'id' => $team->id,
            'name' => $team->name,
            'logo_url' => $team->logo_url,
            'gradient_preset' => $team->gradient_preset,
            'members_count' => $members->count(),
            'members' => $memberPayloads,
            'xp' => [
                'total' => $xpBreakdown['total'],
                'from_members' => $xpBreakdown['from_members'],
                'from_challenges' => $xpBreakdown['from_challenges'],
                'progress_band' => $xpBreakdown['progress_band'],
                'xp_this_week' => (int) ($xpBreakdown['xp_this_week'] ?? 0),
            ],
            'is_member' => $isMember,
            'is_creator' => $isCreator,
            'has_pending_request' => $hasPendingRequest,
            'pending_join_requests_count' => $pendingJoinRequestsCount,
            'already_in_another_team' => $alreadyInAnotherTeam,
        ];
    }
}
