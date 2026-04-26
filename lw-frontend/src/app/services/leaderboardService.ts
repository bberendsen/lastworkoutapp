import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_ENDPOINTS } from '../config/app-endpoints';

export interface Leaderboard {
  id: string;
  username: string;
  last_workout: string;
}

@Injectable({
  providedIn: 'root'
})

export class LeaderboardService {
  private apiUrl = APP_ENDPOINTS.workouts.leaderboard;

  constructor(private http: HttpClient) { }

  getLeaderboard(): Observable<Leaderboard[]> {
    return this.http.get<Leaderboard[]>(this.apiUrl);
  }
}