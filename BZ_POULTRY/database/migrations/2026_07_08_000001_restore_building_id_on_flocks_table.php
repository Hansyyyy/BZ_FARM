<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('flocks', 'building_id')) {
            Schema::table('flocks', function (Blueprint $table) {
                $table->foreignId('building_id')->nullable()->after('batch_no')->constrained('buildings')->nullOnDelete();
            });
        }

        if (Schema::hasColumn('flocks', 'building_name')) {
            DB::table('flocks')
                ->whereNull('building_id')
                ->whereNotNull('building_name')
                ->orderBy('id')
                ->each(function ($flock) {
                    $buildingId = DB::table('buildings')
                        ->where('name', $flock->building_name)
                        ->value('id');

                    if ($buildingId) {
                        DB::table('flocks')
                            ->where('id', $flock->id)
                            ->update(['building_id' => $buildingId]);
                    }
                });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('flocks', 'building_id')) {
            Schema::table('flocks', function (Blueprint $table) {
                $table->dropForeign(['building_id']);
                $table->dropColumn('building_id');
            });
        }
    }
};
