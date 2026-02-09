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
            'username'   => 'required|unique:users',
            'first_name' => 'required',
            'last_name'  => 'required',
            'birthdate'  => 'required|date',
            'password'   => 'required|min:6',
        ]);

        $user = User::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json($user, 201);
    }

    public function show($id)
    {
        return User::findOrFail($id);
    }
}
