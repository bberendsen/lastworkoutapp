import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TeamService } from '../services/team.service';
import { TEAM_GRADIENT_PRESETS, teamPresetLinearGradient, type TeamGradientPreset } from './team.models';

@Component({
  selector: 'app-team-create',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './team-create.component.html',
})
export class TeamCreateComponent implements OnInit, OnDestroy {
  private teamService = inject(TeamService);
  private router = inject(Router);

  presets = TEAM_GRADIENT_PRESETS;
  readonly presetGradient = teamPresetLinearGradient;
  gateLoading = signal(true);
  /** Already a member of a team — cannot create another until they leave. */
  blocked = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  logoFile = signal<File | null>(null);
  logoPreview = signal<string | null>(null);

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(120)]),
    gradient_preset: new FormControl<TeamGradientPreset>('sky_indigo', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.teamService
      .listTeams()
      .pipe(finalize(() => this.gateLoading.set(false)))
      .subscribe({
        next: (list) => {
          this.blocked.set(list.some((t) => t.is_member));
        },
      });
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.revokePreview();
    this.logoFile.set(file);
    if (file) {
      this.logoPreview.set(URL.createObjectURL(file));
    }
  }

  clearLogo(): void {
    this.revokePreview();
    this.logoFile.set(null);
  }

  private revokePreview(): void {
    const url = this.logoPreview();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.logoPreview.set(null);
  }

  selectPreset(id: TeamGradientPreset): void {
    this.form.patchValue({ gradient_preset: id });
  }

  submit(): void {
    if (this.blocked() || this.form.invalid) return;
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);
    this.teamService
      .createTeam({
        name: (v.name ?? '').trim(),
        gradient_preset: v.gradient_preset,
        logo: this.logoFile(),
      })
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/teams', created.id]);
        },
        error: (err: { error?: { message?: string; errors?: { team?: string[] } } }) => {
          const fromValidation = err?.error?.errors?.team?.[0];
          this.error.set(fromValidation ?? err?.error?.message ?? 'Could not create team.');
          this.submitting.set(false);
        },
      });
  }
}
