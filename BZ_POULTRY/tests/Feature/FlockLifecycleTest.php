<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\Flock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FlockLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_batch_is_inserted_and_requires_building_to_be_free(): void
    {
        $user = User::factory()->create(['username' => 'flocklifecycle']);
        Building::create(['name' => 'B-01']);

        Flock::create([
            'batch_no' => 'G-001',
            'building_name' => 'B-01',
            'building_id' => 1,
            'type' => 'Growers',
            'initial_quantity' => 1000,
            'quantity' => 1000,
            'date_in' => now()->toDateString(),
            'status' => 'active',
        ]);

        $blocked = $this->actingAs($user)->postJson('/api/flocks', [
            'batch_no' => 'G-002',
            'building_name' => 'B-01',
            'type' => 'Growers',
            'quantity' => 900,
        ]);

        $blocked->assertStatus(422)
            ->assertJsonFragment(['message' => 'This building already has an active batch. Close the current batch before adding a new one.']);

        $existing = Flock::where('batch_no', 'G-001')->first();

        $this->actingAs($user)->postJson("/api/flocks/{$existing->id}/close", [
            'closed_reason' => 'cycle_end',
        ])->assertOk();

        $created = $this->actingAs($user)->postJson('/api/flocks', [
            'batch_no' => 'G-002',
            'building_name' => 'B-01',
            'type' => 'Growers',
            'quantity' => 900,
        ]);

        $created->assertCreated();
        $this->assertDatabaseHas('flocks', [
            'batch_no' => 'G-001',
            'status' => 'closed',
        ]);
        $this->assertDatabaseHas('flocks', [
            'batch_no' => 'G-002',
            'status' => 'active',
        ]);
    }

    public function test_close_batch_preserves_history_and_frees_building(): void
    {
        $user = User::factory()->create(['username' => 'flocklifecycle']);
        Building::create(['name' => 'B-04']);

        $flock = Flock::create([
            'batch_no' => 'L-001',
            'building_name' => 'B-04',
            'building_id' => 1,
            'type' => 'Layers',
            'initial_quantity' => 5000,
            'quantity' => 4800,
            'mortality' => 150,
            'cull' => 50,
            'date_in' => now()->subMonths(6)->toDateString(),
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->postJson("/api/flocks/{$flock->id}/close", [
            'closed_reason' => 'replaced',
        ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Batch closed successfully. The building is now available for a new batch.']);

        $flock->refresh();
        $this->assertSame('closed', $flock->status);
        $this->assertSame('replaced', $flock->closed_reason);
        $this->assertSame(4800, $flock->quantity);
        $this->assertSame(150, $flock->mortality);
        $this->assertNotNull($flock->date_out);
    }
}
