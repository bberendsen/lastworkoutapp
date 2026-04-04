<?php

use App\Http\Controllers\PasswordController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\StreakController;
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
});
