<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BuildingsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        
        for ($i = 1; $i <= 11; $i++) {
            DB::table('buildings')->insertOrIgnore([
                'name' => sprintf('B-%02d', $i),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
