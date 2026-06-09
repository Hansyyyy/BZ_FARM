<?php

namespace App\Helpers;

use App\Models\Activity;
use App\Services\NotificationService;

class ActivityLogger
{
    public static function log(string $action, string $module, string $description): void
    {
        $activity = Activity::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => $module,
            'description' => $description,
        ]);

        if (auth()->user()?->isManager()) {
            app(NotificationService::class)->notifyAdmins(
                'manager_activity',
                'Manager Update',
                $description,
                self::linkForModule($module),
                "manager_activity_{$activity->id}",
            );
        }
    }

    protected static function linkForModule(string $module): string
    {
        $module = strtolower($module);

        if (str_contains($module, 'poultry') || str_contains($module, 'flock')) {
            return '/chicken-stock?tab=chicken';
        }

        if (str_contains($module, 'egg')) {
            return '/chicken-stock?tab=eggs';
        }

        if (str_contains($module, 'feed')) {
            return '/chicken-stock?tab=feeds';
        }

        if (str_contains($module, 'medicine') || str_contains($module, 'vaccine')) {
            return '/chicken-stock?tab=medicine';
        }

        if (str_contains($module, 'sale')) {
            return '/sales';
        }

        return '/dashboard';
    }
}
