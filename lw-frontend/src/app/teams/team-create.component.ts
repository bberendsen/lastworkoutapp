import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TEAM_GRADIENT_PRESETS, teamPresetLinearGradient, type TeamGradientPreset } from './team.models';
import { TeamCreateStateService } from '../services/team-create-state.service';

@Component({
  selector: 'app-team-create',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './team-create.component.html',
})
export class TeamCreateComponent implements OnInit {
  private readonly state = inject(TeamCreateStateService);

  public readonly presets = TEAM_GRADIENT_PRESETS;
  public readonly presetGradient = teamPresetLinearGradient;
  public readonly gateLoading = this.state.gateLoading;
  public readonly blocked = this.state.blocked;
  public readonly submitting = this.state.submitting;
  public readonly error = this.state.error;

  public readonly form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(120)]),
    gradient_preset: new FormControl<TeamGradientPreset>('sky_indigo', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.state.initialize();
  }

  public selectPreset(id: TeamGradientPreset): void {
    this.form.patchValue({ gradient_preset: id });
  }

  public submit(): void {
    if (this.blocked() || this.form.invalid) return;
    const v = this.form.getRawValue();
    this.state.createTeam({
      name: (v.name ?? '').trim(),
      gradient_preset: v.gradient_preset,
    });
  }
}
