import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, type UserProfilePayload } from '../services/userService';

type ProfileFields = UserProfilePayload['profile'];
import { teamPresetLinearGradient } from '../teams/team.models';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-profile.component.html',
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private userService = inject(UserService);

  readonly presetGradient = teamPresetLinearGradient;
  data = signal<UserProfilePayload | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('userId');
    if (!id) {
      void this.router.navigate(['/homescreen']);
      return;
    }
    this.userService.getUserProfile(id).subscribe({
      next: (payload) => {
        this.data.set(payload);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this profile.');
        this.loading.set(false);
      },
    });
  }

  back(): void {
    this.location.back();
  }

  avatarInitials(p: ProfileFields): string {
    const fn = p.first_name?.trim();
    const ln = p.last_name?.trim();
    const a = (fn?.charAt(0) || p.username.charAt(0) || '?').toUpperCase();
    const b = (ln?.charAt(0) || '').toUpperCase();
    return a + b;
  }
}
