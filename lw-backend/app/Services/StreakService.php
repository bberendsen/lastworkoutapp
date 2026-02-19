<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workout;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StreakService
{
    /**
     * Weekly progress: workouts this week and goal.
     */
    public function getWeeklyProgress(string $userId): array
    {
        $user = User::find($userId);
        $goal = (int) ($user?->weekly_goal ?? 3);

        $now = Carbon::now();
        $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY);
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        $count = Workout::where('user_id', $userId)
            ->whereBetween('workout_datetime', [$weekStart, $weekEnd])
            ->count();

        return [
            'workouts_this_week' => $count,
            'goal' => $goal,
            'week_start' => $weekStart->toIso8601String(),
            'week_end' => $weekEnd->toIso8601String(),
        ];
    }

    /**
     * Current streak: consecutive weeks (from current backward) where workouts >= weekly_goal.
     * Weeks are ISO (Monday–Sunday).
     */
    public function getCurrentStreak(string $userId): int
    {
        $user = User::find($userId);
        $goal = (int) ($user?->weekly_goal ?? 3);
        if ($goal < 1) {
            return 0;
        }

        $countByWeek = $this->getWorkoutCountByWeek($userId);
        if (empty($countByWeek)) {
            return 0;
        }

        $now = Carbon::now();
        $currentWeekKey = $now->copy()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');

        $weeksOrdered = array_keys($countByWeek);
        usort($weeksOrdered, fn ($a, $b) => strcmp($b, $a)); // newest first

        $streak = 0;
        foreach ($weeksOrdered as $weekKey) {
            $count = $countByWeek[$weekKey];
            if ($count >= $goal) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Update user's longest_streak if their current weekly streak exceeds it.
     */
    public function updateLongestStreakIfNeeded(string $userId): void
    {
        $current = $this->getCurrentStreak($userId);
        $user = User::find($userId);
        if (!$user) {
            return;
        }
        $longest = (int) ($user->longest_streak ?? 0);
        if ($current > $longest) {
            $user->longest_streak = $current;
            $user->save();
        }
    }

    /**
     * Leaderboard with current_streak (weekly) and longest_streak per user.
     */
    public function getLeaderboardWithStreaks(): array
    {
        $leaderboard = DB::table('workouts')
            ->join('users', 'users.id', '=', 'workouts.user_id')
            ->select(
                'users.id',
                'users.username',
                'users.longest_streak',
                DB::raw('MAX(workouts.workout_datetime) as last_workout')
            )
            ->groupBy('users.id', 'users.username', 'users.longest_streak')
            ->orderByDesc('last_workout')
            ->get();

        if ($leaderboard->isEmpty()) {
            return [];
        }

        $result = [];
        foreach ($leaderboard as $row) {
            $currentStreak = $this->getCurrentStreak($row->id);
            $result[] = [
                'id' => $row->id,
                'username' => $row->username,
                'last_workout' => $row->last_workout,
                'current_streak' => $currentStreak,
                'longest_streak' => (int) ($row->longest_streak ?? 0),
            ];
        }

        return $result;
    }

    /**
     * @return array<string, int> week key (Y-m-d of Monday) => workout count
     */
    private function getWorkoutCountByWeek(string $userId): array
    {
        $workouts = Workout::where('user_id', $userId)->get();
        $countByWeek = [];

        foreach ($workouts as $w) {
            $weekStart = Carbon::parse($w->workout_datetime)->startOfWeek(Carbon::MONDAY);
            $key = $weekStart->format('Y-m-d');
            $countByWeek[$key] = ($countByWeek[$key] ?? 0) + 1;
        }

        return $countByWeek;
    }
}
