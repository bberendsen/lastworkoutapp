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
    Schema::create('users', function (Blueprint $table) {
        // Primary key (UUID)
        $table->uuid('id')->primary();

        // Identity
        $table->string('username')->unique();
        $table->string('first_name');
        $table->string('last_name');

        // Personal
        $table->date('birthdate');

        // Auth
        $table->string('email')->nullable()->unique();
        $table->string('password');

        // Subscription
        $table->boolean('has_subscription')->default(false);

        // Timestamps
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
