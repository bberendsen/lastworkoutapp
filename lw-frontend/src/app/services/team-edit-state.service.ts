import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TeamService } from './team.service';
import type { TeamGradientPreset } from '../teams/team.models';

@Injectable({
  providedIn: 'root',
})
export class TeamEditStateService {
  private readonly teamApi = inject(TeamService);
  private readonly router = inject(Router);

  private readonly _teamId = signal('');
  private readonly _loading = signal(true);
  private readonly _loadError = signal<string | null>(null);
  private readonly _saveError = signal<string | null>(null);
  private readonly _submitting = signal(false);
  private readonly _forbidden = signal(false);

  public readonly teamId = this._teamId.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly loadError = this._loadError.asReadonly();
  public readonly saveError = this._saveError.asReadonly();
  public readonly submitting = this._submitting.asReadonly();
  public readonly forbidden = this._forbidden.asReadonly();

  public initialize(teamId: string, onLoaded: (data: { name: string; gradient_preset: TeamGradientPreset }) => void): void {
    this._teamId.set(teamId);
    this.teamApi.getTeam(teamId).subscribe({
      next: (team) => {
        if (!team.is_creator) {
          this._forbidden.set(true);
          this._loading.set(false);
          return;
        }
        onLoaded({
          name: team.name,
          gradient_preset: team.gradient_preset as TeamGradientPreset,
        });
        this._loading.set(false);
      },
      error: (err: { status?: number }) => {
        if (err?.status === 403) {
          this._forbidden.set(true);
        } else {
          this._loadError.set('Could not load team.');
        }
        this._loading.set(false);
      },
    });
  }

  public save(payload: { name: string; gradient_preset: TeamGradientPreset }): void {
    const teamId = this._teamId();
    if (!teamId || this._forbidden()) return;
    this._submitting.set(true);
    this._saveError.set(null);
    this.teamApi.updateTeam(teamId, payload).subscribe({
      next: () => void this.router.navigate(['/teams', teamId]),
      error: (err: { error?: { message?: string }; status?: number }) => {
        if (err?.status === 403) {
          this._forbidden.set(true);
        } else {
          this._saveError.set(err?.error?.message ?? 'Could not save.');
        }
        this._submitting.set(false);
      },
    });
  }
}
