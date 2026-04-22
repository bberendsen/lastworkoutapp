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
  private apiUrl = 'https://lastworkoutapp.onrender.com/api/workouts/leaderboard';

  constructor(private http: HttpClient) { }

  getLeaderboard(): Observable<Leaderboard[]> {
    return this.http.get<Leaderboard[]>(this.apiUrl);
  }
}