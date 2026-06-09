<?php

namespace App\Services;

use App\Models\FeedItem;
use App\Models\MedicineItem;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Collection;

class NotificationService
{
    public function syncForUser(User $user): void
    {
        $this->syncLowStockAlerts($user);

        if ($user->isAdmin()) {
            $this->syncAdminAlerts($user);
        }
    }

    public function notifyUser(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        ?string $referenceKey = null,
    ): ?UserNotification {
        if ($referenceKey) {
            $existing = UserNotification::where('user_id', $userId)
                ->where('reference_key', $referenceKey)
                ->first();

            if ($existing) {
                if ($existing->read_at === null) {
                    return $existing;
                }

                $existing->update([
                    'type' => $type,
                    'title' => $title,
                    'message' => $message,
                    'link' => $link,
                    'read_at' => null,
                ]);

                return $existing->fresh();
            }
        }

        return UserNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'link' => $link,
            'reference_key' => $referenceKey,
        ]);
    }

    public function notifyAdmins(
        string $type,
        string $title,
        string $message,
        ?string $link = null,
        ?string $referenceKey = null,
    ): void {
        User::where('role', 'admin')->pluck('id')->each(function (int $adminId) use ($type, $title, $message, $link, $referenceKey) {
            $this->notifyUser($adminId, $type, $title, $message, $link, $referenceKey);
        });
    }

    public function getForUser(User $user, int $limit = 20): Collection
    {
        return UserNotification::where('user_id', $user->id)
            ->latest()
            ->take($limit)
            ->get();
    }

    public function unreadCount(User $user): int
    {
        return UserNotification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    protected function syncLowStockAlerts(User $user): void
    {
        FeedItem::whereColumn('stock', '<=', 'reorder_level')->get()->each(function (FeedItem $item) use ($user) {
            $this->notifyUser(
                $user->id,
                'low_stock',
                'Low Feed Stock',
                "{$item->name} is at or below reorder level ({$item->stock} {$item->unit} left).",
                '/chicken-stock?tab=feeds',
                "low_stock_feed_{$item->id}",
            );
        });

        MedicineItem::whereColumn('stock', '<=', 'reorder_level')->get()->each(function (MedicineItem $item) use ($user) {
            $this->notifyUser(
                $user->id,
                'low_stock',
                'Low Medicine Stock',
                "{$item->name} is at or below reorder level ({$item->stock} {$item->unit} left).",
                '/chicken-stock?tab=medicine',
                "low_stock_medicine_{$item->id}",
            );
        });
    }

    protected function syncAdminAlerts(User $user): void
    {
        $pendingManagers = User::where('role', 'manager')->count();

        if ($pendingManagers === 0) {
            return;
        }

        $this->notifyUser(
            $user->id,
            'system',
            'Manager Oversight',
            'Review manager-submitted records on the Inventory Dashboard.',
            '/dashboard',
            'admin_manager_oversight',
        );
    }
}
