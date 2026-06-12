<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->date('note_date')->unique();
            $table->string('content', 500);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_notes');
    }
};
