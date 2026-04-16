<?php

namespace App\Http\Controllers;

use App\Http\Requests\DismissNotificationRequest;
use App\Http\Requests\ListNotificationsRequest;
use App\Http\Responses\DismissNotificationResponse;
use App\Http\Responses\NotificationsListResponse;
use App\Services\NotificationService;

class NotificationController extends Controller
{
    public function index(ListNotificationsRequest $request, NotificationService $notificationService)
    {
        $items = $notificationService->listFor($request->user());

        return response()->json(NotificationsListResponse::from($items));
    }

    public function dismiss(
        DismissNotificationRequest $request,
        string $notificationKey,
        NotificationService $notificationService
    ) {
        $notificationService->dismiss($request->user(), $notificationKey);

        return response()->json(DismissNotificationResponse::make());
    }

    public function markRead(
        DismissNotificationRequest $request,
        string $notificationKey,
        NotificationService $notificationService
    ) {
        $notificationService->markRead($request->user(), $notificationKey);

        return response()->json(DismissNotificationResponse::make());
    }
}
