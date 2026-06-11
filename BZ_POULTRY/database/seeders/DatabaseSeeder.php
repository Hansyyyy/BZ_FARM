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
        User::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@bzfarm.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Manager User',
            'username' => 'manager',
            'email' => 'manager@bzfarm.com',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
        ]);

        // Create default buildings for infrastructure
        for ($i = 1; $i <= 11; $i++) {
            Building::create(['name' => "Building {$i}"]);
        }
    }
}
