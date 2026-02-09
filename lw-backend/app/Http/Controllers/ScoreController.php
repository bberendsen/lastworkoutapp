<?php

namespace App\Http\Controllers;

use App\Models\Score;
use Illuminate\Http\Request;

class ScoreController extends Controller
{
    public function store(Request $request, $userId)
    {
        $validated = $request->validate([
            'score' => 'required|numeric',
        ]);

        $score = Score::create([
            'user_id' => $userId,
            'score' => $validated['score'],
            ]);

        return response()->json($score);
    }

    public function show($userId)
    {
        $score = Score::where('user_id', $userId)->get();
        if ($score->isEmpty()) {
            return response()->json(['message' => 'No score found'], 404);
        }
        return response()->json($score);
    }
}
