<?php

namespace App\Services;

use App\Enums\TeamChallengeType;
use App\Models\Team;
use App\Models\TeamChallengeCompletion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TeamXpService
{
    private const PROGRESS_BAND = 500;

    /**
     * Team XP = sum of current members’ total XP + XP from each team challenge completed at least once.
     *
     * @return array{
     *     total: int,
     *     from_members: int,
     *     from_challenges: int,
     *     progress_band: array{from: int, to: int, progress: float}
     * }
     */
    public function breakdownForTeam(Team $team): array
    {
        $memberIds = $team->users()->pluck('users.id')->all();
        $fromMembers = $memberIds === []
            ? 0
            : (int) User::query()->whereIn('id', $memberIds)->sum('xp');

        $completionTypes = TeamChallengeCompletion::query()
            ->where('team_id', $team->id)
            ->pluck('challenge_type');

        $fromChallenges = 0;
        foreach ($completionTypes as $typeValue) {
            $type = TeamChallengeType::tryFrom((string) $typeValue);
            if ($type !== null) {
                $fromChallenges += $type->xpReward();
            }
        }

        $total = $fromMembers + $fromChallenges;

        return [
            'total' => $total,
            'from_members' => $fromMembers,
            'from_challenges' => $fromChallenges,
            'progress_band' => $this->progressBand($total),
        ];
    }

    /**
     * Batch total XP for many teams (members’ XP + challenge bonuses). Keys are team UUID strings.
     *
     * @param  list<string>  $teamIds
     * @return array<string, int>
     */
    public function totalsForTeamIds(array $teamIds): array
    {
        $teamIds = array_values(array_unique(array_filter($teamIds)));
        if ($teamIds === []) {
            return [];
        }

        $memberSums = DB::table('team_user')
            ->join('users', 'users.id', '=', 'team_user.user_id')
            ->whereIn('team_user.team_id', $teamIds)
            ->groupBy('team_user.team_id')
            ->selectRaw('team_user.team_id as tid, COALESCE(SUM(users.xp), 0) as sx')
            ->pluck('sx', 'tid');

        $challengeRows = TeamChallengeCompletion::query()
            ->whereIn('team_id', $teamIds)
            ->get(['team_id', 'challenge_type']);

        $challengeByTeam = [];
        foreach ($challengeRows as $row) {
            $type = TeamChallengeType::tryFrom((string) $row->challenge_type);
            if ($type !== null) {
                $tid = (string) $row->team_id;
                $challengeByTeam[$tid] = ($challengeByTeam[$tid] ?? 0) + $type->xpReward();
            }
        }

        $out = [];
        foreach ($teamIds as $tid) {
            $fromMembers = (int) ($memberSums[$tid] ?? 0);
            $fromChallenges = (int) ($challengeByTeam[$tid] ?? 0);
            $out[$tid] = $fromMembers + $fromChallenges;
        }

        return $out;
    }

    /**
     * Workout-based XP this ISO week (Mon–Sun) from workouts linked to each team (workouts.team_id).
     *
     * @param  list<string>  $teamIds
     * @return array<string, int>
     */
    public function weeklyWorkoutXpByTeamIds(array $teamIds): array
    {
        $teamIds = array_values(array_unique(array_filter($teamIds)));
        if ($teamIds === []) {
            return [];
        }

        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = Carbon::now()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $counts = DB::table('workouts')
            ->whereIn('team_id', $teamIds)
            ->whereNotNull('team_id')
            ->whereBetween('workout_datetime', [$weekStart, $weekEnd])
            ->groupBy('team_id')
            ->selectRaw('team_id as tid, COUNT(*) as c')
            ->pluck('c', 'tid');

        $rate = UserXpService::WORKOUT_XP;
        $out = [];
        foreach ($teamIds as $tid) {
            $out[$tid] = (int) ($counts[$tid] ?? 0) * $rate;
        }

        return $out;
    }

    /**
     * @return array{from: int, to: int, progress: float}
     */
    private function progressBand(int $total): array
    {
        $band = self::PROGRESS_BAND;
        $from = intdiv($total, $band) * $band;
        $to = $from + $band;
        $progress = $to > $from ? ($total - $from) / ($to - $from) : 0.0;
        $progress = max(0.0, min(1.0, $progress));

        return [
            'from' => $from,
            'to' => $to,
            'progress' => round($progress, 4),
        ];
    }
}
