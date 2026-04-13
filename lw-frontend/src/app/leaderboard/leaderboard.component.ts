import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { LeaderboardWithStreak, StreakService } from '../services/streakService';
import { TeamService } from '../services/team.service';
import type { TeamLeaderboardRow } from '../teams/team.models';
import { teamPresetLinearGradient } from '../teams/team.models';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

type LeaderboardTab = 'users' | 'teams';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css'],
})
export class LeaderboardComponent implements OnInit {
  leaderboard: WritableSignal<LeaderboardWithStreak[]> = signal([]);
  teamsLeaderboard: WritableSignal<TeamLeaderboardRow[]> = signal([]);
  teamsLoading = signal(false);
  teamsError = signal<string | null>(null);

  activeTab = signal<LeaderboardTab>('teams');

  readonly presetGradient = teamPresetLinearGradient;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private streakService = inject(StreakService);
  private teamService = inject(TeamService);

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'teams') {
      this.activeTab.set('teams');
    }

    this.streakService.getLeaderboardWithStreaks().subscribe({
      next: (rows) => {
        this.leaderboard.set(rows);
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      },
    });

    this.loadTeamsLeaderboard();
  }

  setTab(tab: LeaderboardTab): void {
    this.activeTab.set(tab);
  }

  loadTeamsLeaderboard(): void {
    this.teamsLoading.set(true);
    this.teamsError.set(null);
    this.teamService.getTeamsLeaderboard().subscribe({
      next: (rows) => {
        this.teamsLeaderboard.set(rows);
        this.teamsLoading.set(false);
      },
      error: () => {
        this.teamsError.set('Could not load teams.');
        this.teamsLoading.set(false);
      },
    });
  }

  backToHomescreen(): void {
    void this.router.navigate(['/homescreen']);
  }
}
