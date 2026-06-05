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

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/poultry-stock', [FlockController::class, 'index'])->name('flocks.index');
    Route::post('/poultry-stock', [FlockController::class, 'store'])->name('flocks.store');
    Route::put('/poultry-stock/{flock}', [FlockController::class, 'update'])->name('flocks.update');
    Route::delete('/poultry-stock/{flock}', [FlockController::class, 'destroy'])->name('flocks.destroy');

    Route::get('/feed-inventory', [FeedController::class, 'index'])->name('feed.index');
    Route::post('/feed-inventory', [FeedController::class, 'store'])->name('feed.store');
    Route::delete('/feed-inventory/{feed}', [FeedController::class, 'destroy'])->name('feed.destroy');

    Route::get('/medicine-vaccine', [MedicineController::class, 'index'])->name('medicine.index');
    Route::post('/medicine-vaccine', [MedicineController::class, 'store'])->name('medicine.store');
    Route::delete('/medicine-vaccine/{medicine}', [MedicineController::class, 'destroy'])->name('medicine.destroy');

    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store');
    Route::delete('/inventory/{inventory}', [InventoryController::class, 'destroy'])->name('inventory.destroy');

    Route::get('/egg-production', [EggProductionController::class, 'index'])->name('eggs.index');
    Route::post('/egg-production', [EggProductionController::class, 'store'])->name('eggs.store');
    Route::delete('/egg-production/{egg}', [EggProductionController::class, 'destroy'])->name('eggs.destroy');

    Route::get('/sales', [SalesController::class, 'index'])->name('sales.index');
    Route::post('/sales', [SalesController::class, 'store'])->name('sales.store');
    Route::delete('/sales/{sale}', [SalesController::class, 'destroy'])->name('sales.destroy');

    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::post('/reports/generate', [ReportsController::class, 'generate'])->name('reports.generate');

    Route::middleware('role:admin')->group(function () {
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings/users', [SettingsController::class, 'storeUser'])->name('settings.users.store');
        Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
        Route::delete('/settings/users/{user}', [SettingsController::class, 'destroyUser'])->name('settings.users.destroy');
    });
});
