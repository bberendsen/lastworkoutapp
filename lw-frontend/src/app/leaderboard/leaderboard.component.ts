import { Component, inject, OnInit, signal } from '@angular/core';
import { teamPresetLinearGradient } from '../teams/team.models';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LeaderboardStateService } from '../services/leaderboard-state.service';

type LeaderboardTab = 'users' | 'teams';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit {
  public readonly leaderboardState = inject(LeaderboardStateService);
  public readonly leaderboard = this.leaderboardState.userLeaderboard;
  public readonly userLeaderboardError = this.leaderboardState.userLeaderboardError;
  public readonly teamsLeaderboard = this.leaderboardState.teamsLeaderboard;
  public readonly teamsLoading = this.leaderboardState.teamsLoading;
  public readonly teamsError = this.leaderboardState.teamsError;
  public readonly activeTab = signal<LeaderboardTab>('teams');

  readonly presetGradient = teamPresetLinearGradient;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'teams') {
      this.activeTab.set('teams');
    }

    this.leaderboardState.loadAll();
  }

  public setTab(tab: LeaderboardTab): void {
    this.activeTab.set(tab);
  }

  public backToHomescreen(): void {
    void this.router.navigate(['/homescreen']);
  }
}
