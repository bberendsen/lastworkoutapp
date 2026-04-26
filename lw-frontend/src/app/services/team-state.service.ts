import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TeamService } from './team.service';
import type { TeamLeaderboardRow, TeamSummary } from '../teams/team.models';

@Injectable({
  providedIn: 'root',
})
export class TeamStateService {
  private readonly teamApi = inject(TeamService);

  private readonly _teams = signal<TeamSummary[]>([]);
  private readonly _loadingTeams = signal(false);
  private readonly _teamsError = signal<string | null>(null);
  private readonly _teamsLeaderboard = signal<TeamLeaderboardRow[]>([]);
  private readonly _loadingTeamsLeaderboard = signal(false);
  private readonly _teamsLeaderboardError = signal<string | null>(null);

  public readonly teams = this._teams.asReadonly();
  public readonly loadingTeams = this._loadingTeams.asReadonly();
  public readonly teamsError = this._teamsError.asReadonly();
  public readonly teamsLeaderboard = this._teamsLeaderboard.asReadonly();
  public readonly loadingTeamsLeaderboard = this._loadingTeamsLeaderboard.asReadonly();
  public readonly teamsLeaderboardError = this._teamsLeaderboardError.asReadonly();
  public readonly hasTeamMembership = computed(() => this._teams().some((team) => team.is_member));

  public loadTeams(): void {
    this._loadingTeams.set(true);
    this._teamsError.set(null);
    this.teamApi
      .listTeams()
      .pipe(finalize(() => this._loadingTeams.set(false)))
      .subscribe({
        next: (list) => this._teams.set(list),
        error: (err: HttpErrorResponse) => {
          const body = err.error as { message?: string } | string | null;
          const message =
            typeof body === 'object' && body && 'message' in body && typeof body.message === 'string'
              ? body.message
              : typeof body === 'string'
                ? body
                : null;
          this._teamsError.set(message ?? `Could not load teams (${err.status}).`);
        },
      });
  }

  public loadTeamsLeaderboard(): void {
    this._loadingTeamsLeaderboard.set(true);
    this._teamsLeaderboardError.set(null);
    this.teamApi.getTeamsLeaderboard().subscribe({
      next: (rows) => {
        this._teamsLeaderboard.set(rows);
        this._loadingTeamsLeaderboard.set(false);
      },
      error: () => {
        this._teamsLeaderboardError.set('Could not load teams.');
        this._loadingTeamsLeaderboard.set(false);
      },
    });
  }
}
