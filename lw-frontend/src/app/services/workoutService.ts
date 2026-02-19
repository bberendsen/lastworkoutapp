import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, catchError, throwError, tap } from 'rxjs';

export interface Workout {
  id: string;
  user_id: string;
  workout_datetime: string;
  source: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private apiUrl = 'http://127.0.0.1:8000/api/workouts/';

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

  logWorkout(userId: string, source: string = 'manual', workoutDatetime?: string): Observable<any> {
    const payload: any = { user_id: userId, source };
    if (workoutDatetime) {
      payload.workout_datetime = workoutDatetime;
    }
    return this.http.post<string>(`${this.apiUrl}`, payload).pipe(
      tap((response) => {
        console.log('Workout logged:', response);
      }),
      catchError((error) => {
        console.error('Error logging workout:', error);
        return throwError(() => error);
      })
    );
  }
}