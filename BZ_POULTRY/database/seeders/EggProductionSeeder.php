<?php

namespace Database\Seeders;

use App\Models\Building;
use App\Models\EggProduction;
use Illuminate\Database\Seeder;

class EggProductionSeeder extends Seeder
{
    public function run(): void
    {
        EggProduction::truncate();

        $layerBuildings = Building::where('name', 'REGEXP', '^B-(0[4-9]|1[01])$')->get();

        foreach ($layerBuildings as $building) {
            EggProduction::create([
                'date' => now()->toDateString(),
                'building_id' => $building->id,
                'total_eggs' => 0,
                'soft_shell_eggs' => 0,
                'damaged_eggs' => 0,
                'cracked_eggs' => 0,
                'small_eggs' => 0,
                'medium_eggs' => 0,
                'large_eggs' => 0,
                'extra_large_eggs' => 0,
                'jumbo_eggs' => 0,
                'super_jumbo_eggs' => 0,
                'user_id' => null,
            ]);
        }
    }
}
