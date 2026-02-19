<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'username'    => 'required|unique:users',
            'first_name'  => 'required',
            'last_name'   => 'required',
            'birthdate'   => 'required|date',
            'password'    => 'required|min:6',
            'weekly_goal' => 'sometimes|integer|min:1|max:7',
        ]);

        $data = collect($validated)->except('password')->all();
        $data['password'] = Hash::make($validated['password']);
        $data['weekly_goal'] = $validated['weekly_goal'] ?? 3;

        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function show($id)
    {
        return User::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ((string) $user->id !== (string) $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'first_name'  => 'sometimes|string|max:255',
            'last_name'   => 'sometimes|string|max:255',
            'username'    => 'sometimes|string|max:255|unique:users,username,' . $id,
            'weekly_goal' => 'sometimes|integer|min:1|max:7',
        ]);

        $user->update(array_filter($validated));
        return response()->json($user);
    }

    public function logout(Request $request)
    {
        // Revoke the current access token so it can no longer be used
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
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;  // Create a new token for the user

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'has_subscription' => $user->has_subscription,
                'weekly_goal' => (int) ($user->weekly_goal ?? 3),
            ],
        ]);
    }
}
