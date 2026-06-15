<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryAndDailyReportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_reports_endpoint_returns_successful_response(): void
    {
        $user = User::factory()->create([
            'username' => 'dailyreporttester',
        ]);

        $response = $this->actingAs($user)->getJson('/api/daily-reports');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'reports',
                'today',
                'pending_review_count',
            ]);
    }

    public function test_inventory_endpoint_returns_successful_response(): void
    {
        $user = User::factory()->create([
            'username' => 'inventorytester',
        ]);

        $response = $this->actingAs($user)->getJson('/api/inventory');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'items',
                'pagination',
                'summary',
                'byCategory',
                'recentTransactions',
                'lowStockAlerts',
                'monthlyMovement',
            ]);
    }
}
