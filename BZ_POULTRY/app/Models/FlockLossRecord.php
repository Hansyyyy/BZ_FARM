<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlockLossRecord extends Model
{
    protected $fillable = [
        'record_date', 'flock_id', 'building_id', 'type', 'quantity', 'reason', 'notes', 'user_id',
    ];

    protected $casts = [
        'record_date' => 'date',
    ];

    public function flock(): BelongsTo
    {
        return $this->belongsTo(Flock::class);
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
