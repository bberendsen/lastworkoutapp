<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\StreakService;
use Illuminate\Http\JsonResponse;

class StreakController extends Controller
{
    public function __construct(
        private StreakService $streakService
    ) {
    }

    /**
     * Get current streak, longest streak, and weekly progress for a user.
     * GET /api/streak/{userId}
     */
    public function show(string $userId): JsonResponse
    {
        $currentStreak = $this->streakService->getCurrentStreak($userId);
        $weeklyProgress = $this->streakService->getWeeklyProgress($userId);
        $user = User::find($userId);

        return response()->json([
            'user_id' => $userId,
            'current_streak' => $currentStreak,
            'longest_streak' => $user ? (int) ($user->longest_streak ?? 0) : 0,
            'weekly_progress' => $weeklyProgress,
        ]);
    }

    /**
     * Leaderboard with current_streak for each user.
     * GET /api/streak/leaderboard
     */
    public function leaderboard(): JsonResponse
    {
        $leaderboard = $this->streakService->getLeaderboardWithStreaks();

        return response()->json($leaderboard);
    }
}
