<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    public function index()
    {
        return response()->json([
            'users' => User::latest()->get(),
            'settings' => [
                'farm_name' => session('farm_name', 'BZ Farm'),
                'owner_name' => session('owner_name', ''),
                'phone' => session('phone', ''),
                'email' => session('email', ''),
                'address' => session('address', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'farm_name' => 'nullable|string|max:255',
            'owner_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string|max:500',
        ]);

        session([
            'farm_name' => $data['farm_name'] ?? 'BZ Farm',
            'owner_name' => $data['owner_name'] ?? '',
            'phone' => $data['phone'] ?? '',
            'email' => $data['email'] ?? '',
            'address' => $data['address'] ?? '',
        ]);

        return response()->json(['message' => 'Settings updated successfully.']);
    }

    public function storeUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|unique:users|max:255',
            'email' => 'required|email|unique:users',
            'password' => ['required', Password::min(6)],
            'role' => 'required|in:admin,manager',
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json(['message' => 'User created successfully.', 'user' => $user], 201);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$user->id,
            'current_password' => 'nullable|required_with:password',
            'password' => ['nullable', 'confirmed', Password::min(6)],
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check($data['current_password'], $user->password)) {
                return response()->json(['errors' => ['current_password' => 'Current password is incorrect.']], 422);
            }
            $user->password = $data['password'];
        }

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->save();

        return response()->json(['message' => 'Profile updated successfully.', 'user' => $user]);
    }

    public function destroyUser(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['errors' => ['error' => 'You cannot delete your own account.']], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}
