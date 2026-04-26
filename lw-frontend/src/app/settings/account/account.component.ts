import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountStateService } from '../../services/account-state.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit {
  private readonly accountState = inject(AccountStateService);

  public readonly form = new FormGroup({
    first_name: new FormControl('', Validators.required),
    last_name: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
  });
  public readonly loading = this.accountState.loading;
  public readonly saving = this.accountState.saving;
  public readonly success = this.accountState.success;
  public readonly error = this.accountState.error;
  public readonly showDeleteModal = this.accountState.showDeleteModal;
  public readonly deleting = this.accountState.deleting;
  public readonly deleteError = this.accountState.deleteError;

  ngOnInit(): void {
    this.accountState.initialize((payload) => this.form.patchValue(payload));
  }

  public onSubmit(): void {
    if (this.form.invalid) return;
    const first_name = this.form.controls.first_name.value ?? '';
    const last_name = this.form.controls.last_name.value ?? '';
    const username = this.form.controls.username.value ?? '';
    this.accountState.save({ first_name, last_name, username });
  }

  public openDeleteModal(): void {
    this.accountState.openDeleteModal();
  }

  public closeDeleteModal(): void {
    this.accountState.closeDeleteModal();
  }

  public confirmDeleteAccount(): void {
    this.accountState.confirmDeleteAccount();
  }
}
