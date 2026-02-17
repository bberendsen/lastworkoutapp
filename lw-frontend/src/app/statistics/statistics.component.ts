import { Component, inject, OnInit, OnDestroy, signal, WritableSignal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Workout, WorkoutService } from '../services/workoutService';
import { StreakService } from '../services/streakService';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

const PAGE_SIZE = 10;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit, OnDestroy, AfterViewChecked {
  private workoutService = inject(WorkoutService);
  private streakService = inject(StreakService);

  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('streakChart') streakChartRef!: ElementRef<HTMLCanvasElement>;

  userId = '';
  workouts: WritableSignal<Workout[]> = signal([]);
  loading = signal(true);
  currentStreak = signal(0);
  longestStreak = signal(0);
  weeklyGoal = signal(3);
  logWorkoutFailed = signal(false);
  currentPage = signal(1);
  private weeklyChart: Chart | null = null;
  private streakChart: Chart | null = null;
  private chartsInitialized = false;

  totalWorkouts = computed(() => this.workouts().length);
  hasNoWorkouts = computed(() => !this.loading() && this.totalWorkouts() === 0);
  hasLoggedToday = computed(() => {
    const list = this.workouts();
    if (!list || list.length === 0) return false;
    const latest = new Date(list[0].workout_datetime);
    const today = new Date();
    return latest.getFullYear() === today.getFullYear() &&
      latest.getMonth() === today.getMonth() &&
      latest.getDate() === today.getDate();
  });
  paginatedWorkouts = computed(() => {
    const all = this.workouts();
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return all.slice(start, start + PAGE_SIZE);
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.workouts().length / PAGE_SIZE)));
  canPrevPage = computed(() => this.currentPage() > 1);
  canNextPage = computed(() => this.currentPage() < this.totalPages());
  chartsReady = computed(() => !this.loading() && !this.hasNoWorkouts());

  /** Total workouts this week */
  workoutsThisWeek = computed(() => this.weeklyChartData().reduce((a, b) => a + b, 0));
  /** Progress 0–1 (capped at 1 for display) */
  weeklyProgressPercent = computed(() => {
    const goal = this.weeklyGoal();
    if (goal <= 0) return 0;
    return Math.min(1, this.workoutsThisWeek() / goal);
  });

  /** Workouts per weekday (Mon–Sun) for current week */
  weeklyChartData = computed(() => {
    const list = this.workouts();
    const today = new Date();
    const mon = getMonday(today);
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const w of list) {
      const d = new Date(w.workout_datetime);
      const weekStart = getMonday(d);
      if (weekStart.getTime() !== mon.getTime()) continue;
      const dayIdx = (d.getDay() + 6) % 7; // Mon=0, Sun=6
      counts[dayIdx]++;
    }
    return counts;
  });

  /** Last 8 weeks: { label, count, goalMet } */
  streakChartData = computed(() => {
    const list = this.workouts();
    const goal = this.weeklyGoal();
    const today = new Date();
    const weeks: { label: string; count: number; goalMet: boolean }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - 7 * i);
      const mon = getMonday(d);
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      let count = 0;
      for (const w of list) {
        const t = new Date(w.workout_datetime).getTime();
        if (t >= mon.getTime() && t <= sun.getTime()) count++;
      }
      const label = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeks.push({ label, count, goalMet: count >= goal });
    }
    return weeks;
  });

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
        if (res.weekly_progress) {
          this.weeklyGoal.set(res.weekly_progress.goal);
        }
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

  ngAfterViewChecked(): void {
    if (this.chartsReady() && !this.chartsInitialized && this.weeklyChartRef?.nativeElement && this.streakChartRef?.nativeElement) {
      this.chartsInitialized = true;
      setTimeout(() => this.initCharts(), 0);
    }
  }

  ngOnDestroy(): void {
    this.weeklyChart?.destroy();
    this.streakChart?.destroy();
  }

  private initCharts(): void {
    if (!this.weeklyChartRef?.nativeElement || !this.streakChartRef?.nativeElement) return;

    const goal = this.weeklyGoal();
    const wp = this.weeklyChartData();
    const sp = this.streakChartData();

    const weeklyConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: WEEKDAYS,
        datasets: [{
          label: 'Workouts',
          data: wp,
          backgroundColor: wp.map((v) => v >= 1 ? 'rgb(34 197 94)' : 'rgb(229 231 235)'),
          borderColor: wp.map((v) => v >= 1 ? 'rgb(22 163 74)' : 'rgb(209 213 219)'),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#6b7280' }
          },
          y: {
            beginAtZero: true,
            max: Math.max(2, goal, ...wp),
            grid: { color: '#f3f4f6' },
            ticks: { stepSize: 1, font: { size: 10 }, color: '#6b7280' }
          }
        }
      }
    };

    const streakConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: sp.map(w => w.label),
        datasets: [{
          label: 'Workouts',
          data: sp.map(w => w.count),
          backgroundColor: sp.map(w => w.goalMet ? 'rgb(34 197 94)' : 'rgb(229 231 235)'),
          borderColor: sp.map(w => w.goalMet ? 'rgb(22 163 74)' : 'rgb(209 213 219)'),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: '#6b7280', maxRotation: 0 }
          },
          y: {
            beginAtZero: true,
            max: Math.max(goal + 1, ...sp.map(w => w.count)),
            grid: { color: '#f3f4f6' },
            ticks: { stepSize: 1, font: { size: 10 }, color: '#6b7280' }
          }
        }
      }
    };

    this.weeklyChart = new Chart(this.weeklyChartRef.nativeElement, weeklyConfig);
    this.streakChart = new Chart(this.streakChartRef.nativeElement, streakConfig);
  }
}
