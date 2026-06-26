<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Building;
use App\Models\Flock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class FlockController extends Controller
{
    public function index()
    {
        $query = Flock::query();

        if (Schema::hasColumn('flocks', 'building_name')) {
            $query->orderByRaw("CASE WHEN status = 'active' THEN 0 WHEN status = 'closed' THEN 1 ELSE 2 END")
                ->orderBy('building_name')
                ->orderByDesc('date_out')
                ->orderByDesc('date_in');
        } else {
            $query->orderByDesc('date_in')->orderBy('batch_no');
        }

        $flocks = $query->paginate(50);
        $items = $flocks->items();

        $totalFlocks = Flock::where('status', 'active')->count();
        $totalPoultry = Flock::where('status', 'active')->sum('quantity');
        $layers = Flock::where('type', 'Layers')->where('status', 'active')->sum('quantity');
        $growers = Flock::where('type', 'Growers')->where('status', 'active')->sum('quantity');
        $roosters = 0;
        $medicationDue = Flock::where('status', 'active')
            ->where('age_weeks', '>=', 4)
            ->orderBy('batch_no')
            ->get(['id', 'batch_no', 'age_weeks', 'type']);

        return response()->json([
            'items' => $items,
            'pagination' => [
                'current_page' => $flocks->currentPage(),
                'last_page' => $flocks->lastPage(),
                'per_page' => $flocks->perPage(),
                'total' => $flocks->total(),
            ],
            'summary' => compact('totalFlocks', 'totalPoultry', 'layers', 'growers', 'roosters'),
            'distribution' => compact('layers', 'growers', 'roosters'),
            'buildings' => Building::orderedList(),
            'medicationDue' => $medicationDue,
            'recentActivities' => Activity::where('module', 'Poultry Stock')->latest()->take(5)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'batch_no' => 'required|unique:flocks,batch_no',
            'building_name' => 'required|string',
            'type' => 'required|in:Layers,Growers',
            'quantity' => 'required|integer|min:1',
            'date_in' => 'nullable|date',
        ]);

        $data['date_in'] = $data['date_in'] ?? now()->toDateString();
        $building = Building::where('name', $data['building_name'])->first();

        if ($building) {
            $data['building_id'] = $building->id;
        }

        $activeInBuilding = Flock::where('building_name', $data['building_name'])
            ->where('status', 'active')
            ->exists();

        if ($activeInBuilding) {
            return response()->json([
                'message' => 'This building already has an active batch. Close the current batch before adding a new one.',
            ], 422);
        }

        $data['initial_quantity'] = $data['quantity'];
        $data['mortality'] = 0;
        $data['cull'] = 0;
        $data['status'] = 'active';

        $flock = Flock::create($data);

        ActivityLogger::log('created', 'Poultry Stock', "Added new flock {$data['batch_no']} in {$data['building_name']}");

        return response()->json(['message' => 'Flock added successfully.', 'item' => $flock], 201);
    }

    public function update(Request $request, Flock $flock)
    {
        if ($flock->isClosed()) {
            return response()->json([
                'message' => 'Closed batches cannot be edited.',
            ], 422);
        }

        $data = $request->validate([
            'type' => 'required|in:Layers,Growers',
            'quantity' => 'required|integer|min:0',
            'age_weeks' => 'required|integer|min:0',
            'mortality' => 'nullable|integer|min:0',
        ]);

        $flock->update($data);
        ActivityLogger::log('updated', 'Poultry Stock', "Updated flock {$flock->batch_no}");

        return response()->json(['message' => 'Flock updated successfully.', 'item' => $flock]);
    }

    public function close(Request $request, Flock $flock)
    {
        if (! $flock->isActive()) {
            return response()->json([
                'message' => 'Only an active batch can be closed.',
            ], 422);
        }

        $data = $request->validate([
            'closed_reason' => 'required|in:depleted,sold,replaced,cycle_end,transferred,other',
        ]);

        $flock->update([
            'status' => 'closed',
            'date_out' => now()->toDateString(),
            'closed_reason' => $data['closed_reason'],
        ]);

        ActivityLogger::log(
            'closed',
            'Poultry Stock',
            "Closed batch {$flock->batch_no} in {$flock->building_name} ({$data['closed_reason']})"
        );

        return response()->json([
            'message' => 'Batch closed successfully. The building is now available for a new batch.',
            'item' => $flock->fresh(),
        ]);
    }

    public function destroy(Flock $flock)
    {
        if ($flock->isActive()) {
            return response()->json([
                'message' => 'Active batches must be closed before they can be deleted.',
            ], 422);
        }

        $batch = $flock->batch_no;
        $flock->delete();
        ActivityLogger::log('deleted', 'Poultry Stock', "Deleted flock {$batch}");

        return response()->json(['message' => 'Flock deleted successfully.']);
    }

    public function transfer(Request $request)
    {
        $data = $request->validate([
            'flock_id' => 'required|exists:flocks,id',
            'destination_building' => 'required|string',
        ]);

        $sourceFlock = Flock::findOrFail($data['flock_id']);

        if (! $sourceFlock->isActive()) {
            return response()->json(['message' => 'Only an active flock can be transferred.'], 422);
        }

        if ($sourceFlock->type !== 'Growers' && $sourceFlock->type !== 'growers') {
            return response()->json(['message' => 'Only Growers can be transferred.'], 422);
        }

        $destinationBuilding = Building::where('name', $data['destination_building'])->first();

        if (! $destinationBuilding) {
            return response()->json(['message' => 'Destination building not found.'], 422);
        }

        $activeInDestination = Flock::where('building_name', $destinationBuilding->name)
            ->where('status', 'active')
            ->exists();

        if ($activeInDestination) {
            return response()->json(['message' => 'Destination building already has an active batch.'], 422);
        }

        $sourceBuilding = $sourceFlock->building_name;

        $sourceFlock->update([
            'building_id' => $destinationBuilding->id,
            'building_name' => $destinationBuilding->name,
            'type' => 'Layers',
        ]);

        ActivityLogger::log(
            'updated',
            'Poultry Stock',
            "Transferred flock {$sourceFlock->batch_no} from {$sourceBuilding} to {$destinationBuilding->name} as Layers"
        );

        return response()->json([
            'message' => 'Flock transferred successfully.',
            'item' => $sourceFlock->fresh(),
        ]);
    }
}
