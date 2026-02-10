import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Leaderboard {
  id: string;
  username: string;
  last_workout: string;
}

@Injectable({
  providedIn: 'root'
})

export class LeaderboardService {
  private apiUrl = 'http://127.0.0.1:8000/api/workouts/leaderboard';

  constructor(private http: HttpClient) { }

  getLeaderboard(): Observable<Leaderboard[]> {
    return this.http.get<Leaderboard[]>(this.apiUrl);
  }
}