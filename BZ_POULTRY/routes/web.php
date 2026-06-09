<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'));

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    require __DIR__.'/api.php';

    Route::view('/dashboard', 'react-app')->name('dashboard');
    Route::view('/chicken-stock', 'react-app');
    Route::view('/daily-reports', 'react-app');
    Route::view('/sales', 'react-app');
    Route::view('/settings', 'react-app');
    Route::view('/{any}', 'react-app')->where('any', '.*');
});
