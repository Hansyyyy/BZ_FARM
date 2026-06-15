<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('egg_productions', function (Blueprint $table) {
            $table->unsignedInteger('small_eggs')->default(0)->after('cracked_eggs');
            $table->unsignedInteger('medium_eggs')->default(0)->after('small_eggs');
            $table->unsignedInteger('large_eggs')->default(0)->after('medium_eggs');
            $table->unsignedInteger('extra_large_eggs')->default(0)->after('large_eggs');
            $table->unsignedInteger('jumbo_eggs')->default(0)->after('extra_large_eggs');
            $table->unsignedInteger('super_jumbo_eggs')->default(0)->after('jumbo_eggs');
        });
    }

    public function down(): void
    {
        Schema::table('egg_productions', function (Blueprint $table) {
            $table->dropColumn([
                'small_eggs',
                'medium_eggs',
                'large_eggs',
                'extra_large_eggs',
                'jumbo_eggs',
                'super_jumbo_eggs',
            ]);
        });
    }
};
