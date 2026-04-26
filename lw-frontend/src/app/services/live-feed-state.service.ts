import { Injectable, inject, signal, computed } from '@angular/core';
import { LiveFeedItem, WorkoutService } from './workoutService';
import { LiveFeedRealtimeService } from './live-feed-realtime.service';

@Injectable({
  providedIn: 'root',
})
export class LiveFeedStateService {
  private readonly workoutService = inject(WorkoutService);
  private readonly liveFeedRealtimeService = inject(LiveFeedRealtimeService);

  private readonly _items = signal<LiveFeedItem[]>([]);
  private readonly _loading = signal(true);
  private readonly _loadingMore = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _animatedIds = signal<Set<string>>(new Set());
  private readonly _hasMore = signal(false);
  private readonly _page = signal(1);
  private readonly _pendingItems = signal<LiveFeedItem[]>([]);
  private readonly _pageSize = signal(50);
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private unsubscribeRealtime: (() => void) | null = null;

  public readonly items = this._items.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly loadingMore = this._loadingMore.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly animatedIds = this._animatedIds.asReadonly();
  public readonly hasMore = this._hasMore.asReadonly();
  public readonly page = this._page.asReadonly();
  public readonly pendingItems = this._pendingItems.asReadonly();
  public readonly pageSize = this._pageSize.asReadonly();
  public readonly actionLabel = computed(() => {
    const pendingCount = this._pendingItems().length;
    if (pendingCount > 0) {
      return `Show ${pendingCount} new update${pendingCount === 1 ? '' : 's'}`;
    }
    return this._loadingMore() ? 'Loading...' : `Load ${this._pageSize()} more`;
  });
  public readonly showFloatingAction = computed(() => this._pendingItems().length > 0 || this._hasMore());

  public initialize(pageSize: number = 50): void {
    this._pageSize.set(pageSize);
    this.loadInitial();
    this.startRealtime();
    this.startPolling();
  }

  public destroy(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }
  }

  public loadMore(): void {
    if (this._loadingMore() || !this._hasMore()) return;
    const nextPage = this._page() + 1;
    this._loadingMore.set(true);
    this.workoutService.getLiveFeed(nextPage, this._pageSize()).subscribe({
      next: (res) => {
        const ids = new Set(this._items().map((i) => i.id));
        const merged = [...this._items()];
        for (const item of res.items) {
          if (!ids.has(item.id)) {
            merged.push(item);
          }
        }
        this._items.set(merged);
        this._page.set(nextPage);
        this._hasMore.set(res.meta.has_more);
        this._loadingMore.set(false);
      },
      error: () => {
        this._loadingMore.set(false);
      },
    });
  }

  public showNewUpdates(): void {
    const pending = this._pendingItems();
    if (!pending.length) return;
    const ids = new Set(this._items().map((i) => i.id));
    const prepend = pending.filter((i) => !ids.has(i.id));
    this._items.set([...prepend, ...this._items()]);
    const nextAnimated = new Set(this._animatedIds());
    for (const item of prepend.slice(0, 3)) {
      nextAnimated.add(item.id);
    }
    this._animatedIds.set(nextAnimated);
    this._pendingItems.set([]);
    this._page.set(1);
    this.workoutService.getLiveFeed(1, this._pageSize()).subscribe({
      next: (res) => this._hasMore.set(res.meta.has_more),
    });
  }

  public onActionClick(): void {
    if (this._pendingItems().length > 0) {
      this.showNewUpdates();
      return;
    }
    if (this._hasMore()) {
      this.loadMore();
    }
  }

  private loadInitial(): void {
    this._loading.set(true);
    this._error.set(null);
    this.workoutService.getLiveFeed(1, this._pageSize()).subscribe({
      next: (res) => {
        this._items.set(res.items);
        this._page.set(1);
        this._hasMore.set(res.meta.has_more);
        this._pendingItems.set([]);
        const initialAnimated = new Set(res.items.slice(0, 3).map((i) => i.id));
        this._animatedIds.set(initialAnimated);
        this._loading.set(false);
      },
      error: () => {
        this._error.set('Could not load live feed.');
        this._loading.set(false);
      },
    });
  }

  private startPolling(): void {
    this.pollHandle = setInterval(() => {
      this.workoutService.getLiveFeed(1, this._pageSize()).subscribe({
        next: (res) => {
          const currentIds = new Set(this._items().map((i) => i.id));
          const queuedIds = new Set(this._pendingItems().map((i) => i.id));
          const newItems = res.items.filter((i) => !currentIds.has(i.id) && !queuedIds.has(i.id));
          if (newItems.length > 0) {
            this._pendingItems.set([...newItems, ...this._pendingItems()]);
          }
          this._hasMore.set(res.meta.has_more);
        },
      });
    }, 30000);
  }

  private startRealtime(): void {
    this.unsubscribeRealtime = this.liveFeedRealtimeService.subscribe((item) => {
      const currentIds = new Set(this._items().map((i) => i.id));
      const queuedIds = new Set(this._pendingItems().map((i) => i.id));
      if (currentIds.has(item.id) || queuedIds.has(item.id)) {
        return;
      }
      this._pendingItems.set([item, ...this._pendingItems()]);
    });
  }
}
