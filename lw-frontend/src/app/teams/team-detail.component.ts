import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TeamService } from '../services/team.service';
import type { TeamDetail, TeamJoinRequestItem } from './team.models';
import { teamPresetLinearGradient } from './team.models';

type TeamTab = 'details' | 'requests';

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

  activeTab = signal<TeamTab>('details');
  joinRequests = signal<TeamJoinRequestItem[]>([]);
  joinRequestsLoading = signal(false);
  joinRequestsError = signal<string | null>(null);
  processingRequestId = signal<number | null>(null);

  readonly presetGradient = teamPresetLinearGradient;

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
    this.teamService.getTeam(id).subscribe({
      next: (t) => {
        this.team.set(t);
        this.loading.set(false);
        if (t.is_creator && this.activeTab() === 'requests') {
          this.loadJoinRequests();
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
        this.joinRequests.update((list) => list.filter((r) => r.id !== req.id));
        this.processingRequestId.set(null);
      },
      error: () => {
        this.joinRequestsError.set('Could not approve.');
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
