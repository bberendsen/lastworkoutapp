import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TeamService } from '../services/team.service';
import type { TeamDetail } from './team.models';
import { teamStrokeClass, teamPresetStripClass } from './team.models';

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

  strokeClass = teamStrokeClass;
  stripClass = teamPresetStripClass;

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
      },
      error: () => {
        this.error.set('Could not load team.');
        this.loading.set(false);
      },
    });
  }

  join(): void {
    const t = this.team();
    if (!t || this.busy()) return;
    this.busy.set(true);
    this.actionError.set(null);
    this.teamService.joinTeam(t.id).subscribe({
      next: (updated) => {
        this.team.set(updated);
        this.busy.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.actionError.set(err?.error?.message ?? 'Could not join.');
        this.busy.set(false);
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
