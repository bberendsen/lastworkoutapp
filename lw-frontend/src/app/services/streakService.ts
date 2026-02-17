import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeeklyProgress {
  workouts_this_week: number;
  goal: number;
  week_start: string;
  week_end: string;
}

export interface StreakResponse {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  weekly_progress: WeeklyProgress;
}

export interface LeaderboardWithStreak {
  id: string;
  username: string;
  last_workout: string;
  current_streak: number;
  longest_streak: number;
}

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  private apiUrl = 'http://127.0.0.1:8000/api/streak';

  constructor(private http: HttpClient) {}

  getCurrentStreak(userId: string): Observable<StreakResponse> {
    return this.http.get<StreakResponse>(`${this.apiUrl}/${userId}`);
  }

  getLeaderboardWithStreaks(): Observable<LeaderboardWithStreak[]> {
    return this.http.get<LeaderboardWithStreak[]>(`${this.apiUrl}/leaderboard`);
  }
}
