<?php

namespace Database\Seeders;

use App\Models\FeedItem;
use Illuminate\Database\Seeder;

class FeedItemsSeeder extends Seeder
{
    public function run(): void
    {
        $feedTypes = ['Booster', 'Starter', 'Grower', 'Prelay', 'Layer 1', 'Layer 2'];

        foreach ($feedTypes as $type) {
            FeedItem::updateOrCreate(
                ['name' => $type],
                [
                    'category' => null,
                    'stock' => 0,
                    'unit' => 'kg',
                    'reorder_level' => 0,
                    'expiry_date' => null,
                    'last_stock_in' => null,
                    'cost_per_kg' => 0,
                ]
            );
        }
    }
}
