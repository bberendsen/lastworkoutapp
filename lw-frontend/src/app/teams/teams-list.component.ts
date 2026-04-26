import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TeamStateService } from '../services/team-state.service';
import { teamPresetLinearGradient } from './team.models';

@Component({
  selector: 'app-teams-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './teams-list.component.html',
})
export class TeamsListComponent implements OnInit {
  private readonly teamState = inject(TeamStateService);
  private readonly router = inject(Router);

  public readonly teams = this.teamState.teams;
  public readonly loading = this.teamState.loadingTeams;
  public readonly error = this.teamState.teamsError;
  public readonly hasTeamMembership = this.teamState.hasTeamMembership;

  readonly presetGradient = teamPresetLinearGradient;

  ngOnInit(): void {
    this.load();
  }

  public load(): void {
    this.teamState.loadTeams();
  }

  public goDetail(id: string): void {
    void this.router.navigate(['/teams', id]);
  }
}
