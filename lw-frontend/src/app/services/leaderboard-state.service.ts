import { Injectable, inject, signal } from '@angular/core';
import { LeaderboardWithStreak, StreakService } from './streakService';
import { TeamStateService } from './team-state.service';

@Injectable({
  providedIn: 'root',
})
export class LeaderboardStateService {
  private readonly streakApi = inject(StreakService);
  private readonly teamState = inject(TeamStateService);

  private readonly _userLeaderboard = signal<LeaderboardWithStreak[]>([]);
  private readonly _userLeaderboardError = signal<string | null>(null);

  public readonly userLeaderboard = this._userLeaderboard.asReadonly();
  public readonly userLeaderboardError = this._userLeaderboardError.asReadonly();
  public readonly teamsLeaderboard = this.teamState.teamsLeaderboard;
  public readonly teamsLoading = this.teamState.loadingTeamsLeaderboard;
  public readonly teamsError = this.teamState.teamsLeaderboardError;

  public loadAll(): void {
    this.loadUserLeaderboard();
    this.teamState.loadTeamsLeaderboard();
  }

  public loadUserLeaderboard(): void {
    this._userLeaderboardError.set(null);
    this.streakApi.getLeaderboardWithStreaks().subscribe({
      next: (rows) => this._userLeaderboard.set(rows),
      error: () => this._userLeaderboardError.set('Could not load leaderboard.'),
    });
  }
}
