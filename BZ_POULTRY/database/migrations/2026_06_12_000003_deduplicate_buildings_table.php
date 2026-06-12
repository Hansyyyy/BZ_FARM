<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $duplicateNames = DB::table('buildings')
            ->select('name')
            ->groupBy('name')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('name');

        foreach ($duplicateNames as $name) {
            $ids = DB::table('buildings')
                ->where('name', $name)
                ->orderBy('id')
                ->pluck('id');

            $keepId = $ids->first();
            $removeIds = $ids->slice(1)->values();

            foreach ($removeIds as $removeId) {
                DB::table('egg_productions')
                    ->where('building_id', $removeId)
                    ->update(['building_id' => $keepId]);

                DB::table('flocks')
                    ->where('batch_no', (string) $removeId)
                    ->update(['batch_no' => (string) $keepId]);

                DB::table('buildings')
                    ->where('id', $removeId)
                    ->delete();
            }
        }

        Schema::table('buildings', function (Blueprint $table) {
            $table->unique('name');
        });
    }

    public function down(): void
    {
        Schema::table('buildings', function (Blueprint $table) {
            $table->dropUnique(['name']);
        });
    }
};
