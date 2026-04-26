<?php

namespace App\Services;

use App\Enums\TeamChallengeType;
use App\Events\LiveFeedItemCreated;
use App\Http\Responses\WorkoutFeedResponse;
use App\Models\Team;
use App\Models\TeamChallengeCompletion;
use App\Models\Workout;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TeamChallengeService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function snapshot(Team $team): array
    {
        $memberIds = $this->teamMemberUserIds($team);
        $completionTypes = $this->completionTypesForTeam($team->id);

        $out = [];
        foreach (TeamChallengeType::cases() as $type) {
            $out[] = match ($type) {
                TeamChallengeType::ConsistencyKings => $this->buildConsistencyKings($team, $memberIds, $completionTypes),
                TeamChallengeType::NoExcuses => $this->buildNoExcuses($team, $memberIds, $completionTypes),
                TeamChallengeType::Team300 => $this->buildTeam300($team, $memberIds, $completionTypes),
                TeamChallengeType::ExtraHard => $this->buildExtraHard($team, $memberIds, $completionTypes),
            };
        }

        return $out;
    }

    public function syncCompletionsForTeam(?string $teamId): void
    {
        if ($teamId === null) {
            return;
        }

        $team = Team::find($teamId);
        if ($team === null) {
            return;
        }

        $memberIds = $this->teamMemberUserIds($team);
        $completionTypes = $this->completionTypesForTeam($team->id);

        // Consistency kings
        $streak = $this->consistencyStreakDays($team, $memberIds);
        if ($streak >= 7 && ! $completionTypes->contains(TeamChallengeType::ConsistencyKings->value)) {
            $this->recordCompletion($team->id, TeamChallengeType::ConsistencyKings);
        }

        // 300 club
        $total = $this->countTeamWorkouts($team, $memberIds);
        if ($total >= 300 && ! $completionTypes->contains(TeamChallengeType::Team300->value)) {
            $this->recordCompletion($team->id, TeamChallengeType::Team300);
        }

        if ($this->noExcusesMet($team, $memberIds) && ! $completionTypes->contains(TeamChallengeType::NoExcuses->value)) {
            $this->recordCompletion($team->id, TeamChallengeType::NoExcuses);
        }

        if ($this->extraHardMet($team, $memberIds) && ! $completionTypes->contains(TeamChallengeType::ExtraHard->value)) {
            $this->recordCompletion($team->id, TeamChallengeType::ExtraHard);
        }
    }

    /**
     * @param  array<string>  $memberIds
     * @param  Collection<int, string>  $completionTypes
     * @return array<string, mixed>
     */
    private function buildConsistencyKings(Team $team, array $memberIds, Collection $completionTypes): array
    {
        $type = TeamChallengeType::ConsistencyKings;
        $streak = $this->consistencyStreakDays($team, $memberIds);
        $progress = min($streak, 7) / 7;
        $completedInDb = $completionTypes->contains($type->value);
        $completed = $completedInDb || $streak >= 7;

        return [
            'id' => $type->value,
            'title' => $type->title(),
            'description' => $type->description(),
            'progress' => round($progress, 4),
            'status_label' => $streak >= 7 ? '7 / 7 days' : $streak.' / 7 days',
            'completed' => $completed,
            'xp_reward' => $type->xpReward(),
        ];
    }

    /**
     * @param  array<string>  $memberIds
     * @param  Collection<int, string>  $completionTypes
     * @return array<string, mixed>
     */
    private function buildNoExcuses(Team $team, array $memberIds, Collection $completionTypes): array
    {
        $type = TeamChallengeType::NoExcuses;
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $memberCount = count($memberIds);
        if ($memberCount === 0) {
            return $this->emptyChallenge($type);
        }

        $counts = $this->workoutCountsPerUserInRange($team, $memberIds, $weekStart, $weekEnd);
        $qualified = $counts->filter(fn (int $c): bool => $c >= 2)->count();
        $progress = $qualified / $memberCount;
        $completedLive = $qualified === $memberCount;
        $completedInDb = $completionTypes->contains($type->value);
        $completed = $completedInDb || $completedLive;

        return [
            'id' => $type->value,
            'title' => $type->title(),
            'description' => $type->description(),
            'progress' => round(min($progress, 1.0), 4),
            'status_label' => $qualified.' / '.$memberCount.' members (2+ this week)',
            'completed' => $completed,
            'xp_reward' => $type->xpReward(),
        ];
    }

    /**
     * @param  array<string>  $memberIds
     * @param  Collection<int, string>  $completionTypes
     * @return array<string, mixed>
     */
    private function buildTeam300(Team $team, array $memberIds, Collection $completionTypes): array
    {
        $type = TeamChallengeType::Team300;
        $total = $this->countTeamWorkouts($team, $memberIds);
        $progress = min($total, 300) / 300;
        $completedInDb = $completionTypes->contains($type->value);
        $completed = $completedInDb || $total >= 300;

        return [
            'id' => $type->value,
            'title' => $type->title(),
            'description' => $type->description(),
            'progress' => round($progress, 4),
            'status_label' => $total.' / 300 workouts',
            'completed' => $completed,
            'xp_reward' => $type->xpReward(),
        ];
    }

    /**
     * @param  array<string>  $memberIds
     * @param  Collection<int, string>  $completionTypes
     * @return array<string, mixed>
     */
    private function buildExtraHard(Team $team, array $memberIds, Collection $completionTypes): array
    {
        $type = TeamChallengeType::ExtraHard;
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $counts = $this->workoutCountsPerUserInRange($team, $memberIds, $weekStart, $weekEnd);
        $peopleWith3Plus = $counts->filter(fn (int $c): bool => $c >= 3)->count();
        $progress = min($peopleWith3Plus, 5) / 5;
        $completedLive = $peopleWith3Plus >= 5;
        $completedInDb = $completionTypes->contains($type->value);
        $completed = $completedInDb || $completedLive;

        return [
            'id' => $type->value,
            'title' => $type->title(),
            'description' => $type->description(),
            'progress' => round($progress, 4),
            'status_label' => $peopleWith3Plus.' / 5 people (3+ this week)',
            'completed' => $completed,
            'xp_reward' => $type->xpReward(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyChallenge(TeamChallengeType $type): array
    {
        return [
            'id' => $type->value,
            'title' => $type->title(),
            'description' => $type->description(),
            'progress' => 0,
            'status_label' => '—',
            'completed' => false,
            'xp_reward' => $type->xpReward(),
        ];
    }

    /**
     * @param  array<string>  $memberIds
     */
    private function noExcusesMet(Team $team, array $memberIds): bool
    {
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
        $memberCount = count($memberIds);
        if ($memberCount === 0) {
            return false;
        }
        $counts = $this->workoutCountsPerUserInRange($team, $memberIds, $weekStart, $weekEnd);
        $qualified = $counts->filter(fn (int $c): bool => $c >= 2)->count();

        return $qualified === $memberCount;
    }

    /**
     * @param  array<string>  $memberIds
     */
    private function extraHardMet(Team $team, array $memberIds): bool
    {
        $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->startOfDay();
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
        $counts = $this->workoutCountsPerUserInRange($team, $memberIds, $weekStart, $weekEnd);
        $peopleWith3Plus = $counts->filter(fn (int $c): bool => $c >= 3)->count();

        return $peopleWith3Plus >= 5;
    }

    /**
     * @return array<string>
     */
    private function teamMemberUserIds(Team $team): array
    {
        return DB::table('team_user')
            ->where('team_id', $team->id)
            ->pluck('user_id')
            ->map(fn ($id): string => (string) $id)
            ->all();
    }

    private function completionTypesForTeam(string $teamId): Collection
    {
        return TeamChallengeCompletion::query()
            ->where('team_id', $teamId)
            ->pluck('challenge_type');
    }

    /**
     * @param  array<string>  $memberIds
     */
    private function consistencyStreakDays(Team $team, array $memberIds): int
    {
        if ($memberIds === []) {
            return 0;
        }

        $dates = Workout::query()
            ->where('team_id', $team->id)
            ->whereIn('user_id', $memberIds)
            ->selectRaw('DATE(workout_datetime) as d')
            ->distinct()
            ->pluck('d');

        $set = [];
        foreach ($dates as $d) {
            $set[Carbon::parse($d)->toDateString()] = true;
        }

        $streak = 0;
        $d = Carbon::today()->startOfDay();
        for ($i = 0; $i < 400; $i++) {
            $key = $d->toDateString();
            if (isset($set[$key])) {
                $streak++;
                $d->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * @param  array<string>  $memberIds
     */
    private function countTeamWorkouts(Team $team, array $memberIds): int
    {
        if ($memberIds === []) {
            return 0;
        }

        return (int) Workout::query()
            ->where('team_id', $team->id)
            ->whereIn('user_id', $memberIds)
            ->count();
    }

    /**
     * @param  array<string>  $memberIds
     * @return Collection<string, int> user_id => count
     */
    private function workoutCountsPerUserInRange(Team $team, array $memberIds, Carbon $start, Carbon $end): Collection
    {
        if ($memberIds === []) {
            return collect();
        }

        return Workout::query()
            ->where('team_id', $team->id)
            ->whereIn('user_id', $memberIds)
            ->whereBetween('workout_datetime', [$start, $end])
            ->selectRaw('user_id, COUNT(*) as c')
            ->groupBy('user_id')
            ->pluck('c', 'user_id')
            ->map(fn ($c): int => (int) $c);
    }

    private function recordCompletion(string $teamId, TeamChallengeType $type): void
    {
        $completion = TeamChallengeCompletion::query()->firstOrCreate(
            [
                'team_id' => $teamId,
                'challenge_type' => $type->value,
            ],
            ['completed_at' => now()]
        );

        if ($completion->wasRecentlyCreated) {
            broadcast(new LiveFeedItemCreated(WorkoutFeedResponse::fromChallengeCompletionModel($completion)));
        }
    }
}
