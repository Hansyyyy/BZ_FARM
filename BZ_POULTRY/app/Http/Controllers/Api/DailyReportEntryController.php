<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\Building;
use App\Models\EggProduction;
use App\Models\FeedItem;
use App\Models\Flock;
use App\Models\StockTransaction;
use App\Models\FlockLossRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailyReportEntryController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'building_id' => 'required|exists:buildings,id',
            'cull' => 'nullable|integer|min:0',
            'mortality' => 'nullable|integer|min:0',
            'feed' => 'nullable|numeric|min:0',
            'feed_type' => 'nullable|string',
            'super_jumbo' => 'nullable|integer|min:0',
            'jumbo' => 'nullable|integer|min:0',
            'extra_large' => 'nullable|integer|min:0',
            'large' => 'nullable|integer|min:0',
            'medium' => 'nullable|integer|min:0',
            'small' => 'nullable|integer|min:0',
            'piwi' => 'nullable|integer|min:0',
            'cracked' => 'nullable|integer|min:0',
            'soft_shell' => 'nullable|integer|min:0',
            'leak' => 'nullable|integer|min:0',
        ]);

        $buildingId = $data['building_id'];
        $building = Building::find($buildingId);
        $cull = (int) ($data['cull'] ?? 0);
        $mortality = (int) ($data['mortality'] ?? 0);
        $feedUsed = (float) ($data['feed'] ?? 0);

        $flock = Flock::where('building_name', $building?->name)
            ->where('status', 'active')
            ->first();

        if (!$flock) {
            return response()->json(['message' => 'No active flock found in this building.'], 422);
        }

        DB::beginTransaction();

        try {
            // 1. Cull + Mortality reduce flock quantity
            $totalRemoval = $cull + $mortality;
            if ($totalRemoval > 0) {
                $newQuantity = max(0, $flock->quantity - $totalRemoval);
                $flock->update([
                    'quantity' => $newQuantity,
                    'mortality' => ($flock->mortality ?? 0) + $mortality,
                    'cull' => ($flock->cull ?? 0) + $cull,
                ]);

                if ($cull > 0) {
                    ActivityLogger::log('updated', 'Poultry Stock', "Culled {$cull} birds from building {$flock->building_name}");
                }
                if ($mortality > 0) {
                    ActivityLogger::log('updated', 'Poultry Stock', "Recorded {$mortality} mortality in building {$flock->building_name}");
                }
            }

            // 2. Feed deduction – reduce from the feed item matching the selected type
            if ($feedUsed > 0) {
                $feedType = $data['feed_type'] ?? null;
                $feedItem = $feedType
                    ? FeedItem::where('category', $feedType)->orWhere('name', $feedType)->orderByDesc('stock')->first()
                    : FeedItem::orderByDesc('stock')->first();

                if (!$feedItem) {
                    throw new \Exception('No feed item found for the selected type.');
                }

                if ($feedUsed > (float) $feedItem->stock) {
                    throw new \Exception("Feed amount ({$feedUsed}kg) exceeds available stock ({$feedItem->stock}kg) for {$feedItem->category}.");
                }

                $newStock = (float) $feedItem->stock - $feedUsed;
                $feedItem->update(['stock' => $newStock]);

                StockTransaction::create([
                    'item_type' => 'feed',
                    'item_id' => $feedItem->id,
                    'type' => 'out',
                    'quantity' => $feedUsed,
                    'building_id' => $buildingId,
                    'reference' => 'daily_report',
                    'user_id' => auth()->id(),
                    'notes' => "Daily report feed usage for building {$flock->building_name}",
                ]);

                ActivityLogger::log('updated', 'Feed Inventory', "Used {$feedUsed}kg feed from {$feedItem->name} (daily report)");
            }

            // 4. Record mortality/cull history for traceability
            if ($cull > 0) {
                FlockLossRecord::create([
                    'record_date' => now()->toDateString(),
                    'flock_id' => $flock->id,
                    'building_id' => $buildingId,
                    'type' => 'cull',
                    'quantity' => $cull,
                    'reason' => null,
                    'user_id' => auth()->id(),
                ]);
            }

            if ($mortality > 0) {
                FlockLossRecord::create([
                    'record_date' => now()->toDateString(),
                    'flock_id' => $flock->id,
                    'building_id' => $buildingId,
                    'type' => 'mortality',
                    'quantity' => $mortality,
                    'reason' => null,
                    'user_id' => auth()->id(),
                ]);
            }

            // 3. Egg production record
            $goodEggFields = [
                'super_jumbo' => 'super_jumbo_eggs',
                'jumbo' => 'jumbo_eggs',
                'extra_large' => 'extra_large_eggs',
                'large' => 'large_eggs',
                'medium' => 'medium_eggs',
                'small' => 'small_eggs',
                'piwi' => 'piwi_eggs',
            ];

            $defectiveEggFields = [
                'cracked' => 'cracked_eggs',
                'soft_shell' => 'soft_shell_eggs',
                'leak' => 'damaged_eggs',
            ];

            $eggData = [
                'date' => now()->toDateString(),
                'building_id' => $buildingId,
                'user_id' => auth()->id(),
            ];

            $totalGood = 0;
            foreach ($goodEggFields as $inputKey => $dbKey) {
                $value = (int) ($data[$inputKey] ?? 0);
                $eggData[$dbKey] = $value;
                $totalGood += $value;
            }

            foreach ($defectiveEggFields as $inputKey => $dbKey) {
                $eggData[$dbKey] = (int) ($data[$inputKey] ?? 0);
            }

            $eggData['total_eggs'] = $totalGood;

            $hasEggs = $totalGood > 0 || array_sum(array_map(fn ($k) => (int) ($data[$k] ?? 0), array_keys($defectiveEggFields))) > 0;

            $eggRecord = null;
            if ($hasEggs) {
                // Remove placeholder egg record for this building if exists
                EggProduction::where('building_id', $buildingId)
                    ->where('total_eggs', 0)
                    ->where('soft_shell_eggs', 0)
                    ->where('damaged_eggs', 0)
                    ->where('cracked_eggs', 0)
                    ->delete();

                $eggRecord = EggProduction::create($eggData);
                ActivityLogger::log('created', 'Egg Production', "Added {$totalGood} eggs via daily report for building {$flock->building_name}");
            }

            DB::commit();

            return response()->json([
                'message' => 'Daily report entry saved successfully.',
                'flock' => $flock->fresh(),
                'egg_record' => $eggRecord,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to save daily report entry.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
