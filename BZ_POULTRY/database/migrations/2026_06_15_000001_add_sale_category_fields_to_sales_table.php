<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->enum('sale_category', ['egg', 'chicken'])->default('egg')->after('product_id');
            $table->string('egg_type')->nullable()->after('sale_category');
            $table->string('chicken_type')->nullable()->after('egg_type');
            $table->unsignedInteger('quantity_heads')->nullable()->after('quantity');
            $table->unsignedInteger('quantity_trays')->nullable()->after('quantity_heads');
            $table->unsignedInteger('quantity_pieces')->nullable()->after('quantity_trays');
            $table->enum('pricing_unit', ['per_head', 'per_tray', 'per_piece'])->nullable()->after('quantity_pieces');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'sale_category',
                'egg_type',
                'chicken_type',
                'quantity_heads',
                'quantity_trays',
                'quantity_pieces',
                'pricing_unit',
            ]);
        });
    }
};
