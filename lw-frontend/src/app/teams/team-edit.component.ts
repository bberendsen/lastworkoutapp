import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TEAM_GRADIENT_PRESETS, teamPresetLinearGradient, type TeamGradientPreset } from './team.models';
import { TeamEditStateService } from '../services/team-edit-state.service';

@Component({
  selector: 'app-team-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './team-edit.component.html',
})
export class TeamEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly state = inject(TeamEditStateService);

  public readonly teamId = this.state.teamId;
  public readonly presets = TEAM_GRADIENT_PRESETS;
  public readonly presetGradient = teamPresetLinearGradient;
  public readonly loading = this.state.loading;
  public readonly loadError = this.state.loadError;
  public readonly saveError = this.state.saveError;
  public readonly submitting = this.state.submitting;
  public readonly forbidden = this.state.forbidden;

  public readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(120)]),
    gradient_preset: new FormControl<TeamGradientPreset>('sky_indigo', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/teams']);
      return;
    }
    this.state.initialize(id, (payload) => this.form.patchValue(payload));
  }

  public selectPreset(id: TeamGradientPreset): void {
    this.form.patchValue({ gradient_preset: id });
  }

  public submit(): void {
    if (this.form.invalid || this.forbidden()) return;
    const v = this.form.getRawValue();
    this.state.save({
      name: (v.name ?? '').trim(),
      gradient_preset: v.gradient_preset,
    });
  }
}
