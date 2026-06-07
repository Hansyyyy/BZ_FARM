<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $users = User::latest()->get();
        // Fetch settings from session or create default settings
        $settings = [
            'farm_name' => session('farm_name', 'BZ Farm'),
            'owner_name' => session('owner_name', ''),
            'phone' => session('phone', ''),
            'email' => session('email', ''),
            'address' => session('address', ''),
        ];

        if ($request->wantsJson()) {
            return response()->json(['users' => $users, 'settings' => $settings]);
        }

        return view('settings.index', compact('users', 'settings'));
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

        session(['farm_name' => $data['farm_name'] ?? 'BZ Farm']);
        session(['owner_name' => $data['owner_name'] ?? '']);
        session(['phone' => $data['phone'] ?? '']);
        session(['email' => $data['email'] ?? '']);
        session(['address' => $data['address'] ?? '']);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Settings updated successfully.']);
        }

        return back()->with('success', 'Settings updated successfully.');
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

        if ($request->wantsJson()) {
            return response()->json(['message' => 'User created successfully.', 'user' => $user], 201);
        }

        return back()->with('success', 'User created successfully.');
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
                if ($request->wantsJson()) {
                    return response()->json(['errors' => ['current_password' => 'Current password is incorrect.']], 422);
                }
                return back()->withErrors(['current_password' => 'Current password is incorrect.']);
            }
            $user->password = $data['password'];
        }

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->save();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Profile updated successfully.', 'user' => $user]);
        }

        return back()->with('success', 'Profile updated successfully.');
    }

    public function destroyUser(Request $request, User $user)
    {
        if ($user->id === auth()->id()) {
            if ($request->wantsJson()) {
                return response()->json(['errors' => ['error' => 'You cannot delete your own account.']], 422);
            }

            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        $user->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'User deleted successfully.']);
        }

        return back()->with('success', 'User deleted successfully.');
    }
}
