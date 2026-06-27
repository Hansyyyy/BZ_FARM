<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DailyReportSnapshotService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DailyReportExportController extends Controller
{
    public function export(Request $request, DailyReportSnapshotService $snapshotService)
    {
        $request->validate([
            'format' => 'required|in:csv,pdf,print',
            'date' => 'nullable|date',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'building' => 'nullable|string',
            'batch' => 'nullable|string',
        ]);

        $format = $request->query('format', 'csv');
        $date = $request->query('date');
        $start = $request->query('start_date');
        $end = $request->query('end_date');
        $reportType = $request->query('report_type', 'daily');
        $buildingFilter = $request->query('building');
        $batchFilter = $request->query('batch');

        // For now support single-date snapshot or date range by collecting daily snapshots
        $snapshots = [];

        if ($reportType === 'daily') {
            $d = $date ? Carbon::parse($date)->startOfDay() : Carbon::today();
            $snapshots[] = $snapshotService->build($d);
        } elseif (in_array($reportType, ['weekly', 'monthly']) && $date) {
            $d = Carbon::parse($date)->startOfDay();
            if ($reportType === 'weekly') {
                $startWeek = $d->copy()->startOfWeek();
                $endWeek = $d->copy()->endOfWeek();
                for ($dt = $startWeek; $dt->lte($endWeek); $dt->addDay()) {
                    $snapshots[] = $snapshotService->build($dt->copy());
                }
            } else {
                $startMonth = $d->copy()->startOfMonth();
                $endMonth = $d->copy()->endOfMonth();
                for ($dt = $startMonth; $dt->lte($endMonth); $dt->addDay()) {
                    $snapshots[] = $snapshotService->build($dt->copy());
                }
            }
        } elseif ($start && $end) {
            $s = Carbon::parse($start)->startOfDay();
            $e = Carbon::parse($end)->endOfDay();
            $snapshots[] = $snapshotService->buildRange($s, $e);
        } else {
            $d = Carbon::today();
            $snapshots[] = $snapshotService->build($d);
        }

        // Build CSV lines
        if ($format === 'csv') {
            $filename = 'daily_report_' . now()->format('Ymd_His') . '.csv';
            $handle = fopen('php://memory', 'w');

            foreach ($snapshots as $i => $snapshot) {
                // Header per snapshot
                fputcsv($handle, ["Snapshot: " . ($i + 1)]);
                fputcsv($handle, ['Summary']);
                foreach (($snapshot['summary'] ?? []) as $k => $v) {
                    fputcsv($handle, [ucwords(str_replace('_', ' ', $k)), (string) $v]);
                }
                fputcsv($handle, []);

                // Poultry
                fputcsv($handle, ['Poultry']);
                fputcsv($handle, ['Building', 'Batch', 'Type', 'Quantity', 'Mortality', 'Cull']);
                foreach ($snapshot['poultry'] ?? [] as $row) {
                    if ($buildingFilter && stripos($row['building'] ?? ($row['building_name'] ?? ''), $buildingFilter) === false) continue;
                    if ($batchFilter && stripos($row['batch_no'] ?? '', $batchFilter) === false) continue;
                    fputcsv($handle, [
                        $row['building'] ?? ($row['building_name'] ?? ''),
                        $row['batch_no'],
                        $row['type'],
                        $row['quantity'],
                        $row['mortality'],
                        $row['cull'] ?? 0,
                    ]);
                }
                fputcsv($handle, []);

                // Feed consumption
                fputcsv($handle, ['Feed Consumption']);
                fputcsv($handle, ['Building', 'Feed Type', 'Used', 'Remaining']);
                foreach ($snapshot['feed_consumption'] ?? [] as $row) {
                    if ($buildingFilter && stripos($row['building'], $buildingFilter) === false) continue;
                    fputcsv($handle, [$row['building'], $row['feed_type'], $row['used'], $row['remaining']]);
                }
                fputcsv($handle, []);

                // Mortality & Cull
                fputcsv($handle, ['Mortality & Cull Details']);
                fputcsv($handle, ['Building', 'Batch', 'Mortality', 'Cull', 'Reason']);
                foreach ($snapshot['mortality_cull_details'] ?? [] as $row) {
                    if ($buildingFilter && stripos($row['building'], $buildingFilter) === false) continue;
                    if ($batchFilter && stripos($row['batch'] ?? '', $batchFilter) === false) continue;
                    fputcsv($handle, [$row['building'], $row['batch'], $row['mortality'], $row['cull'], $row['reason'] ?? '']);
                }
                fputcsv($handle, []);

                // Building performance
                fputcsv($handle, ['Building Performance']);
                fputcsv($handle, ['Building', 'Chickens', 'Eggs', 'Mortality', 'Feed Used', 'Status']);
                foreach ($snapshot['building_performance'] ?? [] as $row) {
                    if ($buildingFilter && stripos($row['building'], $buildingFilter) === false) continue;
                    fputcsv($handle, [$row['building'], $row['chickens'], $row['eggs'], $row['mortality'], $row['feed_used'], $row['status']]);
                }

                // Separator between snapshots
                fputcsv($handle, []);
                fputcsv($handle, []);
            }

            rewind($handle);
            $content = stream_get_contents($handle);
            fclose($handle);

            return response($content, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        }

        // PDF or print: return a printable HTML view; server-side PDF generation requires dompdf/other package.
        $html = '<!doctype html><html><head><meta charset="utf-8"><title>Daily Report</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5}</style></head><body>';

        foreach ($snapshots as $i => $snapshot) {
            $html .= "<h2>Snapshot " . ($i + 1) . "</h2>";
            $html .= '<h3>Summary</h3><table>';
            foreach (($snapshot['summary'] ?? []) as $k => $v) {
                $html .= '<tr><th>' . htmlspecialchars(ucwords(str_replace('_', ' ', $k))) . '</th><td>' . htmlspecialchars((string) $v) . '</td></tr>';
            }
            $html .= '</table>';

            // Poultry
            $html .= '<h3>Poultry</h3><table><thead><tr><th>Batch</th><th>Type</th><th>Qty</th><th>Mortality</th><th>Cull</th></tr></thead><tbody>';
            foreach ($snapshot['poultry'] ?? [] as $row) {
                $html .= '<tr><td>' . htmlspecialchars($row['batch_no']) . '</td><td>' . htmlspecialchars($row['type']) . '</td><td>' . htmlspecialchars($row['quantity']) . '</td><td>' . htmlspecialchars($row['mortality']) . '</td><td>' . htmlspecialchars($row['cull'] ?? 0) . '</td></tr>';
            }
            $html .= '</tbody></table>';

            // Feed
            $html .= '<h3>Feed Consumption</h3><table><thead><tr><th>Building</th><th>Feed Type</th><th>Used</th><th>Remaining</th></tr></thead><tbody>';
            foreach ($snapshot['feed_consumption'] ?? [] as $row) {
                $html .= '<tr><td>' . htmlspecialchars($row['building']) . '</td><td>' . htmlspecialchars($row['feed_type']) . '</td><td>' . htmlspecialchars($row['used']) . '</td><td>' . htmlspecialchars($row['remaining']) . '</td></tr>';
            }
            $html .= '</tbody></table>';

            // Mortality & Cull
            $html .= '<h3>Mortality & Cull Details</h3><table><thead><tr><th>Building</th><th>Batch</th><th>Mortality</th><th>Cull</th><th>Reason</th></tr></thead><tbody>';
            foreach ($snapshot['mortality_cull_details'] ?? [] as $row) {
                $html .= '<tr><td>' . htmlspecialchars($row['building']) . '</td><td>' . htmlspecialchars($row['batch']) . '</td><td>' . htmlspecialchars($row['mortality']) . '</td><td>' . htmlspecialchars($row['cull']) . '</td><td>' . htmlspecialchars($row['reason'] ?? '') . '</td></tr>';
            }
            $html .= '</tbody></table>';

            // Building performance
            $html .= '<h3>Building Performance</h3><table><thead><tr><th>Building</th><th>Chickens</th><th>Eggs</th><th>Mortality</th><th>Feed Used</th><th>Status</th></tr></thead><tbody>';
            foreach ($snapshot['building_performance'] ?? [] as $row) {
                $html .= '<tr><td>' . htmlspecialchars($row['building']) . '</td><td>' . htmlspecialchars($row['chickens']) . '</td><td>' . htmlspecialchars($row['eggs']) . '</td><td>' . htmlspecialchars($row['mortality']) . '</td><td>' . htmlspecialchars($row['feed_used']) . '</td><td>' . htmlspecialchars($row['status']) . '</td></tr>';
            }
            $html .= '</tbody></table>';
        }

        $html .= '<script>window.onload=function(){if(' . ($format === 'print' ? 'true' : 'false') . '){window.print();}}</script>';
        $html .= '</body></html>';

        $headers = ['Content-Type' => 'text/html; charset=UTF-8'];

        if ($format === 'pdf' && class_exists('\Dompdf\\Dompdf')) {
            // Optional server-side PDF generation if Dompdf available
            $dompdf = new \Dompdf\Dompdf();
            $dompdf->loadHtml($html);
            $dompdf->setPaper('A4', 'portrait');
            $dompdf->render();
            return response($dompdf->output(), 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'attachment; filename="daily_report.pdf"']);
        }

        return response($html, 200, $headers);
    }
}
