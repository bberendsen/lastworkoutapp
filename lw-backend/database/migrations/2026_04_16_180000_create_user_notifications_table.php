<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->string('type', 80);
            $table->string('title', 160);
            $table->string('body', 280);
            $table->json('meta')->nullable();
            $table->timestamp('event_datetime')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'event_datetime']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
