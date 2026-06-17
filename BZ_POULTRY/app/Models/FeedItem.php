<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedItem extends Model
{
    protected $appends = ['status'];

    protected $fillable = [
        'name', 'category', 'stock', 'unit', 'reorder_level',
        'expiry_date', 'last_stock_in', 'cost_per_kg',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'last_stock_in' => 'date',
            'stock' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'cost_per_kg' => 'decimal:2',
        ];
    }

    public function getStatusAttribute(): string
    {
        if ($this->stock <= 0) {
            return 'No Stock';
        }
        if ($this->stock <= $this->reorder_level) {
            return 'Low Stock';
        }

        return 'In Stock';
    }
}
