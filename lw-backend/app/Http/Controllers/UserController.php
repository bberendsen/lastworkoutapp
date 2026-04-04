<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteUserRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Responses\DeleteUserResponse;
use App\Http\Responses\LoginApiResponse;
use App\Http\Responses\ShowUserResponse;
use App\Http\Responses\UserProfileResponse;
use App\Models\User;
use App\Services\StreakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(
        private StreakService $streakService
    ) {}

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        $data = collect($validated)->except('password')->all();
        $data['password'] = Hash::make($validated['password']);

        $user = User::create($data);

        return response()->json(ShowUserResponse::from($user), 201);
    }

    public function show($id)
    {
        return response()->json(ShowUserResponse::from(User::findOrFail($id)));
    }

    /**
     * Public profile + stats for another member (authenticated). No email.
     */
    public function profile(User $user): JsonResponse
    {
        $team = $user->teams()->first();
        $totalWorkouts = $user->workouts()->count();
        $lastWorkout = $user->workouts()->latest('workout_datetime')->first();
        $currentStreak = $this->streakService->getCurrentStreak($user->id);
        $longestStreak = (int) ($user->longest_streak ?? 0);

        return response()->json(UserProfileResponse::from(
            $user,
            $team,
            $totalWorkouts,
            $lastWorkout?->workout_datetime,
            $currentStreak,
            $longestStreak
        ));
    }

    public function update(UpdateUserRequest $request, $id)
    {
        $user = $request->user();
        $user->update(array_filter($request->validated()));

        return response()->json(ShowUserResponse::from($user->fresh()));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'User logged out'], 200);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $validated['username'])->first();
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(LoginApiResponse::from($user, $token));
    }

    public function destroy(DeleteUserRequest $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json(DeleteUserResponse::make());
    }
}
