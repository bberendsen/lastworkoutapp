import { Injectable } from '@angular/core';
import Pusher, { Channel } from 'pusher-js';
import { LiveFeedItem } from './workoutService';
import { APP_ENDPOINTS } from '../config/app-endpoints';

@Injectable({
  providedIn: 'root',
})
export class LiveFeedRealtimeService {
  private readonly tokenKey = 'lw_access_token';
  private readonly appKey = APP_ENDPOINTS.reverb.appKey;
  private readonly pusher: Pusher;

  constructor() {
    const token = localStorage.getItem(this.tokenKey);
    this.pusher = new Pusher(this.appKey, {
      cluster: 'mt1',
      wsHost: APP_ENDPOINTS.reverb.wsHost,
      wsPort: APP_ENDPOINTS.reverb.wsPort,
      wssPort: APP_ENDPOINTS.reverb.wssPort,
      forceTLS: APP_ENDPOINTS.reverb.forceTLS,
      enabledTransports: ['ws', 'wss'],
      channelAuthorization: {
        endpoint: APP_ENDPOINTS.reverb.authEndpoint,
        transport: 'ajax',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });
  }

  subscribe(onItem: (item: LiveFeedItem) => void): () => void {
    const channel: Channel = this.pusher.subscribe(APP_ENDPOINTS.reverb.privateChannel);
    const handler = (payload: { item?: LiveFeedItem } | null | undefined) => {
      if (payload?.item) {
        onItem(payload.item);
      }
    };

    channel.bind(APP_ENDPOINTS.reverb.eventName, handler);

    return () => {
      channel.unbind(APP_ENDPOINTS.reverb.eventName, handler);
      this.pusher.unsubscribe(APP_ENDPOINTS.reverb.privateChannel);
    };
  }
}
