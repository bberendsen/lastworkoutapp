<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'username'   => 'required|unique:users',
            'first_name' => 'required',
            'last_name'  => 'required',
            'birthdate'  => 'required|date',
            'email'      => 'sometimes|nullable|email|unique:users',
            'password'   => 'required|min:6',
        ];
    }
}
