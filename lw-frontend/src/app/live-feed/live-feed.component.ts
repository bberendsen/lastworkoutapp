import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveFeedStateService } from '../services/live-feed-state.service';

@Component({
  selector: 'app-live-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './live-feed.component.html',
  styleUrl: './live-feed.component.css',
})
export class LiveFeedComponent implements OnInit, OnDestroy {
  private readonly liveFeedState = inject(LiveFeedStateService);
  public readonly pageSize = 50;
  public readonly items = this.liveFeedState.items;
  public readonly loading = this.liveFeedState.loading;
  public readonly loadingMore = this.liveFeedState.loadingMore;
  public readonly error = this.liveFeedState.error;
  public readonly animatedIds = this.liveFeedState.animatedIds;
  public readonly hasMore = this.liveFeedState.hasMore;
  public readonly page = this.liveFeedState.page;
  public readonly pendingItems = this.liveFeedState.pendingItems;
  public readonly actionLabel = this.liveFeedState.actionLabel;
  public readonly showFloatingAction = this.liveFeedState.showFloatingAction;

  ngOnInit(): void {
    this.liveFeedState.initialize(this.pageSize);
  }

  ngOnDestroy(): void {
    this.liveFeedState.destroy();
  }

  public onActionClick(): void {
    this.liveFeedState.onActionClick();
  }
}
