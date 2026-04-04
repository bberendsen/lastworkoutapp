import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { TeamService } from '../services/team.service';
import type { TeamSummary } from './team.models';
import { teamPresetLinearGradient } from './team.models';

@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teams-list.component.html',
})
export class TeamsListComponent implements OnInit {
  private teamService = inject(TeamService);
  private router = inject(Router);

  teams = signal<TeamSummary[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  /** One team per user — hide create until they leave. */
  hasTeamMembership = computed(() => this.teams().some((t) => t.is_member));

  readonly presetGradient = teamPresetLinearGradient;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.teamService
      .listTeams()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (list) => {
          this.teams.set(list);
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

  goDetail(id: string): void {
    void this.router.navigate(['/teams', id]);
  }
}
