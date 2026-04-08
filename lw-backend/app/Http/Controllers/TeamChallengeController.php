<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Services\TeamChallengeService;
use Illuminate\Http\JsonResponse;

class TeamChallengeController extends Controller
{
    public function __construct(
        private TeamChallengeService $teamChallengeService
    ) {}

    public function show(Team $team): JsonResponse
    {
        return response()->json([
            'challenges' => $this->teamChallengeService->snapshot($team),
        ]);
    }
}
