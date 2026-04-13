<?php

namespace App\Services;

use App\Enums\UserXpMilestone;
use App\Models\User;
use App\Models\UserXpMilestoneAward;

class UserXpService
{
    public const WORKOUT_XP = 3;

    public function grantWorkoutXp(User $user): void
    {
        $user->increment('xp', self::WORKOUT_XP);
        $this->applyPendingMilestones($user->fresh());
    }

    /**
     * Reset workout-based XP from counts, clear milestone rows, then re-apply milestone bonuses (for migrations / seeders).
     */
    public function backfillXpFromWorkouts(User $user): void
    {
        $base = $user->workouts()->count() * self::WORKOUT_XP;
        UserXpMilestoneAward::query()->where('user_id', $user->id)->delete();
        $user->update(['xp' => $base]);
        $this->applyPendingMilestones($user->fresh());
    }

    public function applyPendingMilestones(User $user): void
    {
        while ($this->applyOneMilestone($user)) {
            $user->refresh();
        }
    }

    private function applyOneMilestone(User $user): bool
    {
        foreach (UserXpMilestone::orderedByThreshold() as $milestone) {
            $already = UserXpMilestoneAward::query()
                ->where('user_id', $user->id)
                ->where('milestone', $milestone->value)
                ->exists();

            if ($already) {
                continue;
            }

            if ((int) $user->xp >= $milestone->threshold()) {
                $user->increment('xp', $milestone->bonusXp());
                UserXpMilestoneAward::query()->create([
                    'user_id' => $user->id,
                    'milestone' => $milestone->value,
                ]);

                return true;
            }
        }

        return false;
    }
}
