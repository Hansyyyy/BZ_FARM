<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Flock extends Model
{
    protected $fillable = [
        'batch_no', 'type', 'breed', 'initial_quantity', 'quantity',
        'age_weeks', 'date_in', 'mortality', 'status',
    ];

    protected function casts(): array
    {
        return [
            'date_in' => 'date',
        ];
    }

    public function getMortalityRateAttribute(): float
    {
        if ($this->initial_quantity === 0) {
            return 0;
        }

        return round(($this->mortality / $this->initial_quantity) * 100, 1);
    }
}
