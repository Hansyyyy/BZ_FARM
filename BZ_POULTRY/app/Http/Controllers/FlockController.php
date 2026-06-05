<?php

namespace App\Http\Controllers;

use App\Helpers\ActivityLogger;
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

        $distribution = [
            'layers' => $layers,
            'pullets' => $pullets,
            'roosters' => $roosters,
        ];

        $recentActivities = \App\Models\Activity::where('module', 'Poultry Stock')->latest()->take(5)->get();

        return view('flocks.index', compact(
            'flocks', 'totalFlocks', 'totalPoultry', 'layers', 'pullets',
            'roosters', 'distribution', 'recentActivities'
        ));
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
        Flock::create($data);

        ActivityLogger::log('created', 'Poultry Stock', "Added new flock {$data['batch_no']}");

        return back()->with('success', 'Flock added successfully.');
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

        return back()->with('success', 'Flock updated successfully.');
    }

    public function destroy(Flock $flock)
    {
        $batch = $flock->batch_no;
        $flock->delete();
        ActivityLogger::log('deleted', 'Poultry Stock', "Deleted flock {$batch}");

        return back()->with('success', 'Flock deleted successfully.');
    }
}
