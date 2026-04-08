<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_challenge_completions', function (Blueprint $table) {
            $table->id();
            $table->uuid('team_id');
            $table->string('challenge_type', 64);
            $table->timestamp('completed_at');
            $table->timestamps();

            $table->foreign('team_id')->references('id')->on('teams')->cascadeOnDelete();
            $table->unique(['team_id', 'challenge_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_challenge_completions');
    }
};
