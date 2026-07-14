<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required'],
        ]);

        if (Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password']], $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));
        }

        return back()->withErrors([
            'username' => 'Invalid username or password.',
        ])->onlyInput('username');
    }

    public function showResetPassword()
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return view('auth.reset-password');
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6'],
            'password_confirmation' => ['required', 'string', 'same:password'],
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user) {
            return back()->withErrors([
                'username' => 'User not found.',
            ])->onlyInput('username');
        }

        // Only allow admin and manager roles to reset password
        if (!in_array($user->role, ['admin', 'manager'])) {
            return back()->withErrors([
                'username' => 'Password reset is only available for admin and manager accounts.',
            ])->onlyInput('username');
        }

        // Update the password
        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->route('login')->with('success', 'Password has been reset successfully. Please login with your new password.');
    }

    public function logout(Request $request)
    {
        // Keep remember-me login persistent even after explicit logout request.
        if (Auth::viaRemember()) {
            $request->session()->regenerate();
            $request->session()->regenerateToken();

            return redirect()->route('login');
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
