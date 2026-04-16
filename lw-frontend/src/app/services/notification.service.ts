import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  event_datetime: string | null;
  is_unread: boolean;
  action_url: string | null;
}

interface NotificationsResponse {
  items?: AppNotification[];
  unread_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://127.0.0.1:8000/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<{ items: AppNotification[]; unreadCount: number }> {
    return this.http
      .get<NotificationsResponse>(this.apiUrl)
      .pipe(
        map((res) => ({
          items: Array.isArray(res.items) ? res.items : [],
          unreadCount: typeof res.unread_count === 'number' ? res.unread_count : 0,
        }))
      );
  }

  dismissNotification(notificationKey: string): Observable<void> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${encodeURIComponent(notificationKey)}`)
      .pipe(map(() => undefined));
  }

  markNotificationRead(notificationKey: string): Observable<void> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/${encodeURIComponent(notificationKey)}/read`, {})
      .pipe(map(() => undefined));
  }
}
