<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            $table->date('date_out')->nullable()->after('date_in');
            $table->string('closed_reason')->nullable()->after('date_out');
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE flocks MODIFY status VARCHAR(20) NOT NULL DEFAULT 'inactive'");
        } elseif (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::table('flocks', function (Blueprint $table) {
                $table->string('status_new', 20)->default('inactive');
            });

            DB::table('flocks')->update(['status_new' => DB::raw('status')]);

            Schema::table('flocks', function (Blueprint $table) {
                $table->dropColumn('status');
            });

            Schema::table('flocks', function (Blueprint $table) {
                $table->renameColumn('status_new', 'status');
            });
        }

        DB::table('flocks')
            ->where('status', 'inactive')
            ->where('quantity', 0)
            ->where('batch_no', 'like', '%-INIT')
            ->delete();
    }

    public function down(): void
    {
        Schema::table('flocks', function (Blueprint $table) {
            $table->dropColumn(['date_out', 'closed_reason']);
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE flocks MODIFY status ENUM('active', 'inactive') NOT NULL DEFAULT 'inactive'");
        }
    }
};
