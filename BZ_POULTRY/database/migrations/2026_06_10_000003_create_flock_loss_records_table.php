<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flock_loss_records', function (Blueprint $table) {
            $table->id();
            $table->date('record_date');
            $table->foreignId('flock_id')->nullable()->constrained('flocks')->nullOnDelete();
            $table->foreignId('building_id')->nullable()->constrained('buildings')->nullOnDelete();
            $table->enum('type', ['mortality', 'cull']);
            $table->unsignedInteger('quantity')->default(0);
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flock_loss_records');
    }
};
