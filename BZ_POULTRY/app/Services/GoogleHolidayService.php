<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class GoogleHolidayService
{
    public function between(Carbon $start, Carbon $end): array
    {
        $holidays = $this->allHolidays();

        return array_values(array_filter($holidays, function (array $holiday) use ($start, $end) {
            $date = Carbon::parse($holiday['date']);

            return $date->betweenIncluded($start, $end);
        }));
    }

    /**
     * @return list<array{date: string, name: string}>
     */
    private function allHolidays(): array
    {
        return Cache::remember('google-holidays-ph', now()->addHours(24), function () {
            $url = config('services.google_holidays.calendar_url');

            $response = Http::timeout(15)->get($url);

            if (! $response->successful()) {
                return [];
            }

            return $this->parseIcs($response->body());
        });
    }

    /**
     * @return list<array{date: string, name: string}>
     */
    private function parseIcs(string $ics): array
    {
        $holidays = [];
        $blocks = preg_split('/BEGIN:VEVENT/', $ics) ?: [];

        foreach ($blocks as $block) {
            if (! str_contains($block, 'END:VEVENT')) {
                continue;
            }

            $summary = $this->extractValue($block, 'SUMMARY');
            $dtStart = $this->extractValue($block, 'DTSTART');

            if (! $summary || ! $dtStart) {
                continue;
            }

            $date = $this->parseIcsDate($dtStart);

            if (! $date) {
                continue;
            }

            $dateKey = $date->toDateString();
            $name = $this->cleanSummary($summary);

            if (! isset($holidays[$dateKey])) {
                $holidays[$dateKey] = [
                    'date' => $dateKey,
                    'name' => $name,
                ];
            }
        }

        ksort($holidays);

        return array_values($holidays);
    }

    private function extractValue(string $block, string $key): ?string
    {
        if (! preg_match('/^'.preg_quote($key, '/').'(?:;[^:]*)?:(.+)$/m', $block, $matches)) {
            return null;
        }

        return trim($this->unwrapIcsText($matches[1]));
    }

    private function unwrapIcsText(string $value): string
    {
        return preg_replace('/\R[ \t]/', '', $value) ?? $value;
    }

    private function parseIcsDate(string $value): ?Carbon
    {
        $value = preg_replace('/[^0-9TZ]/', '', $value) ?? $value;

        if (strlen($value) >= 8) {
            return Carbon::createFromFormat('Ymd', substr($value, 0, 8))->startOfDay();
        }

        return null;
    }

    private function cleanSummary(string $summary): string
    {
        $summary = preg_replace('/\s*\(.*?\)\s*$/', '', $summary) ?? $summary;

        return trim($summary);
    }
}
