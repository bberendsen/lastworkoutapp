import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, catchError, throwError, tap } from 'rxjs';
import { APP_ENDPOINTS } from '../config/app-endpoints';

export interface Workout {
  id: string;
  user_id: string;
  workout_datetime: string;
  source: string;
}

export interface LiveFeedItem {
  id: string;
  event_type: 'workout' | 'challenge';
  event_datetime: string;
  workout_datetime: string | null;
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    initials: string;
    xp_total: number;
    xp_earned: number;
  } | null;
  team: {
    id: string | null;
    name: string | null;
    logo_url: string | null;
  };
  challenge: {
    type: string;
    title: string;
    xp_reward: number;
  } | null;
}

export interface LiveFeedResponse {
  items: LiveFeedItem[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  readonly apiOrigin = APP_ENDPOINTS.apiOrigin;
  private apiUrl = APP_ENDPOINTS.workouts.base;

  constructor(private http: HttpClient) { }

  getWorkouts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getLeaderboard(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + 'leaderboard');
  }

  getWorkoutByUser(userId: string): Observable<Workout[]> {
    return this.http.get<Workout[]>(`${this.apiUrl}${userId}`);
  }

  getLiveFeed(page: number = 1, perPage: number = 50): Observable<LiveFeedResponse> {
    return this.http.get<{ items?: LiveFeedItem[]; meta?: { page?: number; per_page?: number; has_more?: boolean } }>(
      `${this.apiUrl}feed?page=${page}&per_page=${perPage}`
    ).pipe(
      map((r) => ({
        items: Array.isArray(r.items) ? r.items : [],
        meta: {
          page: r.meta?.page ?? page,
          per_page: r.meta?.per_page ?? perPage,
          has_more: !!r.meta?.has_more,
        },
      }))
    );
  }

  logWorkout(userId: string, source: string = 'manual', workoutDatetime?: string): Observable<any> {
    const payload: any = { user_id: userId, source };
    if (workoutDatetime) {
      payload.workout_datetime = workoutDatetime;
    }
    return this.http.post<string>(`${this.apiUrl}`, payload).pipe(
      tap((response) => {
      }),
      catchError((error) => {
        console.error('Error logging workout:', error);
        return throwError(() => error);
      })
    );
  }
}