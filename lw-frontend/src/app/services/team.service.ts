import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_ENDPOINTS } from '../config/app-endpoints';
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
  private apiUrl = APP_ENDPOINTS.apiBase;

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
    return this.http.get<TeamDetail>(APP_ENDPOINTS.teams.byId(id));
  }

  getTeamStatistics(teamId: string): Observable<TeamStatistics> {
    return this.http.get<TeamStatistics>(APP_ENDPOINTS.teams.statistics(teamId));
  }

  getTeamChallenges(teamId: string): Observable<TeamChallengesPayload> {
    return this.http.get<TeamChallengesPayload>(APP_ENDPOINTS.teams.challenges(teamId));
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
    return this.http.post<TeamDetail>(APP_ENDPOINTS.teams.join(id), {});
  }

  getJoinRequests(teamId: string): Observable<TeamJoinRequestItem[]> {
    return this.http
      .get<{ requests: TeamJoinRequestItem[] }>(APP_ENDPOINTS.teams.joinRequests(teamId))
      .pipe(map((r) => (Array.isArray(r.requests) ? r.requests : [])));
  }

  approveJoinRequest(teamId: string, requestId: number): Observable<TeamDetail> {
    return this.http.post<TeamDetail>(APP_ENDPOINTS.teams.approveJoinRequest(teamId, requestId), {});
  }

  rejectJoinRequest(teamId: string, requestId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(APP_ENDPOINTS.teams.rejectJoinRequest(teamId, requestId), {});
  }

  leaveTeam(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(APP_ENDPOINTS.teams.leave(id), {});
  }
}
