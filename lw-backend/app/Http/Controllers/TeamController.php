<?php

namespace App\Http\Controllers;

use App\Http\Requests\DestroyTeamRequest;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Responses\TeamDestroyedResponse;
use App\Http\Responses\TeamDetailResponse;
use App\Http\Responses\TeamSummaryResponse;
use App\Models\Team;
use App\Services\TeamXpService;
use App\Support\StoresTeamLogos;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    use StoresTeamLogos;

    public function __construct(
        private TeamXpService $teamXpService
    ) {}

    /**
     * Teams ranked by total workouts attributed to the team (workouts.team_id).
     */
    public function leaderboard(): JsonResponse
    {
        $teams = Team::query()
            ->withCount(['workouts as total_workouts'])
            ->orderByDesc('total_workouts')
            ->orderBy('name')
            ->get();

        $teamIds = $teams->pluck('id')->all();
        $xpByTeam = $this->teamXpService->totalsForTeamIds($teamIds);
        $xpThisWeekByTeam = $this->teamXpService->weeklyWorkoutXpByTeamIds($teamIds);

        $payload = $teams->map(fn (Team $t): array => [
            'id' => $t->id,
            'name' => $t->name,
            'logo_url' => $t->logo_url,
            'gradient_preset' => $t->gradient_preset,
            'total_workouts' => (int) $t->total_workouts,
            'total_xp' => $xpByTeam[$t->id] ?? 0,
            'xp_this_week' => $xpThisWeekByTeam[$t->id] ?? 0,
        ])->values()->all();

        return response()->json(['teams' => $payload]);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $memberTeamIds = $user->teams()->pluck('teams.id')->all();

        $teams = Team::query()
            ->withCount('users')
            ->withExists([
                'joinRequests as viewer_has_pending_join_request' => function ($query) use ($user): void {
                    $query->where('user_id', $user->id);
                },
            ])
            ->orderBy('name')
            ->get();

        $payload = $teams->map(function (Team $team) use ($memberTeamIds, $user) {
            return TeamSummaryResponse::from(
                $team,
                $memberTeamIds,
                (string) $user->id,
                (bool) $team->viewer_has_pending_join_request
            );
        })->values()->all();

        return response()->json(['teams' => $payload]);
    }

    public function show(Request $request, Team $team)
    {
        $team->loadMembersForDetail();

        $viewer = $request->user();
        if ($viewer && (string) $team->created_by === (string) $viewer->id) {
            $team->loadCount('joinRequests');
        }

        $xpBreakdown = $this->teamXpService->breakdownForTeam($team);
        $xpBreakdown['xp_this_week'] = $this->teamXpService->weeklyWorkoutXpByTeamIds([$team->id])[$team->id] ?? 0;

        return response()->json(TeamDetailResponse::from($team, $viewer, $xpBreakdown));
    }

    public function store(StoreTeamRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        $logoUrl = null;
        if ($request->hasFile('logo')) {
            $logoUrl = $this->storeTeamLogoFile($request->file('logo'));
        }

        $team = Team::create([
            'name' => $validated['name'],
            'logo_url' => $logoUrl,
            'gradient_preset' => $validated['gradient_preset'],
            'created_by' => $user->id,
        ]);

        $team->users()->attach($user->id, ['participates_in_challenges' => true]);

        $team->loadCount('users');

        return response()->json(
            TeamSummaryResponse::from($team, [$team->id], (string) $user->id, false),
            201
        );
    }

    public function update(UpdateTeamRequest $request, Team $team)
    {
        $data = $request->safe()->only(['name', 'gradient_preset']);

        if ($request->hasFile('logo')) {
            $this->deleteStoredTeamLogo($team->logo_url);
            $data['logo_url'] = $this->storeTeamLogoFile($request->file('logo'));
        }

        $team->update(array_filter($data, fn ($v) => $v !== null));

        $team->loadCount('users');
        $memberTeamIds = $request->user()->teams()->pluck('teams.id')->all();

        $pending = $team->joinRequests()
            ->where('user_id', $request->user()->id)
            ->exists();

        return response()->json(
            TeamSummaryResponse::from($team, $memberTeamIds, (string) $request->user()->id, $pending)
        );
    }

    public function destroy(DestroyTeamRequest $request, Team $team)
    {
        if ($team->users()->count() > 0) {
            return response()->json([
                'message' => 'You can only delete a team when it has no members. Ask members to leave first.',
            ], 422);
        }

        $this->deleteStoredTeamLogo($team->logo_url);
        $team->delete();

        return response()->json(TeamDestroyedResponse::make());
    }

    public function join(Request $request, Team $team)
    {
        $user = $request->user();

        if ($team->users()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'You are already a member of this team.'], 422);
        }

        if ($team->joinRequests()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'You already have a pending request for this team.'], 422);
        }

        if ($user->teams()->exists()) {
            return response()->json(['message' => 'You are already in a team. Leave it before joining another.'], 422);
        }

        $team->joinRequests()->create([
            'user_id' => $user->id,
        ]);

        $team->loadMembersForDetail();

        $xpBreakdown = $this->teamXpService->breakdownForTeam($team);
        $xpBreakdown['xp_this_week'] = $this->teamXpService->weeklyWorkoutXpByTeamIds([$team->id])[$team->id] ?? 0;

        return response()->json(TeamDetailResponse::from($team, $user, $xpBreakdown));
    }

    public function leave(Request $request, Team $team)
    {
        $user = $request->user();

        if (! $team->users()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'You are not a member of this team.'], 422);
        }

        $team->users()->detach($user->id);

        return response()->json(['message' => 'You left the team.']);
    }
}
