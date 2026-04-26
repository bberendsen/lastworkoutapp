import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { type UserProfilePayload } from '../services/userService';
import { UserProfileStateService } from '../services/user-profile-state.service';

type ProfileFields = UserProfilePayload['profile'];
import { teamPresetLinearGradient } from '../teams/team.models';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-profile.component.html',
})
export class UserProfileComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly userProfileState = inject(UserProfileStateService);

  public readonly presetGradient = teamPresetLinearGradient;
  public readonly data = this.userProfileState.data;
  public readonly loading = this.userProfileState.loading;
  public readonly error = this.userProfileState.error;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('userId');
    if (!id) {
      void this.router.navigate(['/homescreen']);
      return;
    }
    this.userProfileState.loadProfile(id);
  }

  public back(): void {
    this.location.back();
  }

  public avatarInitials(p: ProfileFields): string {
    const fn = p.first_name?.trim();
    const ln = p.last_name?.trim();
    const a = (fn?.charAt(0) || p.username.charAt(0) || '?').toUpperCase();
    const b = (ln?.charAt(0) || '').toUpperCase();
    return a + b;
  }
}
