<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('workouts', function (Blueprint $table) {
        $table->id();

        // Relation
        $table->uuid('user_id');

        // Workout moment
        $table->timestamp('workout_datetime');

        // Source of workout
        $table->string('source')->default('manual');

        // Timestamps
        $table->timestamps();

        // Foreign key constraint
        $table->foreign('user_id')
            ->references('id')
            ->on('users')
            ->cascadeOnDelete();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workouts');
    }
};
