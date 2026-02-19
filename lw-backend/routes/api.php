<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\StreakController;

Route::get('/ping', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/login', [UserController::class, 'login']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::post('/workouts', [WorkoutController::class, 'store']);
    Route::get('/workouts/leaderboard', [WorkoutController::class, 'leaderboard']);
    Route::get('/workouts/latest/{userId}', [WorkoutController::class, 'latest']);
    Route::get('/workouts/{userId}', [WorkoutController::class, 'byUser']);
    Route::post('/scores/{userId}', [ScoreController::class, 'store']);
    Route::get('/scores/{userId}', [ScoreController::class, 'show']);
    Route::get('/streak/leaderboard', [StreakController::class, 'leaderboard']);
    Route::get('/streak/{userId}', [StreakController::class, 'show']);
});