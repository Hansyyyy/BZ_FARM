<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    protected $fillable = [
        'invoice_no', 'customer_id', 'product_id', 'sale_category',
        'egg_type', 'egg_lines', 'chicken_type',
        'quantity', 'quantity_heads', 'quantity_trays', 'quantity_pieces',
        'pricing_unit', 'unit_price', 'amount', 'payment_method', 'status',
        'sale_date', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'sale_date' => 'date',
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
            'egg_lines' => 'array',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
