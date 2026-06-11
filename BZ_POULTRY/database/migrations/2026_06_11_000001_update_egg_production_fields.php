<?php

use App\Models\Building;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('egg_productions', function (Blueprint $table) {
            $table->unsignedInteger('soft_shell_eggs')->default(0)->after('total_eggs');
            $table->unsignedInteger('damaged_eggs')->default(0)->after('soft_shell_eggs');
        });

        Schema::table('egg_productions', function (Blueprint $table) {
            $table->dropColumn('good_eggs');
        });

        for ($i = 1; $i <= 11; $i++) {
            Building::firstOrCreate(['name' => "Building {$i}"]);
        }
    }

    public function down(): void
    {
        Schema::table('egg_productions', function (Blueprint $table) {
            $table->unsignedInteger('good_eggs')->default(0)->after('total_eggs');
        });

        Schema::table('egg_productions', function (Blueprint $table) {
            $table->dropColumn(['soft_shell_eggs', 'damaged_eggs']);
        });
    }
};
