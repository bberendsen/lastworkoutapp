import { Component, inject, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Workout, WorkoutService } from '../services/workoutService';
import { StreakService } from '../services/streakService';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit {
  private workoutService = inject(WorkoutService);
  private streakService = inject(StreakService);

  userId = '';
  workouts: WritableSignal<Workout[]> = signal([]);
  loading = signal(true);
  currentStreak = signal(0);
  longestStreak = signal(0);
  logWorkoutFailed = signal(false);
  currentPage = signal(1);

  totalWorkouts = computed(() => this.workouts().length);
  hasNoWorkouts = computed(() => !this.loading() && this.totalWorkouts() === 0);
  paginatedWorkouts = computed(() => {
    const all = this.workouts();
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return all.slice(start, start + PAGE_SIZE);
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.workouts().length / PAGE_SIZE)));
  canPrevPage = computed(() => this.currentPage() > 1);
  canNextPage = computed(() => this.currentPage() < this.totalPages());

  ngOnInit(): void {
    const stored = localStorage.getItem('userId');
    if (stored) this.userId = stored;
    if (this.userId) {
      this.loadWorkouts();
      this.loadStreak();
    } else {
      this.loading.set(false);
    }
  }

  loadWorkouts(): void {
    if (!this.userId) return;
    this.loading.set(true);
    this.workoutService.getWorkoutByUser(this.userId).subscribe({
      next: (list) => {
        this.workouts.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadStreak(): void {
    if (!this.userId) return;
    this.streakService.getCurrentStreak(this.userId).subscribe({
      next: (res) => {
        this.currentStreak.set(res.current_streak);
        this.longestStreak.set(res.longest_streak ?? 0);
      }
    });
  }

  logWorkout(): void {
    if (!this.userId) return;
    this.logWorkoutFailed.set(false);
    this.workoutService.logWorkout(this.userId).subscribe({
      next: () => {
        this.loadWorkouts();
        this.loadStreak();
      },
      error: () => this.logWorkoutFailed.set(true)
    });
  }

  prevPage(): void {
    if (this.canPrevPage()) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.canNextPage()) this.currentPage.update(p => p + 1);
  }
}
