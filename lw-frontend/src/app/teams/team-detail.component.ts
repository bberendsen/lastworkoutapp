import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import type {
  TeamJoinRequestItem
} from './team.models';
import { teamPresetLinearGradient } from './team.models';
import { TeamDetailStateService, TeamTab } from '../services/team-detail-state.service';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-detail.component.html',
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly state = inject(TeamDetailStateService);

  public readonly team = this.state.team;
  public readonly loading = this.state.loading;
  public readonly error = this.state.error;
  public readonly actionError = this.state.actionError;
  public readonly busy = this.state.busy;
  public readonly showDeleteModal = this.state.showDeleteModal;
  public readonly deleting = this.state.deleting;
  public readonly activeTab = this.state.activeTab;
  public readonly joinRequests = this.state.joinRequests;
  public readonly joinRequestsLoading = this.state.joinRequestsLoading;
  public readonly joinRequestsError = this.state.joinRequestsError;
  public readonly processingRequestId = this.state.processingRequestId;
  public readonly teamStats = this.state.teamStats;
  public readonly teamStatsLoading = this.state.teamStatsLoading;
  public readonly teamStatsError = this.state.teamStatsError;
  public readonly teamLeaderboardRows = this.state.teamLeaderboardRows;
  public readonly teamLeaderboardLoading = this.state.teamLeaderboardLoading;
  public readonly challengesPayload = this.state.challengesPayload;
  public readonly challengesLoading = this.state.challengesLoading;
  public readonly challengesError = this.state.challengesError;
  public readonly currentWeekByDayBars = this.state.currentWeekByDayBars;
  public readonly lastTwelveWeekBars = this.state.lastTwelveWeekBars;
  public readonly leaderboardRankInfo = this.state.leaderboardRankInfo;
  public readonly leaderboardPeek = this.state.leaderboardPeek;
  public readonly presetGradient = teamPresetLinearGradient;

  public back(): void {
    this.location.back();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/teams']);
      return;
    }
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    const initialTab: TeamTab =
      tabParam === 'members' || tabParam === 'statistics' || tabParam === 'challenges' || tabParam === 'requests'
        ? tabParam
        : 'overview';
    this.state.initialize(id, initialTab);
  }

  public setTab(tab: TeamTab): void {
    this.state.setTab(tab);
  }

  public loadTeamLeaderboard(): void {
    this.state.loadTeamLeaderboard();
  }

  public loadTeamChallenges(): void {
    this.state.loadTeamChallenges();
  }

  public loadTeamStatistics(): void {
    this.state.loadTeamStatistics();
  }

  public loadJoinRequests(): void {
    this.state.loadJoinRequests();
  }

  public requestToJoin(): void {
    this.state.requestToJoin();
  }

  public approveRequest(req: TeamJoinRequestItem): void {
    this.state.approveRequest(req);
  }

  public rejectRequest(req: TeamJoinRequestItem): void {
    this.state.rejectRequest(req);
  }

  public leave(): void {
    this.state.leave(() => void this.router.navigate(['/teams']));
  }

  public openDeleteModal(): void {
    this.state.openDeleteModal();
  }

  public closeDeleteModal(): void {
    this.state.closeDeleteModal();
  }

  public confirmDelete(): void {
    this.state.confirmDelete(() => void this.router.navigate(['/teams']));
  }
}
