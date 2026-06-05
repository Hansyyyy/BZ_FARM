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
        $admin = User::create([
            'name' => 'Admin User',
            'username' => 'admin',
            'email' => 'admin@bzfarm.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        $manager = User::create([
            'name' => 'Manager User',
            'username' => 'manager',
            'email' => 'manager@bzfarm.com',
            'password' => Hash::make('manager123'),
            'role' => 'manager',
        ]);

        $flocks = [
            ['batch_no' => 'FLK-001', 'type' => 'layers', 'breed' => 'Rhode Island Red', 'initial_quantity' => 500, 'quantity' => 485, 'age_weeks' => 32, 'date_in' => '2025-08-15', 'mortality' => 15],
            ['batch_no' => 'FLK-002', 'type' => 'layers', 'breed' => 'Leghorn', 'initial_quantity' => 600, 'quantity' => 580, 'age_weeks' => 28, 'date_in' => '2025-09-01', 'mortality' => 20],
            ['batch_no' => 'FLK-003', 'type' => 'layers', 'breed' => 'Native', 'initial_quantity' => 550, 'quantity' => 535, 'age_weeks' => 36, 'date_in' => '2025-07-10', 'mortality' => 15],
            ['batch_no' => 'FLK-004', 'type' => 'pullets', 'breed' => 'Rhode Island Red', 'initial_quantity' => 300, 'quantity' => 295, 'age_weeks' => 16, 'date_in' => '2025-11-01', 'mortality' => 5],
            ['batch_no' => 'FLK-005', 'type' => 'pullets', 'breed' => 'Leghorn', 'initial_quantity' => 200, 'quantity' => 198, 'age_weeks' => 14, 'date_in' => '2025-11-15', 'mortality' => 2],
            ['batch_no' => 'FLK-006', 'type' => 'roosters', 'breed' => 'Native', 'initial_quantity' => 150, 'quantity' => 145, 'age_weeks' => 40, 'date_in' => '2025-06-01', 'mortality' => 5],
            ['batch_no' => 'FLK-007', 'type' => 'roosters', 'breed' => 'Rhode Island Red', 'initial_quantity' => 100, 'quantity' => 98, 'age_weeks' => 38, 'date_in' => '2025-06-15', 'mortality' => 2],
            ['batch_no' => 'FLK-008', 'type' => 'layers', 'breed' => 'Native', 'initial_quantity' => 250, 'quantity' => 242, 'age_weeks' => 24, 'date_in' => '2025-10-01', 'mortality' => 8],
        ];

        foreach ($flocks as $flock) {
            Flock::create(array_merge($flock, ['status' => 'active']));
        }

        $feeds = [
            ['name' => 'Layer Feed Premium', 'category' => 'Layers', 'stock' => 1500, 'reorder_level' => 500, 'expiry_date' => '2026-12-01', 'last_stock_in' => '2026-05-20', 'cost_per_kg' => 38.50],
            ['name' => 'Chick Starter Crumble', 'category' => 'Chick Starter', 'stock' => 800, 'reorder_level' => 300, 'expiry_date' => '2026-10-15', 'last_stock_in' => '2026-05-15', 'cost_per_kg' => 42.00],
            ['name' => 'Grower Pellets', 'category' => 'Pellets', 'stock' => 1200, 'reorder_level' => 400, 'expiry_date' => '2026-11-30', 'last_stock_in' => '2026-05-18', 'cost_per_kg' => 36.75],
            ['name' => 'Booster Mix', 'category' => 'Boosters', 'stock' => 350, 'reorder_level' => 200, 'expiry_date' => '2026-09-01', 'last_stock_in' => '2026-05-10', 'cost_per_kg' => 45.00],
            ['name' => 'Layer Mash', 'category' => 'Layers', 'stock' => 200, 'reorder_level' => 300, 'expiry_date' => '2026-08-20', 'last_stock_in' => '2026-04-25', 'cost_per_kg' => 37.00],
            ['name' => 'Corn Supplement', 'category' => 'Boosters', 'stock' => 600, 'reorder_level' => 250, 'expiry_date' => '2027-01-15', 'last_stock_in' => '2026-05-22', 'cost_per_kg' => 28.50],
        ];

        foreach ($feeds as $feed) {
            FeedItem::create($feed);
        }

        $medicines = [
            ['name' => 'Vitamin B Complex', 'category' => 'Medicine', 'type' => 'Vitamin', 'stock' => 50, 'reorder_level' => 20, 'expiry_date' => '2026-08-15', 'last_stock_in' => '2026-04-01', 'unit_price' => 250],
            ['name' => 'Newcastle Vaccine', 'category' => 'Vaccine', 'type' => 'Vaccine', 'stock' => 30, 'reorder_level' => 15, 'expiry_date' => '2026-07-01', 'last_stock_in' => '2026-03-15', 'unit_price' => 180],
            ['name' => 'Antibiotics Powder', 'category' => 'Medicine', 'type' => 'Antibiotic', 'stock' => 25, 'reorder_level' => 10, 'expiry_date' => '2026-09-30', 'last_stock_in' => '2026-05-01', 'unit_price' => 320],
            ['name' => 'Dewormer Solution', 'category' => 'Medicine', 'type' => 'Supplement', 'stock' => 15, 'reorder_level' => 10, 'expiry_date' => '2026-06-20', 'last_stock_in' => '2026-02-10', 'unit_price' => 450],
            ['name' => 'Marek Vaccine', 'category' => 'Vaccine', 'type' => 'Vaccine', 'stock' => 40, 'reorder_level' => 15, 'expiry_date' => '2026-10-01', 'last_stock_in' => '2026-04-20', 'unit_price' => 200],
            ['name' => 'Electrolyte Mix', 'category' => 'Medicine', 'type' => 'Supplement', 'stock' => 8, 'reorder_level' => 10, 'expiry_date' => '2026-11-15', 'last_stock_in' => '2026-01-05', 'unit_price' => 150],
        ];

        foreach ($medicines as $med) {
            MedicineItem::create($med);
        }

        $inventory = [
            ['item_code' => 'INV-001', 'name' => 'Feeding Trays', 'category' => 'Equipment', 'stock' => 50, 'unit' => 'pcs', 'reorder_level' => 20, 'location' => 'Warehouse 1', 'unit_price' => 350, 'last_updated' => now()],
            ['item_code' => 'INV-002', 'name' => 'Water Dispensers', 'category' => 'Equipment', 'stock' => 30, 'unit' => 'pcs', 'reorder_level' => 15, 'location' => 'Warehouse 1', 'unit_price' => 280, 'last_updated' => now()],
            ['item_code' => 'INV-003', 'name' => 'Egg Trays', 'category' => 'Supplies', 'stock' => 200, 'unit' => 'pcs', 'reorder_level' => 50, 'location' => 'Warehouse 2', 'unit_price' => 45, 'last_updated' => now()],
            ['item_code' => 'INV-004', 'name' => 'Cleaning Disinfectant', 'category' => 'Supplies', 'stock' => 25, 'unit' => 'bottle', 'reorder_level' => 10, 'location' => 'Warehouse 2', 'unit_price' => 180, 'last_updated' => now()],
            ['item_code' => 'INV-005', 'name' => 'Heat Lamps', 'category' => 'Equipment', 'stock' => 12, 'unit' => 'pcs', 'reorder_level' => 5, 'location' => 'Warehouse 1', 'unit_price' => 650, 'last_updated' => now()],
            ['item_code' => 'INV-006', 'name' => 'Nesting Boxes', 'category' => 'Equipment', 'stock' => 40, 'unit' => 'pcs', 'reorder_level' => 15, 'location' => 'Warehouse 1', 'unit_price' => 420, 'last_updated' => now()],
        ];

        foreach ($inventory as $item) {
            InventoryItem::create($item);
        }

        $buildings = ['Building 1', 'Building 2', 'Building 3', 'Building 4'];
        foreach ($buildings as $name) {
            Building::create(['name' => $name]);
        }

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            foreach (Building::all() as $building) {
                $total = rand(250, 350);
                $cracked = rand(5, 25);
                EggProduction::create([
                    'date' => $date,
                    'building_id' => $building->id,
                    'total_eggs' => $total,
                    'good_eggs' => $total - $cracked,
                    'cracked_eggs' => $cracked,
                    'user_id' => $manager->id,
                ]);
            }
        }

        $customers = [
            ['name' => 'Juan Dela Cruz', 'contact' => 'Juan', 'phone' => '09171234567'],
            ['name' => 'Maria Santos', 'contact' => 'Maria', 'phone' => '09181234567'],
            ['name' => 'Pedro Garcia', 'contact' => 'Pedro', 'phone' => '09191234567'],
            ['name' => 'Ana Reyes', 'contact' => 'Ana', 'phone' => '09201234567'],
            ['name' => 'Local Market Co.', 'contact' => 'Market Manager', 'phone' => '09221234567'],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }

        $products = [
            ['name' => 'Eggs Large', 'unit' => 'tray', 'unit_price' => 210],
            ['name' => 'Eggs Medium', 'unit' => 'tray', 'unit_price' => 190],
            ['name' => 'Eggs Jumbo', 'unit' => 'tray', 'unit_price' => 230],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }

        for ($i = 0; $i < 15; $i++) {
            $product = Product::inRandomOrder()->first();
            $customer = Customer::inRandomOrder()->first();
            $qty = rand(5, 30);
            Sale::create([
                'invoice_no' => 'INV-2026-'.str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'customer_id' => $customer->id,
                'product_id' => $product->id,
                'quantity' => $qty,
                'unit_price' => $product->unit_price,
                'amount' => $qty * $product->unit_price,
                'payment_method' => rand(0, 1) ? 'cash' : 'credit',
                'status' => rand(0, 1) ? 'paid' : 'unpaid',
                'sale_date' => Carbon::today()->subDays(rand(0, 30)),
                'user_id' => $manager->id,
            ]);
        }

        $transactions = [
            ['item_type' => 'feed', 'item_id' => 1, 'type' => 'in', 'quantity' => 500, 'reference' => 'PO-2026-001'],
            ['item_type' => 'feed', 'item_id' => 1, 'type' => 'out', 'quantity' => 120, 'reference' => 'Daily Feed'],
            ['item_type' => 'feed', 'item_id' => 3, 'type' => 'out', 'quantity' => 80, 'reference' => 'Daily Feed'],
            ['item_type' => 'medicine', 'item_id' => 1, 'type' => 'out', 'quantity' => 5, 'reference' => 'Weekly Dose'],
            ['item_type' => 'medicine', 'item_id' => 2, 'type' => 'in', 'quantity' => 20, 'reference' => 'PO-2026-002'],
            ['item_type' => 'inventory', 'item_id' => 3, 'type' => 'out', 'quantity' => 30, 'reference' => 'Egg Packing'],
            ['item_type' => 'inventory', 'item_id' => 1, 'type' => 'in', 'quantity' => 10, 'reference' => 'PO-2026-003'],
        ];

        foreach ($transactions as $txn) {
            StockTransaction::create(array_merge($txn, ['user_id' => $manager->id]));
        }

        $activities = [
            ['user_id' => $manager->id, 'action' => 'created', 'module' => 'Feed Inventory', 'description' => 'Added new food stock - Layer Feed Premium'],
            ['user_id' => $manager->id, 'action' => 'updated', 'module' => 'Egg Production', 'description' => 'Updated egg production for Building 1'],
            ['user_id' => $admin->id, 'action' => 'created', 'module' => 'Poultry Stock', 'description' => 'Added new flock FLK-008'],
            ['user_id' => $manager->id, 'action' => 'created', 'module' => 'Sales', 'description' => 'Recorded new sale INV-2026-0015'],
            ['user_id' => $manager->id, 'action' => 'created', 'module' => 'Medicine & Vaccine', 'description' => 'Stock in Newcastle Vaccine'],
            ['user_id' => $admin->id, 'action' => 'created', 'module' => 'Inventory', 'description' => 'Added new inventory item INV-006'],
        ];

        foreach ($activities as $activity) {
            Activity::create($activity);
        }
    }
}
