<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
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

        EggProduction::where('date', '<', Carbon::now()->subDays(30))->delete();

        $eggsToday = EggProduction::whereDate('date', $today)->sum('total_eggs');
        $softShellToday = EggProduction::whereDate('date', $today)->sum('soft_shell_eggs');
        $damagedToday = EggProduction::whereDate('date', $today)->sum('damaged_eggs');
        $crackedToday = EggProduction::whereDate('date', $today)->sum('cracked_eggs');
        $smallEggsToday = EggProduction::whereDate('date', $today)->sum('small_eggs');
        $mediumEggsToday = EggProduction::whereDate('date', $today)->sum('medium_eggs');
        $largeEggsToday = EggProduction::whereDate('date', $today)->sum('large_eggs');
        $extraLargeEggsToday = EggProduction::whereDate('date', $today)->sum('extra_large_eggs');
        $jumboEggsToday = EggProduction::whereDate('date', $today)->sum('jumbo_eggs');
        $superJumboEggsToday = EggProduction::whereDate('date', $today)->sum('super_jumbo_eggs');
        $weekTotal = EggProduction::where('date', '>=', $weekStart)->sum('total_eggs');
        $monthTotal = EggProduction::where('date', '>=', $monthStart)->sum('total_eggs');

        $records = EggProduction::with('building')->latest('date')->paginate(10);

        return response()->json([
            'items' => $records->items(),
            'pagination' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
            'summary' => compact(
                'eggsToday',
                'softShellToday',
                'damagedToday',
                'crackedToday',
                'smallEggsToday',
                'mediumEggsToday',
                'largeEggsToday',
                'extraLargeEggsToday',
                'jumboEggsToday',
                'superJumboEggsToday',
                'weekTotal',
                'monthTotal'
            ),
            'buildings' => Building::orderedList(),
            'dailyTrend' => EggProduction::where('date', '>=', $monthStart)
                ->select(
                    'date',
                    DB::raw('SUM(soft_shell_eggs) as soft_shell'),
                    DB::raw('SUM(damaged_eggs) as damaged'),
                    DB::raw('SUM(cracked_eggs) as cracked')
                )
                ->groupBy('date')->orderBy('date')->get(),
            'qualityRate' => [
                'soft_shell' => EggProduction::where('date', '>=', $monthStart)->sum('soft_shell_eggs'),
                'damaged' => EggProduction::where('date', '>=', $monthStart)->sum('damaged_eggs'),
                'cracked' => EggProduction::where('date', '>=', $monthStart)->sum('cracked_eggs'),
            ],
            'byBuilding' => EggProduction::where('date', '>=', $monthStart)
                ->join('buildings', 'egg_productions.building_id', '=', 'buildings.id')
                ->select('buildings.name', DB::raw('SUM(total_eggs) as total'))
                ->groupBy('buildings.name')->get(),
            'recentActivities' => Activity::where('module', 'Egg Production')->latest()->take(5)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'building_id' => 'required|exists:buildings,id',
            'total_eggs' => 'required|integer|min:1',
            'soft_shell_eggs' => 'required|integer|min:0',
            'damaged_eggs' => 'required|integer|min:0',
            'cracked_eggs' => 'required|integer|min:0',
            'small_eggs' => 'nullable|integer|min:0',
            'medium_eggs' => 'nullable|integer|min:0',
            'large_eggs' => 'nullable|integer|min:0',
            'extra_large_eggs' => 'nullable|integer|min:0',
            'jumbo_eggs' => 'nullable|integer|min:0',
            'super_jumbo_eggs' => 'nullable|integer|min:0',
        ]);

        $data['small_eggs'] = $data['small_eggs'] ?? 0;
        $data['medium_eggs'] = $data['medium_eggs'] ?? 0;
        $data['large_eggs'] = $data['large_eggs'] ?? 0;
        $data['extra_large_eggs'] = $data['extra_large_eggs'] ?? 0;
        $data['jumbo_eggs'] = $data['jumbo_eggs'] ?? 0;
        $data['super_jumbo_eggs'] = $data['super_jumbo_eggs'] ?? 0;

        $data['user_id'] = auth()->id();
        $record = EggProduction::create($data);
        ActivityLogger::log('created', 'Egg Production', "Added production record for {$data['date']}");

        return response()->json(['message' => 'Production record added.', 'item' => $record->load('building')], 201);
    }

    public function update(Request $request, EggProduction $egg)
    {
        $data = $request->validate([
            'date' => 'required|date',
            'building_id' => 'required|exists:buildings,id',
            'total_eggs' => 'required|integer|min:1',
            'soft_shell_eggs' => 'required|integer|min:0',
            'damaged_eggs' => 'required|integer|min:0',
            'cracked_eggs' => 'required|integer|min:0',
            'small_eggs' => 'nullable|integer|min:0',
            'medium_eggs' => 'nullable|integer|min:0',
            'large_eggs' => 'nullable|integer|min:0',
            'extra_large_eggs' => 'nullable|integer|min:0',
            'jumbo_eggs' => 'nullable|integer|min:0',
            'super_jumbo_eggs' => 'nullable|integer|min:0',
        ]);

        $data['small_eggs'] = $data['small_eggs'] ?? 0;
        $data['medium_eggs'] = $data['medium_eggs'] ?? 0;
        $data['large_eggs'] = $data['large_eggs'] ?? 0;
        $data['extra_large_eggs'] = $data['extra_large_eggs'] ?? 0;
        $data['jumbo_eggs'] = $data['jumbo_eggs'] ?? 0;
        $data['super_jumbo_eggs'] = $data['super_jumbo_eggs'] ?? 0;

        $egg->update($data);
        ActivityLogger::log('updated', 'Egg Production', "Updated production record for {$data['date']}");

        return response()->json(['message' => 'Production record updated.', 'item' => $egg->load('building')]);
    }

    public function destroy(EggProduction $egg)
    {
        $egg->delete();
        ActivityLogger::log('deleted', 'Egg Production', 'Deleted production record');

        return response()->json(['message' => 'Production record deleted.']);
    }
}
