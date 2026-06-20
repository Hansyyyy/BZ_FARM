<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('egg_productions', 'piwi_eggs')) {
            Schema::table('egg_productions', function (Blueprint $table) {
                $table->unsignedInteger('piwi_eggs')->default(0)->after('super_jumbo_eggs');
            });
        }
    }

    public function down(): void
    {
        Schema::table('egg_productions', function (Blueprint $table) {
            $table->dropColumn('piwi_eggs');
        });
    }
};
