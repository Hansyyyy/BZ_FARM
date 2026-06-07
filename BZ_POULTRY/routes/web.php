<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EggProductionController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\FlockController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MedicineController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'));

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::prefix('api')->group(function () {
        Route::get('/user', function () { return auth()->user(); });

        Route::get('/dashboard', [DashboardController::class, 'index'])->name('api.dashboard');

        Route::get('/flocks', [FlockController::class, 'index'])->name('api.flocks.index');
        Route::post('/flocks', [FlockController::class, 'store'])->name('api.flocks.store');
        Route::put('/flocks/{flock}', [FlockController::class, 'update'])->name('api.flocks.update');
        Route::delete('/flocks/{flock}', [FlockController::class, 'destroy'])->name('api.flocks.destroy');

        Route::get('/feed', [FeedController::class, 'index'])->name('api.feed.index');
        Route::post('/feed', [FeedController::class, 'store'])->name('api.feed.store');
        Route::delete('/feed/{feed}', [FeedController::class, 'destroy'])->name('api.feed.destroy');

        Route::get('/medicine', [MedicineController::class, 'index'])->name('api.medicine.index');
        Route::post('/medicine', [MedicineController::class, 'store'])->name('api.medicine.store');
        Route::delete('/medicine/{medicine}', [MedicineController::class, 'destroy'])->name('api.medicine.destroy');

        Route::get('/inventory', [InventoryController::class, 'index'])->name('api.inventory.index');
        Route::post('/inventory', [InventoryController::class, 'store'])->name('api.inventory.store');
        Route::delete('/inventory/{inventory}', [InventoryController::class, 'destroy'])->name('api.inventory.destroy');

        Route::get('/eggs', [EggProductionController::class, 'index'])->name('api.eggs.index');
        Route::post('/eggs', [EggProductionController::class, 'store'])->name('api.eggs.store');
        Route::delete('/eggs/{egg}', [EggProductionController::class, 'destroy'])->name('api.eggs.destroy');

        Route::get('/sales', [SalesController::class, 'index'])->name('api.sales.index');
        Route::post('/sales', [SalesController::class, 'store'])->name('api.sales.store');
        Route::delete('/sales/{sale}', [SalesController::class, 'destroy'])->name('api.sales.destroy');

        Route::get('/reports', [ReportsController::class, 'index'])->name('api.reports.index');
        Route::post('/reports', [ReportsController::class, 'generate'])->name('api.reports.generate');

        Route::middleware('role:admin')->group(function () {
            Route::get('/settings', [SettingsController::class, 'index'])->name('api.settings.index');
            Route::post('/settings', [SettingsController::class, 'store'])->name('api.settings.store');
            Route::post('/settings/users', [SettingsController::class, 'storeUser'])->name('api.settings.users.store');
            Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('api.settings.profile');
            Route::delete('/settings/users/{user}', [SettingsController::class, 'destroyUser'])->name('api.settings.users.destroy');
        });
    });

    Route::view('/dashboard', 'react-app')->name('dashboard');
    Route::view('/poultry-stock', 'react-app');
    Route::view('/feed-inventory', 'react-app');
    Route::view('/medicine-vaccine', 'react-app');
    Route::view('/inventory', 'react-app');
    Route::view('/egg-production', 'react-app');
    Route::view('/sales', 'react-app');
    Route::view('/reports', 'react-app');
    Route::view('/settings', 'react-app');
    Route::view('/{any}', 'react-app')->where('any', '.*');
});
