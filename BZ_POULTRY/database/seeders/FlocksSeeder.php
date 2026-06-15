<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FlocksSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        for ($i = 1; $i <= 11; $i++) {
            $buildingName = sprintf('B-%02d', $i);
            $type = $i <= 3 ? 'Growers' : 'Layers';

            // Find the physical building record
            $building = DB::table('buildings')->where('name', $buildingName)->first();

            if ($building) {
                DB::table('flocks')->insertOrIgnore([
                    'batch_no' => $buildingName . '-INIT', 
                    'building_name' => $buildingName,
                    'type' => $type,
                    'initial_quantity' => 0,
                    'quantity' => 0,
                    'age_weeks' => 0,
                    'date_in' => null,
                    'mortality' => 0,
                    'status' => 'inactive',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
