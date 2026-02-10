import { Component, inject, signal, WritableSignal } from '@angular/core';
import { LeaderboardWithStreak, StreakService } from '../services/streakService';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent {
  leaderboard: WritableSignal<LeaderboardWithStreak[]> = signal([]);
  private router = inject(Router);
  constructor(private streakService: StreakService) {}

  ngOnInit(): void {
    this.streakService.getLeaderboardWithStreaks().subscribe({
      next: (leaderboard) => {
        this.leaderboard.set(leaderboard);
        console.log('Leaderboard loaded:', leaderboard);
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      }
    });
  }

  backToHomescreen(): void {
    this.router.navigate(['/homescreen']);
  }
}