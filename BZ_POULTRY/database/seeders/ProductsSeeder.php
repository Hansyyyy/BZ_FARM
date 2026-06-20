<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'Piwi Eggs', 'unit' => 'tray', 'unit_price' => 180],
            ['name' => 'Small Eggs', 'unit' => 'tray', 'unit_price' => 190],
            ['name' => 'Medium Eggs', 'unit' => 'tray', 'unit_price' => 200],
            ['name' => 'Large Eggs', 'unit' => 'tray', 'unit_price' => 210],
            ['name' => 'Extra Large Eggs', 'unit' => 'tray', 'unit_price' => 220],
            ['name' => 'Jumbo Eggs', 'unit' => 'tray', 'unit_price' => 230],
            ['name' => 'Super Jumbo Eggs', 'unit' => 'tray', 'unit_price' => 240],
            ['name' => 'Grower Chicken', 'unit' => 'head', 'unit_price' => 150],
            ['name' => 'Layer Chicken', 'unit' => 'head', 'unit_price' => 180],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['name' => $product['name']],
                [
                    'unit' => $product['unit'],
                    'unit_price' => $product['unit_price'],
                ]
            );
        }
    }
}
