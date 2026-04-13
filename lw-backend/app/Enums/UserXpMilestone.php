<?php

namespace App\Enums;

enum UserXpMilestone: string
{
    case Spark = 'spark';
    case Builder = 'builder';
    case Grinder = 'grinder';
    case Legend = 'legend';

    public function threshold(): int
    {
        return match ($this) {
            self::Spark => 50,
            self::Builder => 200,
            self::Grinder => 500,
            self::Legend => 2000,
        };
    }

    public function bonusXp(): int
    {
        return match ($this) {
            self::Spark => 15,
            self::Builder => 50,
            self::Grinder => 100,
            self::Legend => 200,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Spark => 'First spark',
            self::Builder => 'Builder',
            self::Grinder => 'Grinder',
            self::Legend => 'Legend',
        };
    }

    /**
     * @return list<self>
     */
    public static function orderedByThreshold(): array
    {
        $cases = self::cases();
        usort($cases, fn (self $a, self $b): int => $a->threshold() <=> $b->threshold());

        return $cases;
    }
}
