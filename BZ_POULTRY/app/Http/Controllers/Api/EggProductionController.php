<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Building;
use App\Models\EggProduction;
use App\Models\Flock;
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

        // Get all layer buildings with their latest egg production data
        $layerBuildings = Building::whereExists(function ($q) {
            $q->from('flocks')
                ->whereColumn('flocks.building_name', 'buildings.name')
                ->where('flocks.type', 'Layers');
        })->orderBy('name')->get();

        $latestEggByBuilding = EggProduction::with('building')
            ->whereIn('building_id', $layerBuildings->pluck('id'))
            ->selectRaw('building_id, date, SUM(total_eggs) as total_eggs, SUM(soft_shell_eggs) as soft_shell_eggs, SUM(damaged_eggs) as damaged_eggs, SUM(cracked_eggs) as cracked_eggs, SUM(small_eggs) as small_eggs, SUM(medium_eggs) as medium_eggs, SUM(large_eggs) as large_eggs, SUM(extra_large_eggs) as extra_large_eggs, SUM(jumbo_eggs) as jumbo_eggs, SUM(super_jumbo_eggs) as super_jumbo_eggs, SUM(piwi_eggs) as piwi_eggs')
            ->groupBy('building_id', 'date')
            ->get()
            ->groupBy('building_id')
            ->map(fn ($group) => $group->sortByDesc('date')->first());

        $items = $layerBuildings->map(function ($building) use ($latestEggByBuilding) {
            $hasActiveFlock = Flock::where('building_name', $building->name)
                ->where('status', 'active')
                ->exists();

            $record = $latestEggByBuilding->get($building->id);

            if ($record) {
                $record->building_status = $hasActiveFlock ? 'active' : 'inactive';
                return $record;
            }

            // No egg record yet — return a placeholder row
            return (object) [
                'id' => null,
                'date' => null,
                'building_id' => $building->id,
                'building' => $building,
                'total_eggs' => 0,
                'soft_shell_eggs' => 0,
                'damaged_eggs' => 0,
                'cracked_eggs' => 0,
                'small_eggs' => 0,
                'medium_eggs' => 0,
                'large_eggs' => 0,
                'extra_large_eggs' => 0,
                'jumbo_eggs' => 0,
                'super_jumbo_eggs' => 0,
                'piwi_eggs' => 0,
                'building_status' => $hasActiveFlock ? 'active' : 'inactive',
            ];
        });

        return response()->json([
            'items' => $items,
            'pagination' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $items->count(),
                'total' => $items->count(),
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
            'buildings' => Building::where('name', 'REGEXP', '^B-(0[4-9]|1[01])$')
                ->addSelect(['buildings.*'])
                ->selectSub(
                    Flock::select('status')
                        ->whereColumn('flocks.building_id', 'buildings.id')
                        ->where('flocks.status', 'active')
                        ->limit(1),
                    'flock_status'
                )
                ->orderBy('name')->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'status' => $b->flock_status ? 'active' : 'inactive',
                ]),
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
            'date' => 'nullable|date',
            'building_id' => 'required|exists:buildings,id',
            'total_eggs' => 'nullable|integer|min:0',
            'soft_shell_eggs' => 'nullable|integer|min:0',
            'damaged_eggs' => 'nullable|integer|min:0',
            'cracked_eggs' => 'nullable|integer|min:0',
            'small_eggs' => 'nullable|integer|min:0',
            'medium_eggs' => 'nullable|integer|min:0',
            'large_eggs' => 'nullable|integer|min:0',
            'extra_large_eggs' => 'nullable|integer|min:0',
            'jumbo_eggs' => 'nullable|integer|min:0',
            'super_jumbo_eggs' => 'nullable|integer|min:0',
        ]);

        $data['total_eggs'] = $data['total_eggs'] ?? 0;
        $data['soft_shell_eggs'] = $data['soft_shell_eggs'] ?? 0;
        $data['damaged_eggs'] = $data['damaged_eggs'] ?? 0;
        $data['cracked_eggs'] = $data['cracked_eggs'] ?? 0;
        $data['small_eggs'] = $data['small_eggs'] ?? 0;
        $data['medium_eggs'] = $data['medium_eggs'] ?? 0;
        $data['large_eggs'] = $data['large_eggs'] ?? 0;
        $data['extra_large_eggs'] = $data['extra_large_eggs'] ?? 0;
        $data['jumbo_eggs'] = $data['jumbo_eggs'] ?? 0;
        $data['super_jumbo_eggs'] = $data['super_jumbo_eggs'] ?? 0;

        $data['date'] = $data['date'] ?? now()->toDateString();
        $data['user_id'] = auth()->id();

        if (! empty($data['flock_id'])) {
            $data['flock_id'] = (int) $data['flock_id'];
        }

        $record = EggProduction::addOrUpdateForDate($data);
        ActivityLogger::log('created', 'Egg Production', "Added production record for building {$data['building_id']}");

        return response()->json(['message' => 'Production record added.', 'item' => $record->load('building')], 201);
    }

    public function update(Request $request, EggProduction $egg)
    {
        $data = $request->validate([
            'date' => 'nullable|date',
            'building_id' => 'required|exists:buildings,id',
            'total_eggs' => 'nullable|integer|min:0',
            'soft_shell_eggs' => 'nullable|integer|min:0',
            'damaged_eggs' => 'nullable|integer|min:0',
            'cracked_eggs' => 'nullable|integer|min:0',
            'small_eggs' => 'nullable|integer|min:0',
            'medium_eggs' => 'nullable|integer|min:0',
            'large_eggs' => 'nullable|integer|min:0',
            'extra_large_eggs' => 'nullable|integer|min:0',
            'jumbo_eggs' => 'nullable|integer|min:0',
            'super_jumbo_eggs' => 'nullable|integer|min:0',
        ]);

        $data['total_eggs'] = $data['total_eggs'] ?? 0;
        $data['soft_shell_eggs'] = $data['soft_shell_eggs'] ?? 0;
        $data['damaged_eggs'] = $data['damaged_eggs'] ?? 0;
        $data['cracked_eggs'] = $data['cracked_eggs'] ?? 0;
        $data['small_eggs'] = $data['small_eggs'] ?? 0;
        $data['medium_eggs'] = $data['medium_eggs'] ?? 0;
        $data['large_eggs'] = $data['large_eggs'] ?? 0;
        $data['extra_large_eggs'] = $data['extra_large_eggs'] ?? 0;
        $data['jumbo_eggs'] = $data['jumbo_eggs'] ?? 0;
        $data['super_jumbo_eggs'] = $data['super_jumbo_eggs'] ?? 0;

        $egg->update($data);
        ActivityLogger::log('updated', 'Egg Production', "Updated production record for building {$data['building_id']}");

        return response()->json(['message' => 'Production record updated.', 'item' => $egg->load('building')]);
    }

    public function destroy(EggProduction $egg)
    {
        $egg->delete();
        ActivityLogger::log('deleted', 'Egg Production', 'Deleted production record');

        return response()->json(['message' => 'Production record deleted.']);
    }
}
