<?php

namespace App\Http\Responses;

use App\Models\Team;
use App\Models\User;

final class TeamDetailResponse
{
    /**
     * @return array<string, mixed>
     */
    public static function from(Team $team, ?User $viewer = null): array
    {
        $members = $team->relationLoaded('users')
            ? $team->users
            : $team->users()->orderBy('username')->get();

        $memberPayloads = $members->map(fn (User $u) => TeamMemberResponse::from($u))->values()->all();

        $viewerId = $viewer ? (string) $viewer->id : null;

        return [
            'id' => $team->id,
            'name' => $team->name,
            'logo_url' => $team->logo_url,
            'gradient_preset' => $team->gradient_preset,
            'members_count' => $members->count(),
            'members' => $memberPayloads,
            'is_member' => $viewerId !== null && $members->contains(fn (User $u) => (string) $u->id === $viewerId),
            'is_creator' => $viewerId !== null && (string) $team->created_by === $viewerId,
        ];
    }
}
