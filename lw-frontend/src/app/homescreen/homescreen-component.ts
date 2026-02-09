import { Component, OnInit } from '@angular/core';
import { Workout, WorkoutService } from '../services/workoutService';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-homescreen',
  templateUrl: './homescreen-component.html',
  imports: [RouterModule, CommonModule],
  styleUrls: ['./homescreen-component.css']
})
export class HomescreenComponent implements OnInit {
  workouts: Workout[] = [];
  leaderboard: any[] = [];
  userId: string = 'c0538640-853a-49e8-8abf-8e5df7d6d4de';
  loading: boolean = true;
  error: string | null = null;

  constructor(private workoutService: WorkoutService) { }

  ngOnInit(): void {
    this.loadWorkouts();
    this.loadLeaderboard();
  }

  loadWorkouts(): void {
    this.loading = true;
    this.error = null;
    this.workoutService.getWorkoutByUser(this.userId).subscribe({
      next: (workouts) => {
        this.workouts = workouts;
        this.loading = false;
        console.log('Workouts loaded:', workouts);
      },
      error: (error) => {
        console.error('Error loading workouts:', error);
        this.error = 'Failed to load workouts';
        this.loading = false;
      }
    });
  }

  loadLeaderboard(): void {
    this.workoutService.getLeaderboard().subscribe({
      next: (leaderboard) => {
        this.leaderboard = leaderboard;
        console.log('Leaderboard loaded:', leaderboard);
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      }
    });
  }
}