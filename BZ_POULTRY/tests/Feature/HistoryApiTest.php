<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HistoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_history_endpoint_filters_inventory_and_sales_by_date_range(): void
    {
        $user = User::factory()->create([
            'username' => 'historyfiltertester',
        ]);

        $oldActivity = Activity::create([
            'user_id' => $user->id,
            'action' => 'created',
            'module' => 'Inventory',
            'description' => 'Old inventory update',
        ]);
        $oldActivity->update(['created_at' => '2024-01-10 08:00:00']);

        $newActivity = Activity::create([
            'user_id' => $user->id,
            'action' => 'updated',
            'module' => 'Inventory',
            'description' => 'New inventory update',
        ]);
        $newActivity->update(['created_at' => '2024-01-20 08:00:00']);

        $customer = Customer::create(['name' => 'Alice']);
        $product = Product::create(['name' => 'Egg Tray', 'unit' => 'tray', 'unit_price' => 150]);

        $oldSale = Sale::create([
            'invoice_no' => 'INV-OLD',
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'quantity' => 5,
            'unit_price' => 150,
            'amount' => 750,
            'payment_method' => 'cash',
            'status' => 'paid',
            'sale_date' => '2024-01-10',
            'user_id' => $user->id,
        ]);
        $oldSale->update(['created_at' => '2024-01-10 09:00:00']);

        $newSale = Sale::create([
            'invoice_no' => 'INV-NEW',
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'quantity' => 8,
            'unit_price' => 150,
            'amount' => 1200,
            'payment_method' => 'cash',
            'status' => 'paid',
            'sale_date' => '2024-01-20',
            'user_id' => $user->id,
        ]);
        $newSale->update(['created_at' => '2024-01-20 09:00:00']);

        $inventoryResponse = $this->actingAs($user)->getJson('/api/history?type=inventory&start_date=2024-01-15&end_date=2024-01-25');
        $inventoryResponse->assertStatus(200)
            ->assertJsonPath('type', 'inventory')
            ->assertJsonCount(1, 'items');

        $salesResponse = $this->actingAs($user)->getJson('/api/history?type=sales&start_date=2024-01-15&end_date=2024-01-25');
        $salesResponse->assertStatus(200)
            ->assertJsonPath('type', 'sales')
            ->assertJsonCount(1, 'items');
    }
}
