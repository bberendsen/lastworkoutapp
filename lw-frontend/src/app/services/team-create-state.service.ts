import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { TeamService } from './team.service';
import type { TeamGradientPreset } from '../teams/team.models';

@Injectable({
  providedIn: 'root',
})
export class TeamCreateStateService {
  private readonly teamApi = inject(TeamService);
  private readonly router = inject(Router);

  private readonly _gateLoading = signal(true);
  private readonly _blocked = signal(false);
  private readonly _submitting = signal(false);
  private readonly _error = signal<string | null>(null);

  public readonly gateLoading = this._gateLoading.asReadonly();
  public readonly blocked = this._blocked.asReadonly();
  public readonly submitting = this._submitting.asReadonly();
  public readonly error = this._error.asReadonly();

  public initialize(): void {
    this.teamApi
      .listTeams()
      .pipe(finalize(() => this._gateLoading.set(false)))
      .subscribe({
        next: (list) => this._blocked.set(list.some((team) => team.is_member)),
      });
  }

  public createTeam(payload: { name: string; gradient_preset: TeamGradientPreset }): void {
    if (this._blocked()) return;
    this._submitting.set(true);
    this._error.set(null);
    this.teamApi.createTeam(payload).subscribe({
      next: (created) => void this.router.navigate(['/teams', created.id]),
      error: (err: { error?: { message?: string; errors?: { team?: string[] } } }) => {
        const fromValidation = err?.error?.errors?.team?.[0];
        this._error.set(fromValidation ?? err?.error?.message ?? 'Could not create team.');
        this._submitting.set(false);
      },
    });
  }
}
