<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Building;
use App\Models\Flock;
use Illuminate\Http\Request;

class FlockController extends Controller
{
    public function index()
    {
        $flocks = Flock::orderBy('building_name')
            ->paginate(50);
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
            'batch_no' => 'required|unique:flocks',
            'building_name' => 'required|string',
            'type' => 'required|in:Layers,Growers',
            'quantity' => 'required|integer|min:1',
            'date_in' => 'required|date',
        ]);

        $placeholder = Flock::where('building_name', $data['building_name'])
            ->where('status', 'inactive')
            ->first();

        if ($placeholder) {
            $placeholder->update([
                'batch_no' => $data['batch_no'],
                'type' => $data['type'],
                'initial_quantity' => $data['quantity'],
                'quantity' => $data['quantity'],
                'date_in' => $data['date_in'],
                'mortality' => 0,
                'status' => 'active',
            ]);

            ActivityLogger::log('created', 'Poultry Stock', "Added new flock {$data['batch_no']} in {$data['building_name']}");

            return response()->json(['message' => 'Flock added successfully.', 'item' => $placeholder], 201);
        }

        $data['initial_quantity'] = $data['quantity'];
        $data['status'] = 'active';

        $flock = Flock::create($data);

        ActivityLogger::log('created', 'Poultry Stock', "Added new flock {$data['batch_no']}");

        return response()->json(['message' => 'Flock added successfully.', 'item' => $flock], 201);
    }

    public function update(Request $request, Flock $flock)
    {
        $data = $request->validate([
            'type' => 'required|in:Layers,Growers',
            'quantity' => 'required|integer|min:0',
            'age_weeks' => 'required|integer|min:0',
            'mortality' => 'nullable|integer|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $flock->update($data);
        ActivityLogger::log('updated', 'Poultry Stock', "Updated flock {$flock->batch_no}");

        return response()->json(['message' => 'Flock updated successfully.', 'item' => $flock]);
    }

    public function destroy(Flock $flock)
    {
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

        if ($sourceFlock->type !== 'Growers' && $sourceFlock->type !== 'growers') {
            return response()->json(['message' => 'Only Growers can be transferred.'], 422);
        }

        $destinationPlaceholder = Flock::where('building_name', $data['destination_building'])
            ->where('status', 'inactive')
            ->first();

        if (!$destinationPlaceholder) {
            return response()->json(['message' => 'Destination building is not available.'], 422);
        }

        // Save source data before resetting
        $transferData = [
            'batch_no' => $sourceFlock->batch_no,
            'type' => 'Layers',
            'initial_quantity' => $sourceFlock->initial_quantity,
            'quantity' => $sourceFlock->quantity,
            'date_in' => $sourceFlock->date_in,
            'mortality' => $sourceFlock->mortality,
            'status' => 'active',
        ];

        // Reset source flock FIRST (frees up the batch_no)
        $sourceFlock->update([
            'batch_no' => $sourceFlock->building_name . '-INIT',
            'type' => 'Growers',
            'initial_quantity' => 0,
            'quantity' => 0,
            'date_in' => null,
            'mortality' => 0,
            'status' => 'inactive',
        ]);

        // Then update destination placeholder
        $destinationPlaceholder->update($transferData);

        ActivityLogger::log('updated', 'Poultry Stock', "Transferred flock to {$data['destination_building']} as Layers");

        return response()->json(['message' => 'Flock transferred successfully.', 'item' => $destinationPlaceholder]);
    }
}
