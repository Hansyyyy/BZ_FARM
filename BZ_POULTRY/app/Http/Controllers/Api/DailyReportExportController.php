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
            'report_type' => 'nullable|in:daily,weekly,monthly',
            'category' => 'nullable|in:all,egg,poultry,mortality,feed,sales,inventory',
            'building' => 'nullable|string',
            'batch' => 'nullable|string',
        ]);

        $format = $request->query('format', 'csv');
        $date = $request->query('date');
        $start = $request->query('start_date');
        $end = $request->query('end_date');
        $reportType = $request->query('report_type', 'daily');
        $category = $request->query('category', 'all');
        $buildingFilter = $request->query('building');
        $batchFilter = $request->query('batch');

        $showEgg = $category === 'all' || $category === 'egg';
        $showPoultry = $category === 'all' || $category === 'poultry';
        $showFeed = $category === 'all' || $category === 'feed';
        $showMortality = $category === 'all' || $category === 'mortality';
        $showSales = $category === 'all' || $category === 'sales';
        $showInventory = $category === 'all' || $category === 'inventory';
        $showBuildingPerformance = $category === 'all';

        $matchesFilter = function ($value, $filter) {
            if (!$filter) {
                return true;
            }

            return stripos((string) ($value ?? ''), $filter) !== false;
        };

        $filterRows = function (array $rows, ?string $buildingKey = null, ?string $batchKey = null) use ($buildingFilter, $batchFilter, $matchesFilter) {
            return collect($rows)
                ->filter(function ($row) use ($buildingKey, $batchKey, $buildingFilter, $batchFilter, $matchesFilter) {
                    if ($buildingKey && !$matchesFilter($row[$buildingKey] ?? null, $buildingFilter)) {
                        return false;
                    }

                    if ($batchKey && !$matchesFilter($row[$batchKey] ?? null, $batchFilter)) {
                        return false;
                    }

                    return true;
                })
                ->values()
                ->all();
        };

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

                if ($showEgg) {
                    fputcsv($handle, ['Egg Production']);
                    fputcsv($handle, ['Building', 'Total', 'Soft Shell', 'Damaged', 'Cracked', 'Recorded By']);
                    foreach ($filterRows($snapshot['egg_production'] ?? [], 'building', null) as $row) {
                        fputcsv($handle, [
                            $row['building'],
                            $row['total_eggs'],
                            $row['soft_shell'],
                            $row['damaged'],
                            $row['cracked'],
                            $row['recorded_by'] ?? '—',
                        ]);
                    }
                    fputcsv($handle, []);
                }

                if ($showPoultry) {
                    fputcsv($handle, ['Poultry']);
                    fputcsv($handle, ['Building', 'Batch', 'Type', 'Quantity', 'Mortality', 'Cull']);
                    foreach ($filterRows($snapshot['poultry'] ?? [], 'building', 'batch_no') as $row) {
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
                }

                if ($showSales) {
                    fputcsv($handle, ['Sales']);
                    fputcsv($handle, ['Invoice', 'Customer', 'Product', 'Quantity', 'Amount', 'Payment Method']);
                    foreach ($snapshot['sales'] ?? [] as $row) {
                        fputcsv($handle, [
                            $row['invoice_no'],
                            $row['customer'],
                            $row['product'],
                            $row['quantity'],
                            $row['amount'],
                            $row['payment_method'] ?? '—',
                        ]);
                    }
                    fputcsv($handle, []);
                }

                if ($showInventory) {
                    fputcsv($handle, ['Low Stock Alerts']);
                    fputcsv($handle, ['Name', 'Category', 'Stock', 'Unit']);
                    foreach ($snapshot['low_stock'] ?? [] as $row) {
                        fputcsv($handle, [
                            $row['name'],
                            $row['category'],
                            $row['stock'],
                            $row['unit'],
                        ]);
                    }
                    fputcsv($handle, []);

                    fputcsv($handle, ['Inventory Transactions']);
                    fputcsv($handle, ['Type', 'Item', 'Quantity', 'Notes', 'Recorded By']);
                    foreach ($snapshot['transactions'] ?? [] as $row) {
                        fputcsv($handle, [
                            $row['type'],
                            $row['item_name'],
                            $row['quantity'],
                            $row['notes'] ?? '—',
                            $row['recorded_by'] ?? '—',
                        ]);
                    }
                    fputcsv($handle, []);
                }

                if ($showFeed) {
                    fputcsv($handle, ['Feed Consumption']);
                    fputcsv($handle, ['Building', 'Feed Type', 'Used', 'Remaining']);
                    foreach ($filterRows($snapshot['feed_consumption'] ?? [], 'building', null) as $row) {
                        fputcsv($handle, [$row['building'], $row['feed_type'], $row['used'], $row['remaining']]);
                    }
                    fputcsv($handle, []);
                }

                if ($showMortality) {
                    fputcsv($handle, ['Mortality & Cull Details']);
                    fputcsv($handle, ['Building', 'Batch', 'Mortality', 'Cull', 'Reason']);
                    foreach ($filterRows($snapshot['mortality_cull_details'] ?? [], 'building', 'batch') as $row) {
                        fputcsv($handle, [$row['building'], $row['batch'], $row['mortality'], $row['cull'], $row['reason'] ?? '']);
                    }
                    fputcsv($handle, []);
                }

                if ($showBuildingPerformance) {
                    fputcsv($handle, ['Building Performance']);
                    fputcsv($handle, ['Building', 'Chickens', 'Eggs', 'Mortality', 'Cull', 'Feed Used', 'Status']);
                    foreach ($filterRows($snapshot['building_performance'] ?? [], 'building', null) as $row) {
                        fputcsv($handle, [$row['building'], $row['chickens'], $row['eggs'], $row['mortality'], $row['cull'], $row['feed_used'], $row['status']]);
                    }
                    fputcsv($handle, []);
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
        $html = '<!doctype html><html><head><meta charset="utf-8"><title>Daily Report</title><style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5}h2,h3{margin-top:24px;margin-bottom:8px}p{margin:0 0 12px 0}</style></head><body>';

        foreach ($snapshots as $i => $snapshot) {
            $html .= "<h2>Snapshot " . ($i + 1) . "</h2>";
            $html .= '<h3>Summary</h3><table>';
            foreach (($snapshot['summary'] ?? []) as $k => $v) {
                $html .= '<tr><th>' . htmlspecialchars(ucwords(str_replace('_', ' ', $k))) . '</th><td>' . htmlspecialchars((string) $v) . '</td></tr>';
            }
            $html .= '</table>';

            if ($showEgg) {
                $html .= '<h3>Egg Production</h3><table><thead><tr><th>Building</th><th>Total</th><th>Soft Shell</th><th>Damaged</th><th>Cracked</th><th>Recorded By</th></tr></thead><tbody>';
                foreach ($filterRows($snapshot['egg_production'] ?? [], 'building', null) as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['building']) . '</td><td>' . htmlspecialchars($row['total_eggs']) . '</td><td>' . htmlspecialchars($row['soft_shell']) . '</td><td>' . htmlspecialchars($row['damaged']) . '</td><td>' . htmlspecialchars($row['cracked']) . '</td><td>' . htmlspecialchars($row['recorded_by'] ?? '—') . '</td></tr>';
                }
                $html .= '</tbody></table>';
            }

            if ($showPoultry) {
                $html .= '<h3>Poultry</h3><table><thead><tr><th>Building</th><th>Batch</th><th>Type</th><th>Qty</th><th>Mortality</th><th>Cull</th></tr></thead><tbody>';
                foreach ($filterRows($snapshot['poultry'] ?? [], 'building', 'batch_no') as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['building'] ?? ($row['building_name'] ?? '')) . '</td><td>' . htmlspecialchars($row['batch_no']) . '</td><td>' . htmlspecialchars($row['type']) . '</td><td>' . htmlspecialchars($row['quantity']) . '</td><td>' . htmlspecialchars($row['mortality']) . '</td><td>' . htmlspecialchars($row['cull'] ?? 0) . '</td></tr>';
                }
                $html .= '</tbody></table>';
            }

            if ($showSales) {
                $html .= '<h3>Sales</h3><table><thead><tr><th>Invoice</th><th>Customer</th><th>Product</th><th>Quantity</th><th>Amount</th><th>Payment Method</th></tr></thead><tbody>';
                foreach ($snapshot['sales'] ?? [] as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['invoice_no']) . '</td><td>' . htmlspecialchars($row['customer']) . '</td><td>' . htmlspecialchars($row['product']) . '</td><td>' . htmlspecialchars($row['quantity']) . '</td><td>' . htmlspecialchars($row['amount']) . '</td><td>' . htmlspecialchars($row['payment_method'] ?? '—') . '</td></tr>';
                }
                $html .= '</tbody></table>';
            }

            if ($showInventory) {
                $html .= '<h3>Low Stock Alerts</h3><table><thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Unit</th></tr></thead><tbody>';
                foreach ($snapshot['low_stock'] ?? [] as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['name']) . '</td><td>' . htmlspecialchars($row['category']) . '</td><td>' . htmlspecialchars($row['stock']) . '</td><td>' . htmlspecialchars($row['unit']) . '</td></tr>';
                }
                $html .= '</tbody></table>';

                $html .= '<h3>Inventory Transactions</h3><table><thead><tr><th>Type</th><th>Item</th><th>Quantity</th><th>Notes</th><th>Recorded By</th></tr></thead><tbody>';
                foreach ($snapshot['transactions'] ?? [] as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['type']) . '</td><td>' . htmlspecialchars($row['item_name']) . '</td><td>' . htmlspecialchars($row['quantity']) . '</td><td>' . htmlspecialchars($row['notes'] ?? '—') . '</td><td>' . htmlspecialchars($row['recorded_by'] ?? '—') . '</td></tr>';
                }
                $html .= '</tbody></table>';
            }

            if ($showFeed) {
                $html .= '<h3>Feed Consumption</h3><table><thead><tr><th>Building</th><th>Feed Type</th><th>Used</th><th>Remaining</th></tr></thead><tbody>';
                foreach ($filterRows($snapshot['feed_consumption'] ?? [], 'building', null) as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['building']) . '</td><td>' . htmlspecialchars($row['feed_type']) . '</td><td>' . htmlspecialchars($row['used']) . '</td><td>' . htmlspecialchars($row['remaining']) . '</td></tr>';
                }
                $html .= '</tbody></table>';
            }

            if ($showMortality) {
                $html .= '<h3>Mortality & Cull Details</h3><table><thead><tr><th>Building</th><th>Batch</th><th>Mortality</th><th>Cull</th><th>Reason</th></tr></thead><tbody>';
                foreach ($filterRows($snapshot['mortality_cull_details'] ?? [], 'building', 'batch') as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['building']) . '</td><td>' . htmlspecialchars($row['batch']) . '</td><td>' . htmlspecialchars($row['mortality']) . '</td><td>' . htmlspecialchars($row['cull']) . '</td><td>' . htmlspecialchars($row['reason'] ?? '') . '</td></tr>';
                }
                $html .= '</tbody></table>';
            }

            if ($showBuildingPerformance) {
                $html .= '<h3>Building Performance</h3><table><thead><tr><th>Building</th><th>Chickens</th><th>Eggs</th><th>Mortality</th><th>Cull</th><th>Feed Used</th><th>Status</th></tr></thead><tbody>';
                foreach ($filterRows($snapshot['building_performance'] ?? [], 'building', null) as $row) {
                    $html .= '<tr><td>' . htmlspecialchars($row['building']) . '</td><td>' . htmlspecialchars($row['chickens']) . '</td><td>' . htmlspecialchars($row['eggs']) . '</td><td>' . htmlspecialchars($row['mortality']) . '</td><td>' . htmlspecialchars($row['cull']) . '</td><td>' . htmlspecialchars($row['feed_used']) . '</td><td>' . htmlspecialchars($row['status']) . '</td></tr>';
                }
                $html .= '</tbody></table>';
            }
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
