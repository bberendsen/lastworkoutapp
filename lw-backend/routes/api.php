<?php

use App\Http\Controllers\PasswordController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\StreakController;
use App\Http\Controllers\TeamChallengeController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TeamJoinRequestController;
use App\Http\Controllers\TeamStatisticsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkoutController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/login', [UserController::class, 'login']);
Route::post('/password/send-code', [PasswordController::class, 'sendCode']);
Route::post('/password/verify-code', [PasswordController::class, 'verifyCode']);
Route::post('/password/reset', [PasswordController::class, 'resetPassword']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users/{user}/profile', [UserController::class, 'profile']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::post('/workouts', [WorkoutController::class, 'store']);
    Route::get('/workouts/leaderboard', [WorkoutController::class, 'leaderboard']);
    Route::get('/workouts/latest/{userId}', [WorkoutController::class, 'latest']);
    Route::get('/workouts/{userId}', [WorkoutController::class, 'byUser']);
    Route::post('/scores/{userId}', [ScoreController::class, 'store']);
    Route::get('/scores/{userId}', [ScoreController::class, 'show']);
    Route::get('/streak/leaderboard', [StreakController::class, 'leaderboard']);
    Route::get('/streak/{userId}', [StreakController::class, 'show']);

    Route::get('/teams', [TeamController::class, 'index']);
    Route::get('/teams/leaderboard', [TeamController::class, 'leaderboard']);
    Route::post('/teams', [TeamController::class, 'store']);
    Route::get('/teams/{team}', [TeamController::class, 'show']);
    Route::get('/teams/{team}/statistics', [TeamStatisticsController::class, 'show']);
    Route::get('/teams/{team}/challenges', [TeamChallengeController::class, 'show']);
    Route::put('/teams/{team}', [TeamController::class, 'update']);
    Route::delete('/teams/{team}', [TeamController::class, 'destroy']);
    Route::post('/teams/{team}/join', [TeamController::class, 'join']);
    Route::post('/teams/{team}/leave', [TeamController::class, 'leave']);
    Route::get('/teams/{team}/join-requests', [TeamJoinRequestController::class, 'index']);
    Route::post('/teams/{team}/join-requests/{joinRequest}/approve', [TeamJoinRequestController::class, 'approve']);
    Route::post('/teams/{team}/join-requests/{joinRequest}/reject', [TeamJoinRequestController::class, 'reject']);
});
