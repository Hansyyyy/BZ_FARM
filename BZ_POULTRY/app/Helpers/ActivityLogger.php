<?php

namespace App\Helpers;

use App\Models\Activity;

class ActivityLogger
{
    public static function log(string $action, string $module, string $description): void
    {
        Activity::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => $module,
            'description' => $description,
        ]);
    }
}
