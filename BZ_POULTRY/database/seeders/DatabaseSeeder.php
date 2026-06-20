<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Building;
use App\Models\Customer;
use App\Models\EggProduction;
use App\Models\FeedItem;
use App\Models\Flock;
use App\Models\InventoryItem;
use App\Models\MedicineItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create default user accounts for system access
        User::firstOrCreate(
            ['email' => 'admin@bzfarm.com'],
            [
                'name' => 'Admin User',
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        User::firstOrCreate(
            ['email' => 'manager@bzfarm.com'],
            [
                'name' => 'Manager User',
                'username' => 'manager',
                'password' => Hash::make('manager123'),
                'role' => 'manager',
            ]
        );

        // Seed buildings, flocks, feed items, and egg production
        $this->call([
            BuildingsSeeder::class,
            FlocksSeeder::class,
            FeedItemsSeeder::class,
            EggProductionSeeder::class,
            ProductsSeeder::class,
        ]);
    }
}
