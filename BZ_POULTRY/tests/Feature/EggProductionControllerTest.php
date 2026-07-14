<?php

namespace Tests\Feature;

use App\Models\Building;
use App\Models\EggProduction;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EggProductionControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('buildings', function ($table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('egg_productions', function ($table) {
            $table->id();
            $table->date('date');
            $table->foreignId('building_id');
            $table->unsignedInteger('total_eggs')->default(0);
            $table->unsignedInteger('soft_shell_eggs')->default(0);
            $table->unsignedInteger('damaged_eggs')->default(0);
            $table->unsignedInteger('cracked_eggs')->default(0);
            $table->unsignedInteger('small_eggs')->default(0);
            $table->unsignedInteger('medium_eggs')->default(0);
            $table->unsignedInteger('large_eggs')->default(0);
            $table->unsignedInteger('extra_large_eggs')->default(0);
            $table->unsignedInteger('jumbo_eggs')->default(0);
            $table->unsignedInteger('super_jumbo_eggs')->default(0);
            $table->unsignedInteger('piwi_eggs')->default(0);
            $table->foreignId('user_id')->nullable();
            $table->timestamps();
        });

        Schema::create('users', function ($table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('activities', function ($table) {
            $table->id();
            $table->foreignId('user_id')->nullable();
            $table->string('action');
            $table->string('module');
            $table->text('description');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('activities');
        Schema::dropIfExists('egg_productions');
        Schema::dropIfExists('buildings');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_it_sums_into_existing_record_for_the_same_building_and_date(): void
    {
        $user = User::factory()->create();
        $building = Building::create(['name' => 'B-01']);
        $date = '2026-06-27';

        EggProduction::create([
            'date' => $date,
            'building_id' => $building->id,
            'total_eggs' => 20,
            'small_eggs' => 20,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->postJson('/api/eggs', [
            'date' => $date,
            'building_id' => $building->id,
            'total_eggs' => 10,
            'small_eggs' => 10,
        ]);

        $response->assertCreated();
        $this->assertSame(1, EggProduction::count());

        $record = EggProduction::first();
        $this->assertSame(30, $record->total_eggs);
        $this->assertSame(30, $record->small_eggs);
    }
}
