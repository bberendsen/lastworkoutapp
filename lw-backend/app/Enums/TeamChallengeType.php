<?php

namespace App\Enums;

enum TeamChallengeType: string
{
    case ConsistencyKings = 'consistency_kings';
    case NoExcuses = 'no_excuses';
    case Team300 = 'team_300';
    case ExtraHard = 'extra_hard';

    public function title(): string
    {
        return match ($this) {
            self::ConsistencyKings => 'Consistency kings',
            self::NoExcuses => 'No excuses',
            self::Team300 => '300 club',
            self::ExtraHard => 'Extra hard',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ConsistencyKings => 'At least one team workout every calendar day, 7 days in a row.',
            self::NoExcuses => 'Everyone who participates must log at least 2 workouts this week.',
            self::Team300 => 'Reach 300 team workouts in total (counting participating members only).',
            self::ExtraHard => 'This week, at least 5 people each log 3+ workouts.',
        };
    }

    /** XP granted to the team’s total when this challenge is completed (one-time per team). */
    public function xpReward(): int
    {
        return match ($this) {
            self::ConsistencyKings => 200,
            self::NoExcuses => 150,
            self::Team300 => 400,
            self::ExtraHard => 175,
        };
    }
}
