<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('egg_productions', function (Blueprint $table) {
            if (! Schema::hasColumn('egg_productions', 'flock_id')) {
                $table->foreignId('flock_id')->nullable()->constrained('flocks')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('egg_productions', function (Blueprint $table) {
            if (Schema::hasColumn('egg_productions', 'flock_id')) {
                $table->dropForeign(['flock_id']);
                $table->dropColumn('flock_id');
            }
        });
    }
};
