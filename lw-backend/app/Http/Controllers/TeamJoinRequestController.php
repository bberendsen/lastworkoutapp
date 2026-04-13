<?php

namespace App\Http\Controllers;

use App\Http\Requests\TeamCreatorRequest;
use App\Http\Responses\JoinRequestRejectedResponse;
use App\Http\Responses\TeamDetailResponse;
use App\Http\Responses\TeamJoinRequestResponse;
use App\Models\Team;
use App\Models\TeamJoinRequest;
use App\Services\TeamXpService;
use Illuminate\Support\Facades\DB;

class TeamJoinRequestController extends Controller
{
    public function index(TeamCreatorRequest $request, Team $team)
    {
        $requests = $team->joinRequests()
            ->with('user')
            ->orderBy('created_at')
            ->get();

        $payload = $requests->map(fn (TeamJoinRequest $jr) => TeamJoinRequestResponse::from($jr))->values()->all();

        return response()->json(['requests' => $payload]);
    }

    public function approve(TeamCreatorRequest $request, Team $team, TeamJoinRequest $joinRequest, TeamXpService $teamXpService)
    {
        if ((string) $joinRequest->team_id !== (string) $team->id) {
            abort(404);
        }

        $user = $joinRequest->user;

        if ($user->teams()->exists()) {
            return response()->json([
                'message' => 'This user is already in another team. They must leave it before they can join.',
            ], 422);
        }

        DB::transaction(function () use ($team, $joinRequest, $user): void {
            if (! $team->users()->where('users.id', $user->id)->exists()) {
                $team->users()->attach($user->id, ['participates_in_challenges' => true]);
            }
            $joinRequest->delete();
        });

        $team->loadMembersForDetail();
        $team->loadCount('users');

        $xpBreakdown = $teamXpService->breakdownForTeam($team);
        $xpBreakdown['xp_this_week'] = $teamXpService->weeklyWorkoutXpByTeamIds([$team->id])[$team->id] ?? 0;

        return response()->json(TeamDetailResponse::from($team, $request->user(), $xpBreakdown));
    }

    public function reject(TeamCreatorRequest $request, Team $team, TeamJoinRequest $joinRequest)
    {
        if ((string) $joinRequest->team_id !== (string) $team->id) {
            abort(404);
        }

        $joinRequest->delete();

        return response()->json(JoinRequestRejectedResponse::make());
    }
}
