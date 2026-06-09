<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function index()
    {
        $reports = Report::with('generator')->latest('generated_at')->take(10)->get();

        $reportTypes = [
            ['name' => 'Poultry Stock Report', 'category' => 'Poultry', 'icon' => 'egg-fried'],
            ['name' => 'Feed Inventory Report', 'category' => 'Feed', 'icon' => 'basket'],
            ['name' => 'Medicine & Vaccine Report', 'category' => 'Medicine', 'icon' => 'capsule'],
            ['name' => 'Inventory Report', 'category' => 'Inventory', 'icon' => 'box-seam'],
            ['name' => 'Egg Production Report', 'category' => 'Production', 'icon' => 'graph-up'],
            ['name' => 'Sales Report', 'category' => 'Sales', 'icon' => 'cash-stack'],
            ['name' => 'Financial Summary', 'category' => 'Finance', 'icon' => 'currency-dollar'],
            ['name' => 'Mortality Report', 'category' => 'Poultry', 'icon' => 'heart-pulse'],
        ];

        return response()->json(['reports' => $reports, 'reportTypes' => $reportTypes]);
    }

    public function generate(Request $request)
    {
        $data = $request->validate([
            'report_name' => 'required|string',
            'category' => 'required|string',
        ]);

        $report = Report::create([
            'report_name' => $data['report_name'],
            'category' => $data['category'],
            'generated_by' => auth()->id(),
            'generated_at' => now(),
        ]);

        return response()->json(['message' => 'Report generated successfully.', 'report' => $report], 201);
    }
}
