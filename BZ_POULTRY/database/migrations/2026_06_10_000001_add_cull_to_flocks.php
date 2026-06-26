<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            if (! Schema::hasColumn('flocks', 'cull')) {
                $table->unsignedInteger('cull')->default(0)->after('mortality');
            }
        });
    }

    public function down(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            if (Schema::hasColumn('flocks', 'cull')) {
                $table->dropColumn('cull');
            }
        });
    }
};
