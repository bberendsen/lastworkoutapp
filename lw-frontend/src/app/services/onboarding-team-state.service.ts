import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TeamService } from './team.service';
import type { TeamSummary } from '../teams/team.models';

@Injectable({
  providedIn: 'root',
})
export class OnboardingTeamStateService {
  private readonly router = inject(Router);
  private readonly teamApi = inject(TeamService);

  private readonly _teams = signal<TeamSummary[]>([]);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _busy = signal(false);
  private readonly _actionError = signal<string | null>(null);

  public readonly teams = this._teams.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly selectedId = this._selectedId.asReadonly();
  public readonly busy = this._busy.asReadonly();
  public readonly actionError = this._actionError.asReadonly();
  public readonly memberTeam = computed(() => this._teams().find((team) => team.is_member));

  public initialize(): void {
    if (!localStorage.getItem('userId')) {
      void this.router.navigate(['/login']);
      return;
    }
    this.teamApi
      .listTeams()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (list) => {
          this._teams.set(list);
          const member = list.find((team) => team.is_member);
          const pending = list.find((team) => team.has_pending_request);
          if (member) this._selectedId.set(member.id);
          else if (pending) this._selectedId.set(pending.id);
        },
        error: (err: HttpErrorResponse) => {
          const body = err.error as { message?: string } | string | null;
          const message =
            typeof body === 'object' && body && 'message' in body && typeof body.message === 'string'
              ? body.message
              : typeof body === 'string'
                ? body
                : null;
          this._error.set(message ?? `Could not load teams (${err.status}).`);
        },
      });
  }

  public selectTeam(id: string): void {
    this._selectedId.set(id);
    this._actionError.set(null);
  }

  public continueWithSelection(onDone: () => void): void {
    const id = this._selectedId();
    if (!id) {
      onDone();
      return;
    }
    const team = this._teams().find((row) => row.id === id);
    if (team?.is_member || team?.has_pending_request) {
      onDone();
      return;
    }
    this._busy.set(true);
    this._actionError.set(null);
    this.teamApi.requestToJoin(id).subscribe({
      next: () => onDone(),
      error: (err: { error?: { message?: string } }) => {
        this._actionError.set(err?.error?.message ?? 'Could not join team.');
        this._busy.set(false);
      },
    });
  }
}
