<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyReport extends Model
{
    protected $fillable = [
        'report_date',
        'submitted_by',
        'reviewed_by',
        'status',
        'notes',
        'snapshot',
        'submitted_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'snapshot' => 'array',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
