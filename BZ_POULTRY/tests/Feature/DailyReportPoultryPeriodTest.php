<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\Flock;
use App\Models\FlockLossRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyReportPoultryPeriodTest extends TestCase
{
    use RefreshDatabase;

    public function test_poultry_section_uses_period_mortality_and_headcount(): void
    {
        $user = User::factory()->create(['username' => 'poultryperiod']);
        $building = Building::create(['name' => 'B-04']);

        $flock = Flock::create([
            'batch_no' => 'L-100',
            'building_name' => 'B-04',
            'building_id' => $building->id,
            'type' => 'Layers',
            'initial_quantity' => 5000,
            'quantity' => 4980,
            'date_in' => '2026-06-01',
            'status' => 'active',
        ]);

        FlockLossRecord::create([
            'record_date' => '2026-06-05',
            'flock_id' => $flock->id,
            'building_id' => $building->id,
            'type' => 'mortality',
            'quantity' => 12,
            'user_id' => $user->id,
        ]);

        FlockLossRecord::create([
            'record_date' => '2026-06-20',
            'flock_id' => $flock->id,
            'building_id' => $building->id,
            'type' => 'cull',
            'quantity' => 8,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/daily-reports/snapshot?start_date=2026-06-01&end_date=2026-06-27');

        $response->assertOk()
            ->assertJsonPath('snapshot.summary.mortality', 12)
            ->assertJsonPath('snapshot.summary.cull', 8);

        $poultry = $response->json('snapshot.poultry');
        $this->assertCount(1, $poultry);
        $this->assertSame('B-04', $poultry[0]['building']);
        $this->assertSame(20, $poultry[0]['mortality'] + $poultry[0]['cull']);
        $this->assertSame(4980, $poultry[0]['quantity']);
    }
}
