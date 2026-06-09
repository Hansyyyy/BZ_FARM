<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $this->notifications->syncForUser($user);

        return response()->json([
            'unread_count' => $this->notifications->unreadCount($user),
            'items' => $this->notifications->getForUser($user)->map(fn (UserNotification $notification) => [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'link' => $notification->link,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ]),
        ]);
    }

    public function markRead(Request $request, UserNotification $userNotification)
    {
        abort_unless($userNotification->user_id === $request->user()->id, 403);

        $userNotification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function markAllRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'unread_count' => 0,
        ]);
    }
}
