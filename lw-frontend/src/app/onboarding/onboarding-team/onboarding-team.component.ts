import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TeamService } from '../../services/team.service';
import type { TeamSummary } from '../../teams/team.models';
import { teamStrokeClass, teamPresetStripClass } from '../../teams/team.models';

@Component({
  selector: 'app-onboarding-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-team.component.html',
})
export class OnboardingTeamComponent implements OnInit {
  private router = inject(Router);
  private teamService = inject(TeamService);

  teams = signal<TeamSummary[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedId = signal<string | null>(null);
  busy = signal(false);
  actionError = signal<string | null>(null);

  strokeClass = teamStrokeClass;
  stripClass = teamPresetStripClass;

  ngOnInit(): void {
    if (!localStorage.getItem('userId')) {
      void this.router.navigate(['/login']);
      return;
    }
    this.teamService
      .listTeams()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => {
          this.teams.set(list);
          const member = list.find((t) => t.is_member);
          if (member) {
            this.selectedId.set(member.id);
          }
        },
        error: (err: HttpErrorResponse) => {
          const body = err.error as { message?: string } | string | null;
          const msg =
            typeof body === 'object' && body && 'message' in body && typeof body.message === 'string'
              ? body.message
              : typeof body === 'string'
                ? body
                : null;
          this.error.set(msg ?? `Could not load teams (${err.status}).`);
        },
      });
  }

  selectTeam(id: string): void {
    this.selectedId.set(id);
    this.actionError.set(null);
  }

  continueWithSelection(): void {
    const id = this.selectedId();
    if (!id) {
      void this.router.navigate(['/onboarding/health']);
      return;
    }
    const team = this.teams().find((t) => t.id === id);
    if (team?.is_member) {
      void this.router.navigate(['/onboarding/health']);
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);
    this.teamService.joinTeam(id).subscribe({
      next: () => {
        void this.router.navigate(['/onboarding/health']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.actionError.set(err?.error?.message ?? 'Could not join team.');
        this.busy.set(false);
      },
    });
  }

  skip(): void {
    void this.router.navigate(['/onboarding/health']);
  }
}
