<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_user', function (Blueprint $table) {
            $table->boolean('participates_in_challenges')->default(true)->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('team_user', function (Blueprint $table) {
            $table->dropColumn('participates_in_challenges');
        });
    }
};
