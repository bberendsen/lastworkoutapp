<?php

use App\Models\User;
use App\Services\UserXpService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('xp')->default(0)->after('longest_streak');
        });

        Schema::create('user_xp_milestone_awards', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->string('milestone', 64);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_id', 'milestone']);
        });

        $service = app(UserXpService::class);
        User::query()->orderBy('id')->chunk(100, function ($users) use ($service): void {
            foreach ($users as $user) {
                $service->backfillXpFromWorkouts($user);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_xp_milestone_awards');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('xp');
        });
    }
};
