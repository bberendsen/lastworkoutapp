import { Injectable, computed, inject, signal } from '@angular/core';
import { TeamService } from './team.service';
import type {
  TeamChallengesPayload,
  TeamDetail,
  TeamJoinRequestItem,
  TeamLeaderboardRow,
  TeamStatistics,
} from '../teams/team.models';

export type TeamTab = 'overview' | 'members' | 'statistics' | 'challenges' | 'requests';

@Injectable({
  providedIn: 'root',
})
export class TeamDetailStateService {
  private readonly teamApi = inject(TeamService);

  private readonly _team = signal<TeamDetail | null>(null);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);
  private readonly _actionError = signal<string | null>(null);
  private readonly _busy = signal(false);
  private readonly _showDeleteModal = signal(false);
  private readonly _deleting = signal(false);
  private readonly _activeTab = signal<TeamTab>('overview');
  private readonly _joinRequests = signal<TeamJoinRequestItem[]>([]);
  private readonly _joinRequestsLoading = signal(false);
  private readonly _joinRequestsError = signal<string | null>(null);
  private readonly _processingRequestId = signal<number | null>(null);
  private readonly _teamStats = signal<TeamStatistics | null>(null);
  private readonly _teamStatsLoading = signal(false);
  private readonly _teamStatsError = signal<string | null>(null);
  private readonly _teamLeaderboardRows = signal<TeamLeaderboardRow[]>([]);
  private readonly _teamLeaderboardLoading = signal(false);
  private readonly _challengesPayload = signal<TeamChallengesPayload | null>(null);
  private readonly _challengesLoading = signal(false);
  private readonly _challengesError = signal<string | null>(null);

  public readonly team = this._team.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly actionError = this._actionError.asReadonly();
  public readonly busy = this._busy.asReadonly();
  public readonly showDeleteModal = this._showDeleteModal.asReadonly();
  public readonly deleting = this._deleting.asReadonly();
  public readonly activeTab = this._activeTab.asReadonly();
  public readonly joinRequests = this._joinRequests.asReadonly();
  public readonly joinRequestsLoading = this._joinRequestsLoading.asReadonly();
  public readonly joinRequestsError = this._joinRequestsError.asReadonly();
  public readonly processingRequestId = this._processingRequestId.asReadonly();
  public readonly teamStats = this._teamStats.asReadonly();
  public readonly teamStatsLoading = this._teamStatsLoading.asReadonly();
  public readonly teamStatsError = this._teamStatsError.asReadonly();
  public readonly teamLeaderboardRows = this._teamLeaderboardRows.asReadonly();
  public readonly teamLeaderboardLoading = this._teamLeaderboardLoading.asReadonly();
  public readonly challengesPayload = this._challengesPayload.asReadonly();
  public readonly challengesLoading = this._challengesLoading.asReadonly();
  public readonly challengesError = this._challengesError.asReadonly();

  public readonly currentWeekByDayBars = computed(() => {
    const stats = this._teamStats();
    const rows = stats?.current_week_by_day ?? [];
    const max = Math.max(2, ...rows.map((row) => row.workouts));
    return rows.map((row) => ({ ...row, percent: (row.workouts / max) * 100 }));
  });

  public readonly lastTwelveWeekBars = computed(() => {
    const stats = this._teamStats();
    const rows = stats?.last_12_weeks ?? [];
    const max = Math.max(1, ...rows.map((row) => row.workouts));
    return rows.map((row) => ({
      ...row,
      label: new Date(row.week_starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      percent: (row.workouts / max) * 100,
    }));
  });

  public readonly leaderboardRankInfo = computed(() => {
    const rows = this._teamLeaderboardRows();
    const id = this._team()?.id;
    if (!rows.length || !id) return null;
    const idx = rows.findIndex((row) => row.id === id);
    if (idx === -1) return null;
    return { rank: idx + 1, total: rows.length };
  });

  public readonly leaderboardPeek = computed((): { rank: number; team: TeamLeaderboardRow; isCurrent: boolean }[] => {
    const rows = this._teamLeaderboardRows();
    const id = this._team()?.id;
    if (!rows.length || !id) return [];
    const idx = rows.findIndex((row) => row.id === id);
    if (idx === -1) return [];
    const n = rows.length;
    let start = 0;
    let end = n;
    if (n > 3) {
      if (idx === 0) {
        start = 0;
        end = 3;
      } else if (idx >= n - 1) {
        start = n - 3;
        end = n;
      } else {
        start = idx - 1;
        end = idx + 2;
      }
    }
    return rows.slice(start, end).map((team, i) => ({ rank: start + i + 1, team, isCurrent: team.id === id }));
  });

  public initialize(teamId: string, initialTab: TeamTab): void {
    this._activeTab.set(initialTab);
    this.fetch(teamId);
  }

  public setTab(tab: TeamTab): void {
    this._activeTab.set(tab);
    this._joinRequestsError.set(null);
    if (tab === 'requests' && this._team()?.is_creator) {
      this.loadJoinRequests();
    }
    if (tab === 'statistics') {
      this.loadTeamStatistics();
    }
    if (tab === 'challenges') {
      this.loadTeamChallenges();
    }
  }

  public fetch(teamId: string): void {
    this._loading.set(true);
    this._error.set(null);
    this._teamLeaderboardRows.set([]);
    this._challengesPayload.set(null);
    this.teamApi.getTeam(teamId).subscribe({
      next: (team) => {
        this._team.set(team);
        this._teamStats.set(null);
        this._loading.set(false);
        this.loadTeamLeaderboard();
        if (team.is_creator && this._activeTab() === 'requests') this.loadJoinRequests();
        if (this._activeTab() === 'statistics') this.loadTeamStatistics();
        if (this._activeTab() === 'challenges') this.loadTeamChallenges();
      },
      error: () => {
        this._error.set('Could not load team.');
        this._loading.set(false);
      },
    });
  }

  public loadTeamLeaderboard(): void {
    this._teamLeaderboardLoading.set(true);
    this.teamApi.getTeamsLeaderboard().subscribe({
      next: (rows) => {
        this._teamLeaderboardRows.set(rows);
        this._teamLeaderboardLoading.set(false);
      },
      error: () => {
        this._teamLeaderboardRows.set([]);
        this._teamLeaderboardLoading.set(false);
      },
    });
  }

  public loadTeamChallenges(): void {
    const team = this._team();
    if (!team) return;
    this._challengesLoading.set(true);
    this._challengesError.set(null);
    this.teamApi.getTeamChallenges(team.id).subscribe({
      next: (payload) => {
        this._challengesPayload.set(payload);
        this._challengesLoading.set(false);
      },
      error: () => {
        this._challengesError.set('Could not load challenges.');
        this._challengesLoading.set(false);
      },
    });
  }

  public loadTeamStatistics(): void {
    const team = this._team();
    if (!team) return;
    this._teamStatsLoading.set(true);
    this._teamStatsError.set(null);
    this.teamApi.getTeamStatistics(team.id).subscribe({
      next: (stats) => {
        this._teamStats.set(stats);
        this._teamStatsLoading.set(false);
      },
      error: () => {
        this._teamStatsError.set('Could not load statistics.');
        this._teamStatsLoading.set(false);
      },
    });
  }

  public loadJoinRequests(): void {
    const team = this._team();
    if (!team?.is_creator) return;
    this._joinRequestsLoading.set(true);
    this._joinRequestsError.set(null);
    this.teamApi.getJoinRequests(team.id).subscribe({
      next: (list) => {
        this._joinRequests.set(list);
        this._joinRequestsLoading.set(false);
      },
      error: () => {
        this._joinRequestsError.set('Could not load requests.');
        this._joinRequestsLoading.set(false);
      },
    });
  }

  public requestToJoin(): void {
    const team = this._team();
    if (!team || this._busy()) return;
    this._busy.set(true);
    this._actionError.set(null);
    this.teamApi.requestToJoin(team.id).subscribe({
      next: (updated) => {
        this._team.set(updated);
        this._busy.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this._actionError.set(err?.error?.message ?? 'Could not send request.');
        this._busy.set(false);
      },
    });
  }

  public approveRequest(req: TeamJoinRequestItem): void {
    const team = this._team();
    if (!team || this._processingRequestId() !== null) return;
    this._processingRequestId.set(req.id);
    this._joinRequestsError.set(null);
    this.teamApi.approveJoinRequest(team.id, req.id).subscribe({
      next: (updated) => {
        this._team.set(updated);
        this._teamStats.set(null);
        if (this._activeTab() === 'statistics') this.loadTeamStatistics();
        if (this._activeTab() === 'challenges') this.loadTeamChallenges();
        this.loadTeamLeaderboard();
        this._joinRequests.update((list) => list.filter((r) => r.id !== req.id));
        this._processingRequestId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this._joinRequestsError.set(err?.error?.message ?? 'Could not approve.');
        this._processingRequestId.set(null);
      },
    });
  }

  public rejectRequest(req: TeamJoinRequestItem): void {
    const team = this._team();
    if (!team || this._processingRequestId() !== null) return;
    this._processingRequestId.set(req.id);
    this._joinRequestsError.set(null);
    this.teamApi.rejectJoinRequest(team.id, req.id).subscribe({
      next: () => {
        this._joinRequests.update((list) => list.filter((r) => r.id !== req.id));
        this._team.update((tm) =>
          tm
            ? { ...tm, pending_join_requests_count: Math.max(0, (tm.pending_join_requests_count ?? 0) - 1) }
            : null
        );
        this._processingRequestId.set(null);
      },
      error: () => {
        this._joinRequestsError.set('Could not decline.');
        this._processingRequestId.set(null);
      },
    });
  }

  public leave(onSuccess: () => void): void {
    const team = this._team();
    if (!team || this._busy()) return;
    this._busy.set(true);
    this._actionError.set(null);
    this.teamApi.leaveTeam(team.id).subscribe({
      next: () => {
        this._busy.set(false);
        onSuccess();
      },
      error: (err: { error?: { message?: string } }) => {
        this._actionError.set(err?.error?.message ?? 'Could not leave.');
        this._busy.set(false);
      },
    });
  }

  public openDeleteModal(): void {
    this._actionError.set(null);
    this._showDeleteModal.set(true);
  }

  public closeDeleteModal(): void {
    if (this._deleting()) return;
    this._showDeleteModal.set(false);
  }

  public confirmDelete(onSuccess: () => void): void {
    const team = this._team();
    if (!team || team.members_count > 0 || this._deleting()) return;
    this._deleting.set(true);
    this._actionError.set(null);
    this.teamApi.deleteTeam(team.id).subscribe({
      next: () => onSuccess(),
      error: (err: { error?: { message?: string } }) => {
        this._actionError.set(err?.error?.message ?? 'Could not delete team.');
        this._deleting.set(false);
        this._showDeleteModal.set(false);
      },
    });
  }
}
