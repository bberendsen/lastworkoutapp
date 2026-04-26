import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveFeedItem, WorkoutService } from '../services/workoutService';
import { LiveFeedRealtimeService } from '../services/live-feed-realtime.service';

@Component({
  selector: 'app-live-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './live-feed.component.html',
  styleUrl: './live-feed.component.css',
})
export class LiveFeedComponent implements OnInit, OnDestroy {
  readonly pageSize = 50;
  items = signal<LiveFeedItem[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  error = signal<string | null>(null);
  animatedIds = signal<Set<string>>(new Set());
  hasMore = signal(false);
  page = signal(1);
  pendingItems = signal<LiveFeedItem[]>([]);

  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private unsubscribeRealtime: (() => void) | null = null;

  constructor(
    private workoutService: WorkoutService,
    private liveFeedRealtimeService: LiveFeedRealtimeService
  ) {}

  ngOnInit(): void {
    this.loadInitial();
    this.startRealtime();
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }
  }

  private loadInitial(): void {
    this.loading.set(true);
    this.error.set(null);
    this.workoutService.getLiveFeed(1, this.pageSize).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.page.set(1);
        this.hasMore.set(res.meta.has_more);
        this.pendingItems.set([]);
        const initialAnimated = new Set(res.items.slice(0, 3).map((i) => i.id));
        this.animatedIds.set(initialAnimated);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load live feed.');
        this.loading.set(false);
      },
    });
  }

  private startPolling(): void {
    this.pollHandle = setInterval(() => {
      this.workoutService.getLiveFeed(1, this.pageSize).subscribe({
        next: (res) => {
          const currentIds = new Set(this.items().map((i) => i.id));
          const queuedIds = new Set(this.pendingItems().map((i) => i.id));
          const newItems = res.items.filter((i) => !currentIds.has(i.id) && !queuedIds.has(i.id));
          if (newItems.length > 0) {
            this.pendingItems.set([...newItems, ...this.pendingItems()]);
          }
          this.hasMore.set(res.meta.has_more);
        },
      });
    }, 30000);
  }

  private startRealtime(): void {
    this.unsubscribeRealtime = this.liveFeedRealtimeService.subscribe((item) => {
      const currentIds = new Set(this.items().map((i) => i.id));
      const queuedIds = new Set(this.pendingItems().map((i) => i.id));
      if (currentIds.has(item.id) || queuedIds.has(item.id)) {
        return;
      }
      this.pendingItems.set([item, ...this.pendingItems()]);
    });
  }

  loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    const nextPage = this.page() + 1;
    this.loadingMore.set(true);
    this.workoutService.getLiveFeed(nextPage, this.pageSize).subscribe({
      next: (res) => {
        const ids = new Set(this.items().map((i) => i.id));
        const merged = [...this.items()];
        for (const item of res.items) {
          if (!ids.has(item.id)) {
            merged.push(item);
          }
        }
        this.items.set(merged);
        this.page.set(nextPage);
        this.hasMore.set(res.meta.has_more);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  showNewUpdates(): void {
    const pending = this.pendingItems();
    if (!pending.length) return;
    const ids = new Set(this.items().map((i) => i.id));
    const prepend = pending.filter((i) => !ids.has(i.id));
    this.items.set([...prepend, ...this.items()]);
    const nextAnimated = new Set(this.animatedIds());
    for (const item of prepend.slice(0, 3)) {
      nextAnimated.add(item.id);
    }
    this.animatedIds.set(nextAnimated);
    this.pendingItems.set([]);
    this.page.set(1);
    this.workoutService.getLiveFeed(1, this.pageSize).subscribe({
      next: (res) => this.hasMore.set(res.meta.has_more),
    });
  }

  actionLabel(): string {
    const pendingCount = this.pendingItems().length;
    if (pendingCount > 0) {
      return `Show ${pendingCount} new update${pendingCount === 1 ? '' : 's'}`;
    }
    return this.loadingMore() ? 'Loading...' : `Load ${this.pageSize} more`;
  }

  onActionClick(): void {
    if (this.pendingItems().length > 0) {
      this.showNewUpdates();
      return;
    }
    if (this.hasMore()) {
      this.loadMore();
    }
  }

  showFloatingAction(): boolean {
    return this.pendingItems().length > 0 || this.hasMore();
  }
}
