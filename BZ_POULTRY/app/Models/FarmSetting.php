<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FarmSetting extends Model
{
    protected $fillable = [
        'farm_name',
        'owner_name',
        'phone',
        'email',
        'address',
    ];

    public static function current(): self
    {
        return static::firstOrCreate([], [
            'farm_name' => 'BZ Farm',
            'owner_name' => '',
            'phone' => '',
            'email' => '',
            'address' => '',
        ]);
    }

    public function toSettingsArray(): array
    {
        return $this->only([
            'farm_name',
            'owner_name',
            'phone',
            'email',
            'address',
        ]);
    }
}
