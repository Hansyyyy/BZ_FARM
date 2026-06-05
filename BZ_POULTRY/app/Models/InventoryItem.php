<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'item_code', 'name', 'category', 'stock', 'unit',
        'reorder_level', 'location', 'unit_price', 'last_updated',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'last_updated' => 'datetime',
        ];
    }

    public function getStatusAttribute(): string
    {
        if ($this->stock <= 0) {
            return 'out_of_stock';
        }
        if ($this->stock <= $this->reorder_level) {
            return 'low_stock';
        }

        return 'in_stock';
    }
}
