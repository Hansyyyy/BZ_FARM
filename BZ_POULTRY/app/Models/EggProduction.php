<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EggProduction extends Model
{
    protected $fillable = [
        'date', 'building_id', 'flock_id', 'total_eggs', 'soft_shell_eggs',
        'damaged_eggs', 'cracked_eggs',
        'small_eggs', 'medium_eggs', 'large_eggs',
        'extra_large_eggs', 'jumbo_eggs', 'super_jumbo_eggs', 'piwi_eggs',
        'user_id',
    ];

    public static function addOrUpdateForDate(array $data): self
    {
        $date = $data['date'] ?? now()->toDateString();
        $buildingId = $data['building_id'];

        $existing = static::whereDate('date', $date)
            ->where('building_id', $buildingId)
            ->first();

        if ($existing) {
            $numericFields = [
                'total_eggs',
                'soft_shell_eggs',
                'damaged_eggs',
                'cracked_eggs',
                'small_eggs',
                'medium_eggs',
                'large_eggs',
                'extra_large_eggs',
                'jumbo_eggs',
                'super_jumbo_eggs',
                'piwi_eggs',
            ];

            foreach ($numericFields as $field) {
                $existing->{$field} = (int) ($existing->{$field} ?? 0) + (int) ($data[$field] ?? 0);
            }

            if (! empty($data['user_id'])) {
                $existing->user_id = $data['user_id'];
            }

            $existing->save();

            return $existing;
        }

        return static::create($data);
    }

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

    public function flock(): BelongsTo
    {
        return $this->belongsTo(Flock::class);
    }

    public function getCrackedPercentAttribute(): float
    {
        if ($this->total_eggs === 0) {
            return 0;
        }

        return round(($this->cracked_eggs / $this->total_eggs) * 100, 1);
    }
}
