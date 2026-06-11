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
        $flocks = Flock::latest('date_in')->paginate(10);

        $totalFlocks = Flock::where('status', 'active')->count();
        $totalPoultry = Flock::where('status', 'active')->sum('quantity');
        $layers = Flock::where('type', 'layers')->where('status', 'active')->sum('quantity');
        $pullets = Flock::where('type', 'pullets')->where('status', 'active')->sum('quantity');
        $roosters = Flock::where('type', 'roosters')->where('status', 'active')->sum('quantity');
        $medicationDue = Flock::where('status', 'active')
            ->where('age_weeks', '>=', 4)
            ->orderBy('batch_no')
            ->get(['id', 'batch_no', 'age_weeks', 'type']);

        return response()->json([
            'items' => $flocks->items(),
            'pagination' => [
                'current_page' => $flocks->currentPage(),
                'last_page' => $flocks->lastPage(),
                'per_page' => $flocks->perPage(),
                'total' => $flocks->total(),
            ],
            'summary' => compact('totalFlocks', 'totalPoultry', 'layers', 'pullets', 'roosters'),
            'distribution' => compact('layers', 'pullets', 'roosters'),
            'buildings' => Building::all(),
            'medicationDue' => $medicationDue,
            'recentActivities' => Activity::where('module', 'Poultry Stock')->latest()->take(5)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'batch_no' => 'required|unique:flocks',
            'type' => 'required|in:layers,pullets,roosters',
            'breed' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'age_weeks' => 'required|integer|min:0',
            'date_in' => 'required|date',
        ]);

        $data['initial_quantity'] = $data['quantity'];
        $flock = Flock::create($data);

        ActivityLogger::log('created', 'Poultry Stock', "Added new flock {$data['batch_no']}");

        return response()->json(['message' => 'Flock added successfully.', 'item' => $flock], 201);
    }

    public function update(Request $request, Flock $flock)
    {
        $data = $request->validate([
            'type' => 'required|in:layers,pullets,roosters',
            'breed' => 'required|string',
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
}
