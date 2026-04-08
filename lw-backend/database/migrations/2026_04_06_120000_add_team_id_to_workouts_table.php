<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workouts', function (Blueprint $table) {
            $table->uuid('team_id')->nullable()->after('user_id');
            $table->foreign('team_id')
                ->references('id')
                ->on('teams')
                ->nullOnDelete();
        });

        // Attribute past workouts to the user's current team (one team per user).
        $pairs = DB::table('team_user')->select('user_id', 'team_id')->get();
        foreach ($pairs as $row) {
            DB::table('workouts')
                ->where('user_id', $row->user_id)
                ->whereNull('team_id')
                ->update(['team_id' => $row->team_id]);
        }
    }

    public function down(): void
    {
        Schema::table('workouts', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn('team_id');
        });
    }
};
