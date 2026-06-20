<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EggProduction extends Model
{
    protected $fillable = [
        'date', 'building_id', 'total_eggs', 'soft_shell_eggs',
        'damaged_eggs', 'cracked_eggs',
        'small_eggs', 'medium_eggs', 'large_eggs',
        'extra_large_eggs', 'jumbo_eggs', 'super_jumbo_eggs', 'piwi_eggs',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getCrackedPercentAttribute(): float
    {
        if ($this->total_eggs === 0) {
            return 0;
        }

        return round(($this->cracked_eggs / $this->total_eggs) * 100, 1);
    }
}
