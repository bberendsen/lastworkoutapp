import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  birthdate?: string;
  email?: string;
  has_subscription?: boolean;
  xp?: number;
}

export interface UserProfileTeam {
  id: string;
  name: string;
  gradient_preset: string;
  logo_url: string | null;
}

export interface UserProfilePayload {
  profile: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    age: number | null;
  };
  team: UserProfileTeam | null;
  stats: {
    total_workouts: number;
    total_xp: number;
    /** XP from workouts logged this calendar week (Mon–Sun), same rate as global workout XP. */
    xp_this_week: number;
    last_workout_at: string | null;
    current_streak: number;
    longest_streak: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://lastworkoutapp.onrender.com/api';

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  /** Authenticated: view another user’s public profile, team label, and stats. */
  getUserProfile(userId: string): Observable<UserProfilePayload> {
    return this.http.get<UserProfilePayload>(`${this.apiUrl}/users/${userId}/profile`);
  }

  updateUser(id: string, data: Partial<Pick<User, 'first_name' | 'last_name' | 'username'>>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`);
  }
}
