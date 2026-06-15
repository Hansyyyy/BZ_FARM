<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ActivityLogger;
use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Services\DailyReportSnapshotService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class DailyReportController extends Controller
{
    public function index()
    {
        if (! Schema::hasTable('daily_reports')) {
            return response()->json([
                'reports' => [],
                'today' => [
                    'date' => Carbon::today()->toDateString(),
                    'submitted' => false,
                    'status' => null,
                    'report_id' => null,
                ],
                'pending_review_count' => 0,
            ]);
        }

        $reports = DailyReport::with(['submitter', 'reviewer'])
            ->latest('report_date')
            ->take(30)
            ->get()
            ->map(fn (DailyReport $report) => $this->formatReport($report));

        $today = Carbon::today()->toDateString();
        $todayReport = DailyReport::whereDate('report_date', $today)->first();

        return response()->json([
            'reports' => $reports,
            'today' => [
                'date' => $today,
                'submitted' => (bool) $todayReport,
                'status' => $todayReport?->status,
                'report_id' => $todayReport?->id,
            ],
            'pending_review_count' => DailyReport::where('status', 'submitted')->count(),
        ]);
    }

    public function snapshot(Request $request, DailyReportSnapshotService $snapshotService)
    {
        $date = Carbon::parse($request->query('date', now()->toDateString()))->startOfDay();
        $existing = DailyReport::with(['submitter', 'reviewer'])
            ->whereDate('report_date', $date)
            ->first();

        return response()->json([
            'date' => $date->toDateString(),
            'snapshot' => $snapshotService->build($date),
            'report' => $existing ? $this->formatReport($existing, includeSnapshot: true) : null,
        ]);
    }

    public function store(Request $request, DailyReportSnapshotService $snapshotService)
    {
        $data = $request->validate([
            'report_date' => 'required|date',
            'notes' => 'nullable|string|max:2000',
        ]);

        $date = Carbon::parse($data['report_date'])->startOfDay();
        $user = auth()->user();

        if ($user && ! $user->isAdmin() && ! $date->isSameDay(Carbon::today())) {
            return response()->json([
                'message' => 'You can only submit a daily report for today.',
            ], 422);
        }

        if (DailyReport::whereDate('report_date', $date)->exists()) {
            return response()->json([
                'message' => 'A daily report has already been submitted for this date.',
            ], 422);
        }

        $report = DailyReport::create([
            'report_date' => $date->toDateString(),
            'submitted_by' => auth()->id(),
            'status' => 'submitted',
            'notes' => $data['notes'] ?? null,
            'snapshot' => $snapshotService->build($date),
            'submitted_at' => now(),
        ]);

        ActivityLogger::log(
            'submitted',
            'Daily Report',
            'Submitted daily farm report for '.$date->toFormattedDateString()
        );

        return response()->json([
            'message' => 'Daily report submitted successfully.',
            'report' => $this->formatReport($report->load(['submitter', 'reviewer']), includeSnapshot: true),
        ], 201);
    }

    public function review(DailyReport $dailyReport)
    {
        if (! auth()->user()?->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($dailyReport->status === 'reviewed') {
            return response()->json([
                'message' => 'Report already reviewed.',
                'report' => $this->formatReport($dailyReport->load(['submitter', 'reviewer']), includeSnapshot: true),
            ]);
        }

        $dailyReport->update([
            'status' => 'reviewed',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        ActivityLogger::log(
            'reviewed',
            'Daily Report',
            'Reviewed daily farm report for '.$dailyReport->report_date->toFormattedDateString()
        );

        return response()->json([
            'message' => 'Daily report marked as reviewed.',
            'report' => $this->formatReport($dailyReport->load(['submitter', 'reviewer']), includeSnapshot: true),
        ]);
    }

    private function formatReport(DailyReport $report, bool $includeSnapshot = false): array
    {
        $payload = [
            'id' => $report->id,
            'report_date' => $report->report_date->toDateString(),
            'status' => $report->status,
            'notes' => $report->notes,
            'submitted_by' => $report->submitter?->name,
            'submitted_at' => $report->submitted_at,
            'reviewed_by' => $report->reviewer?->name,
            'reviewed_at' => $report->reviewed_at,
            'summary' => $report->snapshot['summary'] ?? null,
        ];

        if ($includeSnapshot) {
            $payload['snapshot'] = $report->snapshot;
        }

        return $payload;
    }
}
