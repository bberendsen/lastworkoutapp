import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/userService';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  loading = signal(true);
  saving = signal(false);
  success = signal(false);
  error = signal<string | null>(null);
  userId = '';

  form = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
  });

  ngOnInit(): void {
    const stored = localStorage.getItem('userId');
    if (!stored) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = stored;
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.form.patchValue({
          first_name: user.first_name ?? '',
          last_name: user.last_name ?? '',
          username: user.username ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load account.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.userService.updateUser(this.userId, this.form.value as { first_name: string; last_name: string; username: string }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Could not update account.');
      }
    });
  }
}
