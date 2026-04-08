import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TeamService } from '../services/team.service';
import type {
  TeamChallengesPayload,
  TeamDetail,
  TeamJoinRequestItem,
  TeamLeaderboardRow,
  TeamStatistics,
} from './team.models';
import { teamPresetLinearGradient } from './team.models';

type TeamTab = 'members' | 'statistics' | 'challenges' | 'requests';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-detail.component.html',
})
export class TeamDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teamService = inject(TeamService);

  team = signal<TeamDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  actionError = signal<string | null>(null);
  busy = signal(false);
  showDeleteModal = signal(false);
  deleting = signal(false);

  activeTab = signal<TeamTab>('members');
  joinRequests = signal<TeamJoinRequestItem[]>([]);
  joinRequestsLoading = signal(false);
  joinRequestsError = signal<string | null>(null);
  processingRequestId = signal<number | null>(null);

  teamStats = signal<TeamStatistics | null>(null);
  teamStatsLoading = signal(false);
  teamStatsError = signal<string | null>(null);

  /** Global team leaderboard (by total workouts); used for rank + peek. */
  teamLeaderboardRows = signal<TeamLeaderboardRow[]>([]);
  teamLeaderboardLoading = signal(false);

  challengesPayload = signal<TeamChallengesPayload | null>(null);
  challengesLoading = signal(false);
  challengesError = signal<string | null>(null);

  readonly presetGradient = teamPresetLinearGradient;

  /** 1-based rank of this team among all teams, or null if unknown. */
  leaderboardRankInfo = computed(() => {
    const rows = this.teamLeaderboardRows();
    const id = this.team()?.id;
    if (!rows.length || !id) return null;
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    return { rank: idx + 1, total: rows.length };
  });

  /** Up to 3 teams around this team’s position; current row marked in template. */
  leaderboardPeek = computed((): { rank: number; team: TeamLeaderboardRow; isCurrent: boolean }[] => {
    const rows = this.teamLeaderboardRows();
    const id = this.team()?.id;
    if (!rows.length || !id) return [];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return [];
    const n = rows.length;
    let start: number;
    let end: number;
    if (n <= 3) {
      start = 0;
      end = n;
    } else if (idx === 0) {
      start = 0;
      end = 3;
    } else if (idx >= n - 1) {
      start = n - 3;
      end = n;
    } else {
      start = idx - 1;
      end = idx + 2;
    }
    return rows.slice(start, end).map((team, i) => ({
      rank: start + i + 1,
      team,
      isCurrent: team.id === id,
    }));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/teams']);
      return;
    }
    this.fetch(id);
  }

  fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.teamLeaderboardRows.set([]);
    this.challengesPayload.set(null);
    this.teamService.getTeam(id).subscribe({
      next: (t) => {
        this.team.set(t);
        this.teamStats.set(null);
        this.loading.set(false);
        this.loadTeamLeaderboard();
        if (t.is_creator && this.activeTab() === 'requests') {
          this.loadJoinRequests();
        }
        if (this.activeTab() === 'statistics') {
          this.loadTeamStatistics();
        }
        if (this.activeTab() === 'challenges') {
          this.loadTeamChallenges();
        }
      },
      error: () => {
        this.error.set('Could not load team.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: TeamTab): void {
    this.activeTab.set(tab);
    this.joinRequestsError.set(null);
    if (tab === 'requests' && this.team()?.is_creator) {
      this.loadJoinRequests();
    }
    if (tab === 'statistics') {
      this.loadTeamStatistics();
    }
    if (tab === 'challenges') {
      this.loadTeamChallenges();
    }
  }

  loadTeamLeaderboard(): void {
    this.teamLeaderboardLoading.set(true);
    this.teamService.getTeamsLeaderboard().subscribe({
      next: (rows) => {
        this.teamLeaderboardRows.set(rows);
        this.teamLeaderboardLoading.set(false);
      },
      error: () => {
        this.teamLeaderboardRows.set([]);
        this.teamLeaderboardLoading.set(false);
      },
    });
  }

  loadTeamChallenges(): void {
    const t = this.team();
    if (!t) return;
    this.challengesLoading.set(true);
    this.challengesError.set(null);
    this.teamService.getTeamChallenges(t.id).subscribe({
      next: (payload) => {
        this.challengesPayload.set(payload);
        this.challengesLoading.set(false);
      },
      error: () => {
        this.challengesError.set('Could not load challenges.');
        this.challengesLoading.set(false);
      },
    });
  }

  loadTeamStatistics(): void {
    const t = this.team();
    if (!t) return;
    this.teamStatsLoading.set(true);
    this.teamStatsError.set(null);
    this.teamService.getTeamStatistics(t.id).subscribe({
      next: (s) => {
        this.teamStats.set(s);
        this.teamStatsLoading.set(false);
      },
      error: () => {
        this.teamStatsError.set('Could not load statistics.');
        this.teamStatsLoading.set(false);
      },
    });
  }

  loadJoinRequests(): void {
    const t = this.team();
    if (!t?.is_creator) return;
    this.joinRequestsLoading.set(true);
    this.joinRequestsError.set(null);
    this.teamService.getJoinRequests(t.id).subscribe({
      next: (list) => {
        this.joinRequests.set(list);
        this.joinRequestsLoading.set(false);
      },
      error: () => {
        this.joinRequestsError.set('Could not load requests.');
        this.joinRequestsLoading.set(false);
      },
    });
  }

  requestToJoin(): void {
    const t = this.team();
    if (!t || this.busy()) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.teamService.requestToJoin(t.id).subscribe({
      next: (updated) => {
        this.team.set(updated);
        this.busy.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.actionError.set(err?.error?.message ?? 'Could not send request.');
        this.busy.set(false);
      },
    });
  }

  approveRequest(req: TeamJoinRequestItem): void {
    const t = this.team();
    if (!t || this.processingRequestId() !== null) return;
    this.processingRequestId.set(req.id);
    this.joinRequestsError.set(null);
    this.teamService.approveJoinRequest(t.id, req.id).subscribe({
      next: (updated) => {
        this.team.set(updated);
        this.teamStats.set(null);
        if (this.activeTab() === 'statistics') {
          this.loadTeamStatistics();
        }
        if (this.activeTab() === 'challenges') {
          this.loadTeamChallenges();
        }
        this.loadTeamLeaderboard();
        this.joinRequests.update((list) => list.filter((r) => r.id !== req.id));
        this.processingRequestId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.joinRequestsError.set(err?.error?.message ?? 'Could not approve.');
        this.processingRequestId.set(null);
      },
    });
  }

  rejectRequest(req: TeamJoinRequestItem): void {
    const t = this.team();
    if (!t || this.processingRequestId() !== null) return;
    this.processingRequestId.set(req.id);
    this.joinRequestsError.set(null);
    this.teamService.rejectJoinRequest(t.id, req.id).subscribe({
      next: () => {
        this.joinRequests.update((list) => list.filter((r) => r.id !== req.id));
        this.team.update((tm) =>
          tm
            ? {
                ...tm,
                pending_join_requests_count: Math.max(0, (tm.pending_join_requests_count ?? 0) - 1),
              }
            : null
        );
        this.processingRequestId.set(null);
      },
      error: () => {
        this.joinRequestsError.set('Could not decline.');
        this.processingRequestId.set(null);
      },
    });
  }

  leave(): void {
    const t = this.team();
    if (!t || this.busy()) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.teamService.leaveTeam(t.id).subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigate(['/teams']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.actionError.set(err?.error?.message ?? 'Could not leave.');
        this.busy.set(false);
      },
    });
  }

  openDeleteModal(): void {
    this.actionError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    if (this.deleting()) return;
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const t = this.team();
    if (!t || t.members_count > 0 || this.deleting()) return;
    this.deleting.set(true);
    this.actionError.set(null);
    this.teamService.deleteTeam(t.id).subscribe({
      next: () => {
        void this.router.navigate(['/teams']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.actionError.set(err?.error?.message ?? 'Could not delete team.');
        this.deleting.set(false);
        this.showDeleteModal.set(false);
      },
    });
  }
}
