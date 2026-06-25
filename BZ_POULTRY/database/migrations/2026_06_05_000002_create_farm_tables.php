<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. BUILDINGS MUST BE CREATED FIRST (Parent table)
        Schema::create('buildings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Added unique constraint to protect deduplication
            $table->timestamps();
        });

        // 2. FLOCKS CAN NOW BE SAFELY CREATED (Child table with foreign key)
        Schema::create('flocks', function (Blueprint $table) {
            $table->id();
            $table->string('batch_no')->unique();
            $table->foreignId('building_id')->nullable()->constrained('buildings')->onDelete('cascade');
            $table->enum('type', ['Layers', 'Growers']);
            $table->unsignedInteger('initial_quantity')->default(0); // Added default 0 for safety
            $table->unsignedInteger('quantity')->default(0);        // Added default 0 for safety
            $table->unsignedInteger('age_weeks')->default(0);
            $table->date('date_in')->nullable();                    // Made nullable for your initial seeder
            $table->unsignedInteger('mortality')->default(0);
            $table->string('status', 20)->default('inactive');
            $table->timestamps();
        });

        // 3. REST OF THE APP TABLES (Unchanged structure)
        Schema::create('feed_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->decimal('stock', 10, 2)->default(0);
            $table->string('unit')->default('kg');
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->date('expiry_date')->nullable();
            $table->date('last_stock_in')->nullable();
            $table->decimal('cost_per_kg', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('medicine_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->string('type')->nullable();
            $table->decimal('stock', 10, 2)->default(0);
            $table->string('unit')->default('pcs');
            $table->decimal('reorder_level', 10, 2)->default(0);
            $table->date('expiry_date')->nullable();
            $table->date('last_stock_in')->nullable();
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('item_type');
            $table->unsignedBigInteger('item_id');
            $table->enum('type', ['in', 'out']);
            $table->decimal('quantity', 10, 2);
            $table->string('reference')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['item_type', 'item_id']);
        });

        Schema::create('egg_productions', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('building_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('total_eggs');
            $table->unsignedInteger('good_eggs');
            $table->unsignedInteger('cracked_eggs');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('unit')->default('tray');
            $table->decimal('unit_price', 10, 2);
            $table->timestamps();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('amount', 12, 2);
            $table->enum('payment_method', ['cash', 'credit'])->default('cash');
            $table->enum('status', ['paid', 'unpaid'])->default('paid');
            $table->date('sale_date');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('module');
            $table->text('description');
            $table->timestamps();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_name');
            $table->string('category');
            $table->foreignId('generated_by')->constrained('users')->cascadeOnDelete();
            $table->string('file_path')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // REVERSED ORDER TO PREVENT FOREIGN KEY DROP ERRORS
        Schema::dropIfExists('reports');
        Schema::dropIfExists('activities');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('products');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('egg_productions');
        Schema::dropIfExists('stock_transactions');
        
        // Drop flocks BEFORE dropping buildings!
        Schema::dropIfExists('flocks');
        Schema::dropIfExists('buildings');
        
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('medicine_items');
        Schema::dropIfExists('feed_items');
    }
};