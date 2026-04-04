<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompletePasswordResetRequest;
use App\Http\Requests\SendPasswordResetCodeRequest;
use App\Http\Requests\VerifyPasswordResetCodeRequest;
use App\Http\Responses\CompletePasswordResetErrorResponse;
use App\Http\Responses\LoginApiResponse;
use App\Http\Responses\SendPasswordResetCodeResponse;
use App\Http\Responses\VerifyPasswordResetCodeErrorResponse;
use App\Http\Responses\VerifyPasswordResetCodeResponse;
use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    /**
     * Send a 6-digit code to the user's email (valid for 1 minute).
     */
    public function sendCode(SendPasswordResetCodeRequest $request)
    {
        $user = User::where('email', $request->validated('email'))->first();

        if ($user && $user->email) {
            PasswordResetCode::where('user_id', $user->id)->delete();

            $code = (string) random_int(100000, 999999);

            PasswordResetCode::create([
                'user_id' => $user->id,
                'code_hash' => Hash::make($code),
                'code_expires_at' => now()->addMinute(),
            ]);

            Mail::to($user->email)->send(new PasswordResetCodeMail($code));
        }

        return response()->json(SendPasswordResetCodeResponse::make());
    }

    /**
     * Verify the 6-digit code; returns a reset token for the final step.
     */
    public function verifyCode(VerifyPasswordResetCodeRequest $request)
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user) {
            return response()->json(VerifyPasswordResetCodeErrorResponse::invalidOrExpired(), 422);
        }

        $reset = PasswordResetCode::where('user_id', $user->id)->first();

        if (! $reset || ! $reset->code_hash || ! $reset->code_expires_at) {
            return response()->json(VerifyPasswordResetCodeErrorResponse::invalidOrExpired(), 422);
        }

        if (now()->isAfter($reset->code_expires_at)) {
            return response()->json(VerifyPasswordResetCodeErrorResponse::codeExpired(), 422);
        }

        if (! Hash::check($request->validated('code'), $reset->code_hash)) {
            return response()->json(VerifyPasswordResetCodeErrorResponse::invalidOrExpired(), 422);
        }

        $plainToken = Str::random(64);

        $reset->code_hash = null;
        $reset->code_expires_at = null;
        $reset->reset_token_hash = Hash::make($plainToken);
        $reset->reset_token_expires_at = now()->addMinutes(15);
        $reset->save();

        return response()->json(VerifyPasswordResetCodeResponse::fromPlainToken($plainToken));
    }

    /**
     * Set a new password and return a fresh API token (logged in).
     */
    public function resetPassword(CompletePasswordResetRequest $request)
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json(CompletePasswordResetErrorResponse::invalidSession(), 422);
        }

        $reset = PasswordResetCode::where('user_id', $user->id)->first();

        if (! $reset || ! $reset->reset_token_hash || ! $reset->reset_token_expires_at) {
            return response()->json(CompletePasswordResetErrorResponse::invalidSession(), 422);
        }

        if (now()->isAfter($reset->reset_token_expires_at)) {
            return response()->json(CompletePasswordResetErrorResponse::resetTokenExpired(), 422);
        }

        if (! Hash::check($validated['reset_token'], $reset->reset_token_hash)) {
            return response()->json(CompletePasswordResetErrorResponse::invalidSession(), 422);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        $reset->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(LoginApiResponse::from($user, $token));
    }
}
