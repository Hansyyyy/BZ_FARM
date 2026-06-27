<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\EggProduction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyReportRangeSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_snapshot_aggregates_data_across_date_range(): void
    {
        $user = User::factory()->create(['username' => 'reportrange']);
        $building = Building::create(['name' => 'B-04']);

        EggProduction::create([
            'date' => '2026-06-01',
            'building_id' => $building->id,
            'total_eggs' => 100,
            'soft_shell_eggs' => 0,
            'damaged_eggs' => 0,
            'cracked_eggs' => 0,
            'user_id' => $user->id,
        ]);

        EggProduction::create([
            'date' => '2026-06-27',
            'building_id' => $building->id,
            'total_eggs' => 250,
            'soft_shell_eggs' => 0,
            'damaged_eggs' => 0,
            'cracked_eggs' => 0,
            'user_id' => $user->id,
        ]);

        EggProduction::create([
            'date' => '2026-07-01',
            'building_id' => $building->id,
            'total_eggs' => 999,
            'soft_shell_eggs' => 0,
            'damaged_eggs' => 0,
            'cracked_eggs' => 0,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->getJson('/api/daily-reports/snapshot?start_date=2026-06-01&end_date=2026-06-27');

        $response->assertOk()
            ->assertJsonPath('date', '2026-06-01')
            ->assertJsonPath('end_date', '2026-06-27')
            ->assertJsonPath('snapshot.summary.eggs_collected', 350);

        $eggRows = $response->json('snapshot.egg_production');
        $this->assertCount(1, $eggRows);
        $this->assertSame(350, $eggRows[0]['total_eggs']);
    }
}
