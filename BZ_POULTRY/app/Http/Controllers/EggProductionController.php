<?php

namespace App\Http\Controllers;

use App\Helpers\ActivityLogger;
use App\Models\Activity;
use App\Models\Building;
use App\Models\EggProduction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EggProductionController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $weekStart = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        $eggsToday = EggProduction::whereDate('date', $today)->sum('total_eggs');
        $goodToday = EggProduction::whereDate('date', $today)->sum('good_eggs');
        $crackedToday = EggProduction::whereDate('date', $today)->sum('cracked_eggs');
        $weekTotal = EggProduction::where('date', '>=', $weekStart)->sum('good_eggs');
        $monthTotal = EggProduction::where('date', '>=', $monthStart)->sum('good_eggs');

        $records = EggProduction::with('building')->latest('date')->paginate(10);
        $buildings = Building::all();

        $dailyTrend = EggProduction::where('date', '>=', $monthStart)
            ->select('date', DB::raw('SUM(good_eggs) as good'), DB::raw('SUM(cracked_eggs) as cracked'))
            ->groupBy('date')->orderBy('date')->get();

        $qualityRate = [
            'good' => EggProduction::where('date', '>=', $monthStart)->sum('good_eggs'),
            'cracked' => EggProduction::where('date', '>=', $monthStart)->sum('cracked_eggs'),
        ];

        $byBuilding = EggProduction::where('date', '>=', $monthStart)
            ->join('buildings', 'egg_productions.building_id', '=', 'buildings.id')
            ->select('buildings.name', DB::raw('SUM(good_eggs) as total'))
            ->groupBy('buildings.name')->get();

        $recentActivities = Activity::where('module', 'Egg Production')->latest()->take(5)->get();

        return view('eggs.index', compact(
            'eggsToday', 'goodToday', 'crackedToday', 'weekTotal', 'monthTotal',
            'records', 'buildings', 'dailyTrend', 'qualityRate', 'byBuilding', 'recentActivities'
        ));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'building_id' => 'required|exists:buildings,id',
            'total_eggs' => 'required|integer|min:1',
            'good_eggs' => 'required|integer|min:0',
            'cracked_eggs' => 'required|integer|min:0',
        ]);

        $data['user_id'] = auth()->id();
        EggProduction::create($data);
        ActivityLogger::log('created', 'Egg Production', "Added production record for {$data['date']}");

        return back()->with('success', 'Production record added.');
    }

    public function destroy(EggProduction $egg)
    {
        $egg->delete();
        ActivityLogger::log('deleted', 'Egg Production', 'Deleted production record');

        return back()->with('success', 'Production record deleted.');
    }
}
