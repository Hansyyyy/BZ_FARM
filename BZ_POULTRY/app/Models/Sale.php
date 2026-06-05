<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    protected $fillable = [
        'invoice_no', 'customer_id', 'product_id', 'quantity',
        'unit_price', 'amount', 'payment_method', 'status',
        'sale_date', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'sale_date' => 'date',
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
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
