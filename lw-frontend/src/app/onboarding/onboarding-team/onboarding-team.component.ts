import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { teamPresetLinearGradient } from '../../teams/team.models';
import { OnboardingTeamStateService } from '../../services/onboarding-team-state.service';

@Component({
  selector: 'app-onboarding-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-team.component.html',
})
export class OnboardingTeamComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly state = inject(OnboardingTeamStateService);

  public readonly teams = this.state.teams;
  public readonly loading = this.state.loading;
  public readonly error = this.state.error;
  public readonly selectedId = this.state.selectedId;
  public readonly busy = this.state.busy;
  public readonly actionError = this.state.actionError;
  public readonly memberTeam = this.state.memberTeam;

  readonly presetGradient = teamPresetLinearGradient;

  ngOnInit(): void {
    this.state.initialize();
  }

  public selectTeam(id: string): void {
    this.state.selectTeam(id);
  }

  public continueWithSelection(): void {
    this.state.continueWithSelection(() => void this.router.navigate(['/homescreen']));
  }

  public skip(): void {
    void this.router.navigate(['/homescreen']);
  }

  public goToCreateTeam(): void {
    if (this.memberTeam()) return;
    void this.router.navigate(['/teams/create']);
  }
}
