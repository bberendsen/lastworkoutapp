import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  TeamDetail,
  TeamGradientPreset,
  TeamChallengesPayload,
  TeamJoinRequestItem,
  TeamLeaderboardRow,
  TeamStatistics,
  TeamSummary,
} from '../teams/team.models';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api';

  listTeams(): Observable<TeamSummary[]> {
    return this.http.get<{ teams?: TeamSummary[] }>(`${this.apiUrl}/teams`).pipe(
      map((r) => (Array.isArray(r.teams) ? r.teams : []))
    );
  }

  /** Teams ordered by total workouts (workouts linked to the team). */
  getTeamsLeaderboard(): Observable<TeamLeaderboardRow[]> {
    return this.http.get<{ teams?: TeamLeaderboardRow[] }>(`${this.apiUrl}/teams/leaderboard`).pipe(
      map((r) => (Array.isArray(r.teams) ? r.teams : []))
    );
  }

  getTeam(id: string): Observable<TeamDetail> {
    return this.http.get<TeamDetail>(`${this.apiUrl}/teams/${id}`);
  }

  getTeamStatistics(teamId: string): Observable<TeamStatistics> {
    return this.http.get<TeamStatistics>(`${this.apiUrl}/teams/${teamId}/statistics`);
  }

  getTeamChallenges(teamId: string): Observable<TeamChallengesPayload> {
    return this.http.get<TeamChallengesPayload>(`${this.apiUrl}/teams/${teamId}/challenges`);
  }

  createTeam(data: {
    name: string;
    gradient_preset: TeamGradientPreset;
    logo?: File | null;
  }): Observable<TeamSummary> {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('gradient_preset', data.gradient_preset);
    if (data.logo) {
      fd.append('logo', data.logo, data.logo.name);
    }
    return this.http.post<TeamSummary>(`${this.apiUrl}/teams`, fd);
  }

  updateTeam(
    id: string,
    data: {
      name: string;
      gradient_preset: TeamGradientPreset;
      logo?: File | null;
    }
  ): Observable<TeamSummary> {
    const fd = new FormData();
    fd.append('name', data.name);
    fd.append('gradient_preset', data.gradient_preset);
    if (data.logo) {
      fd.append('logo', data.logo, data.logo.name);
    }
    return this.http.put<TeamSummary>(`${this.apiUrl}/teams/${id}`, fd);
  }

  deleteTeam(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/teams/${id}`);
  }

  /** Submit a join request (creator must approve). */
  requestToJoin(id: string): Observable<TeamDetail> {
    return this.http.post<TeamDetail>(`${this.apiUrl}/teams/${id}/join`, {});
  }

  getJoinRequests(teamId: string): Observable<TeamJoinRequestItem[]> {
    return this.http
      .get<{ requests: TeamJoinRequestItem[] }>(`${this.apiUrl}/teams/${teamId}/join-requests`)
      .pipe(map((r) => (Array.isArray(r.requests) ? r.requests : [])));
  }

  approveJoinRequest(teamId: string, requestId: number): Observable<TeamDetail> {
    return this.http.post<TeamDetail>(`${this.apiUrl}/teams/${teamId}/join-requests/${requestId}/approve`, {});
  }

  rejectJoinRequest(teamId: string, requestId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/teams/${teamId}/join-requests/${requestId}/reject`, {});
  }

  leaveTeam(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/teams/${id}/leave`, {});
  }
}
