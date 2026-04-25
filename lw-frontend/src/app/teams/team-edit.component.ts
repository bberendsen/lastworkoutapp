import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeamService } from '../services/team.service';
import { TEAM_GRADIENT_PRESETS, teamPresetLinearGradient, type TeamGradientPreset } from './team.models';

@Component({
  selector: 'app-team-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './team-edit.component.html',
})
export class TeamEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private teamService = inject(TeamService);

  teamId = '';
  presets = TEAM_GRADIENT_PRESETS;
  readonly presetGradient = teamPresetLinearGradient;
  loading = signal(true);
  loadError = signal<string | null>(null);
  saveError = signal<string | null>(null);
  submitting = signal(false);
  forbidden = signal(false);

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(120)]),
    gradient_preset: new FormControl<TeamGradientPreset>('sky_indigo', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/teams']);
      return;
    }
    this.teamId = id;
    this.teamService.getTeam(id).subscribe({
      next: (t) => {
        if (!t.is_creator) {
          this.forbidden.set(true);
          this.loading.set(false);
          return;
        }
        this.form.patchValue({
          name: t.name,
          gradient_preset: t.gradient_preset as TeamGradientPreset,
        });
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        if (err?.status === 403) {
          this.forbidden.set(true);
        } else {
          this.loadError.set('Could not load team.');
        }
        this.loading.set(false);
      },
    });
  }

  selectPreset(id: TeamGradientPreset): void {
    this.form.patchValue({ gradient_preset: id });
  }

  submit(): void {
    if (this.form.invalid || this.forbidden()) return;
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.saveError.set(null);
    this.teamService
      .updateTeam(this.teamId, {
        name: (v.name ?? '').trim(),
        gradient_preset: v.gradient_preset,
      })
      .subscribe({
        next: () => {
          void this.router.navigate(['/teams', this.teamId]);
        },
        error: (err: { error?: { message?: string }; status?: number }) => {
          if (err?.status === 403) {
            this.forbidden.set(true);
          } else {
            this.saveError.set(err?.error?.message ?? 'Could not save.');
          }
          this.submitting.set(false);
        },
      });
  }
}
