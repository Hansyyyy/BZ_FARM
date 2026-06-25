<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Building;

class StockTransaction extends Model
{
    protected $fillable = [
        'item_type', 'item_id', 'type', 'quantity', 'building_id',
        'reference', 'user_id', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function getItemNameAttribute(): string
    {
        $model = match ($this->item_type) {
            'feed' => FeedItem::find($this->item_id),
            'medicine' => MedicineItem::find($this->item_id),
            'inventory' => InventoryItem::find($this->item_id),
            default => null,
        };

        return $model?->name ?? 'Unknown';
    }
}
