import { Injectable, computed, inject, signal } from '@angular/core';
import { AppNotification, NotificationService } from './notification.service';
import { LeaderboardWithStreak, StreakService } from './streakService';
import { LiveFeedItem, Workout, WorkoutService } from './workoutService';
import { TeamService } from './team.service';
import type { TeamLeaderboardRow, TeamSummary } from '../teams/team.models';
import { EMPTY, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HomescreenStateService {
  private workoutService = inject(WorkoutService);
  private streakService = inject(StreakService);
  private teamService = inject(TeamService);
  private notificationService = inject(NotificationService);

  userId = signal<string>('');
  loading = signal(true);
  error = signal<string | null>(null);
  teamsLoading = signal(false);
  teamsError = signal<string | null>(null);
  notificationsLoading = signal(false);

  workouts = signal<Workout[]>([]);
  leaderboard = signal<LeaderboardWithStreak[]>([]);
  currentStreak = signal(0);
  longestStreak = signal(0);
  weeklyProgress = signal<{ workouts_this_week: number; goal: number } | null>(null);
  myTeam = signal<TeamSummary | null>(null);
  teamsLeaderboard = signal<TeamLeaderboardRow[]>([]);
  liveFeedPreview = signal<LiveFeedItem[]>([]);
  notificationsApi = signal<AppNotification[]>([]);
  notificationUnreadCount = signal(0);

  totalWorkouts = computed(() => this.workouts().length);
  userLeaderboardRow = computed(() => this.leaderboard().find((row) => row.id === this.userId()) ?? null);
  myTeamRank = computed(() => {
    const team = this.myTeam();
    if (!team) return null;
    const idx = this.teamsLeaderboard().findIndex((row) => row.id === team.id);
    return idx >= 0 ? idx + 1 : null;
  });

  private hydratedForUserId = signal<string | null>(null);

  ensureInitialized(userId: string): void {
    if (!userId) {
      this.error.set('No user ID found. Please create an account first.');
      this.loading.set(false);
      return;
    }
    this.userId.set(userId);
    if (this.hydratedForUserId() === userId) {
      return;
    }
    this.refreshAll();
    this.hydratedForUserId.set(userId);
  }

  refreshAll(): void {
    this.loadWorkouts();
    this.loadLeaderboard();
    this.loadCurrentStreak();
    this.loadMyTeam();
    this.loadTeamsLeaderboard();
    this.loadLiveFeedPreview();
    this.loadNotificationFeed();
  }

  refreshAfterWorkout(): void {
    this.loadWorkouts();
    this.loadLeaderboard();
    this.loadCurrentStreak();
    this.loadTeamsLeaderboard();
    this.loadLiveFeedPreview();
    this.loadNotificationFeed();
  }

  dismissNotification(notificationId: string): Observable<void> {
    return this.notificationService.dismissNotification(notificationId).pipe(
      tap(() => {
        const dismissedUnread = this.notificationsApi().find((item) => item.id === notificationId)?.is_unread;
        this.notificationsApi.update((items) => items.filter((item) => item.id !== notificationId));
        if (dismissedUnread) {
          this.notificationUnreadCount.update((count) => Math.max(0, count - 1));
        }
      })
    );
  }

  markNotificationRead(notificationId: string): Observable<void> {
    const notification = this.notificationsApi().find((item) => item.id === notificationId);
    if (!notification || !notification.is_unread) {
      return EMPTY;
    }
    return this.notificationService.markNotificationRead(notificationId).pipe(
      tap(() => {
        this.notificationsApi.update((items) =>
          items.map((item) => (item.id === notificationId ? { ...item, is_unread: false } : item))
        );
        this.notificationUnreadCount.update((count) => Math.max(0, count - 1));
      })
    );
  }

  private loadWorkouts(): void {
    const userId = this.userId();
    if (!userId) return;
    this.loading.set(true);
    this.error.set(null);
    this.workoutService.getWorkoutByUser(userId).subscribe({
      next: (workouts) => {
        this.workouts.set(workouts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load workouts');
        this.loading.set(false);
      },
    });
  }

  private loadLeaderboard(): void {
    this.streakService.getLeaderboardWithStreaks().subscribe({
      next: (leaderboard) => this.leaderboard.set(leaderboard),
      error: () => this.error.set('Failed to load leaderboard'),
    });
  }

  private loadCurrentStreak(): void {
    const userId = this.userId();
    if (!userId) return;
    this.streakService.getCurrentStreak(userId).subscribe({
      next: (res) => {
        this.currentStreak.set(res.current_streak);
        this.longestStreak.set(res.longest_streak ?? 0);
        this.weeklyProgress.set(
          res.weekly_progress
            ? {
                workouts_this_week: res.weekly_progress.workouts_this_week,
                goal: res.weekly_progress.goal,
              }
            : null
        );
      },
      error: () => {
        this.currentStreak.set(0);
        this.longestStreak.set(0);
        this.weeklyProgress.set(null);
      },
    });
  }

  private loadTeamsLeaderboard(): void {
    this.teamsLoading.set(true);
    this.teamsError.set(null);
    this.teamService.getTeamsLeaderboard().subscribe({
      next: (rows) => {
        this.teamsLeaderboard.set(rows);
        this.teamsLoading.set(false);
      },
      error: () => {
        this.teamsError.set('Could not load teams.');
        this.teamsLoading.set(false);
      },
    });
  }

  private loadMyTeam(): void {
    this.teamService.listTeams().subscribe({
      next: (list) => {
        const team = list.find((t) => t.is_member) ?? null;
        this.myTeam.set(team);
        if (team) {
          this.teamService.getTeam(team.id).subscribe({
            next: (teamDetail) => {
              this.myTeam.update((current) => {
                if (!current) return current;
                return {
                  ...current,
                  pending_join_requests_count: teamDetail.pending_join_requests_count,
                  has_pending_request: teamDetail.has_pending_request,
                };
              });
            },
          });
        }
      },
      error: () => this.myTeam.set(null),
    });
  }

  private loadLiveFeedPreview(): void {
    this.workoutService.getLiveFeed(1, 3).subscribe({
      next: (res) => this.liveFeedPreview.set(res.items.slice(0, 3)),
      error: () => this.liveFeedPreview.set([]),
    });
  }

  private loadNotificationFeed(): void {
    this.notificationsLoading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        const sorted = [...res.items].sort((a, b) => {
          const aTime = a.event_datetime ? new Date(a.event_datetime).getTime() : 0;
          const bTime = b.event_datetime ? new Date(b.event_datetime).getTime() : 0;
          return bTime - aTime;
        });
        this.notificationsApi.set(sorted);
        this.notificationUnreadCount.set(res.unreadCount);
        this.notificationsLoading.set(false);
      },
      error: () => {
        this.notificationsApi.set([]);
        this.notificationUnreadCount.set(0);
        this.notificationsLoading.set(false);
      },
    });
  }
}
