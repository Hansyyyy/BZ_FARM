<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarNote;
use App\Services\GoogleHolidayService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CalendarNoteController extends Controller
{
    public function index(Request $request, GoogleHolidayService $holidayService)
    {
        $month = $request->query('month', Carbon::now()->format('Y-m'));
        $monthStart = Carbon::parse($month.'-01')->startOfMonth();
        $gridStart = $monthStart->copy()->startOfWeek(Carbon::SUNDAY);
        $gridEnd = $monthStart->copy()->endOfMonth()->endOfWeek(Carbon::SATURDAY);

        $notes = CalendarNote::whereBetween('note_date', [$gridStart, $gridEnd])
            ->orderBy('note_date')
            ->get();

        $holidays = $holidayService->between($gridStart, $gridEnd);

        return response()->json([
            'notes' => $notes,
            'holidays' => $holidays,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'note_date' => 'required|date',
            'content' => 'required|string|max:500',
        ]);

        $note = CalendarNote::updateOrCreate(
            ['note_date' => $data['note_date']],
            [
                'content' => $data['content'],
                'user_id' => auth()->id(),
            ]
        );

        return response()->json([
            'message' => 'Calendar note saved.',
            'note' => $note,
        ], $note->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, CalendarNote $calendarNote)
    {
        $data = $request->validate([
            'content' => 'required|string|max:500',
        ]);

        $calendarNote->update([
            'content' => $data['content'],
            'user_id' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Calendar note updated.',
            'note' => $calendarNote,
        ]);
    }

    public function destroy(CalendarNote $calendarNote)
    {
        $calendarNote->delete();

        return response()->json(['message' => 'Calendar note deleted.']);
    }
}
