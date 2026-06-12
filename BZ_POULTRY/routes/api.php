<?php

use App\Http\Controllers\Api\AdminInventoryController;
use App\Http\Controllers\Api\CalendarNoteController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EggProductionController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\FlockController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportsController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/user', fn () => auth()->user());

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('api.dashboard');

    Route::get('/calendar-notes', [CalendarNoteController::class, 'index'])->name('api.calendar-notes.index');
    Route::post('/calendar-notes', [CalendarNoteController::class, 'store'])->name('api.calendar-notes.store');
    Route::put('/calendar-notes/{calendarNote}', [CalendarNoteController::class, 'update'])->name('api.calendar-notes.update');
    Route::delete('/calendar-notes/{calendarNote}', [CalendarNoteController::class, 'destroy'])->name('api.calendar-notes.destroy');

    Route::get('/flocks', [FlockController::class, 'index'])->name('api.flocks.index');
    Route::post('/flocks', [FlockController::class, 'store'])->name('api.flocks.store');
    Route::put('/flocks/{flock}', [FlockController::class, 'update'])->name('api.flocks.update');
    Route::delete('/flocks/{flock}', [FlockController::class, 'destroy'])->name('api.flocks.destroy');

    Route::get('/feed', [FeedController::class, 'index'])->name('api.feed.index');
    Route::post('/feed', [FeedController::class, 'store'])->name('api.feed.store');
    Route::put('/feed/{feed}', [FeedController::class, 'update'])->name('api.feed.update');
    Route::delete('/feed/{feed}', [FeedController::class, 'destroy'])->name('api.feed.destroy');

    Route::get('/medicine', [MedicineController::class, 'index'])->name('api.medicine.index');
    Route::post('/medicine', [MedicineController::class, 'store'])->name('api.medicine.store');
    Route::put('/medicine/{medicine}', [MedicineController::class, 'update'])->name('api.medicine.update');
    Route::delete('/medicine/{medicine}', [MedicineController::class, 'destroy'])->name('api.medicine.destroy');

    Route::get('/inventory', [InventoryController::class, 'index'])->name('api.inventory.index');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('api.inventory.store');
    Route::put('/inventory/{inventory}', [InventoryController::class, 'update'])->name('api.inventory.update');
    Route::delete('/inventory/{inventory}', [InventoryController::class, 'destroy'])->name('api.inventory.destroy');

    Route::get('/eggs', [EggProductionController::class, 'index'])->name('api.eggs.index');
    Route::post('/eggs', [EggProductionController::class, 'store'])->name('api.eggs.store');
    Route::put('/eggs/{egg}', [EggProductionController::class, 'update'])->name('api.eggs.update');
    Route::delete('/eggs/{egg}', [EggProductionController::class, 'destroy'])->name('api.eggs.destroy');

    Route::get('/sales', [SalesController::class, 'index'])->name('api.sales.index');
    Route::post('/sales', [SalesController::class, 'store'])->name('api.sales.store');
    Route::put('/sales/{sale}', [SalesController::class, 'update'])->name('api.sales.update');
    Route::delete('/sales/{sale}', [SalesController::class, 'destroy'])->name('api.sales.destroy');

    Route::get('/customers', [CustomerController::class, 'index'])->name('api.customers.index');
    Route::post('/customers', [CustomerController::class, 'store'])->name('api.customers.store');

    Route::get('/reports', [ReportsController::class, 'index'])->name('api.reports.index');
    Route::post('/reports/generate', [ReportsController::class, 'generate'])->name('api.reports.generate');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('api.notifications.index');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('api.notifications.read-all');
    Route::post('/notifications/{userNotification}/read', [NotificationController::class, 'markRead'])->name('api.notifications.read');

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/inventory', [AdminInventoryController::class, 'index'])->name('api.admin.inventory');

        Route::get('/settings', [SettingsController::class, 'index'])->name('api.settings.index');
        Route::post('/settings', [SettingsController::class, 'store'])->name('api.settings.store');
        Route::post('/settings/users', [SettingsController::class, 'storeUser'])->name('api.settings.users.store');
        Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('api.settings.profile');
        Route::delete('/settings/users/{user}', [SettingsController::class, 'destroyUser'])->name('api.settings.users.destroy');
    });
});
