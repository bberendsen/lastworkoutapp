<?php

namespace App\Http\Controllers;

use App\Http\Requests\DestroyTeamRequest;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Responses\TeamDestroyedResponse;
use App\Http\Responses\TeamDetailResponse;
use App\Http\Responses\TeamSummaryResponse;
use App\Models\Team;
use App\Support\StoresTeamLogos;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    use StoresTeamLogos;

    public function index(Request $request)
    {
        $user = $request->user();
        $memberTeamIds = $user->teams()->pluck('id')->all();

        $teams = Team::query()
            ->withCount('users')
            ->orderBy('name')
            ->get();

        $payload = $teams->map(fn (Team $team) => TeamSummaryResponse::from(
            $team,
            $memberTeamIds,
            (string) $user->id
        ))->values()->all();

        return response()->json(['teams' => $payload]);
    }

    public function show(Request $request, Team $team)
    {
        $team->load(['users' => fn ($q) => $q->orderBy('username')]);

        return response()->json(TeamDetailResponse::from($team, $request->user()));
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

        $team->users()->attach($user->id);

        $team->loadCount('users');

        return response()->json(
            TeamSummaryResponse::from($team, [$team->id], (string) $user->id),
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
        $memberTeamIds = $request->user()->teams()->pluck('id')->all();

        return response()->json(
            TeamSummaryResponse::from($team, $memberTeamIds, (string) $request->user()->id)
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

        $team->users()->attach($user->id);
        $team->load(['users' => fn ($q) => $q->orderBy('username')]);

        return response()->json(TeamDetailResponse::from($team, $user));
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
