import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_ENDPOINTS } from '../config/app-endpoints';

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
  xp: number;
  /** Workout XP earned this calendar week (Mon–Sun), same as profile. */
  xp_this_week: number;
}

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  private apiUrl = APP_ENDPOINTS.streak.base;

  constructor(private http: HttpClient) {}

  getCurrentStreak(userId: string): Observable<StreakResponse> {
    return this.http.get<StreakResponse>(APP_ENDPOINTS.streak.byUser(userId));
  }

  getLeaderboardWithStreaks(): Observable<LeaderboardWithStreak[]> {
    return this.http.get<LeaderboardWithStreak[]>(APP_ENDPOINTS.streak.leaderboard);
  }
}
