const apiOrigin = 'https://lastworkoutapp.onrender.com';
const apiBase = `${apiOrigin}/api`;

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
}

export const APP_ENDPOINTS = {
  apiOrigin,
  apiBase,
  auth: {
    login: `${apiBase}/login`,
    logout: `${apiBase}/logout`,
  },
  users: {
    collection: `${apiBase}/users`,
    byId: (id: string) => `${apiBase}/users/${id}`,
    profile: (id: string) => `${apiBase}/users/${id}/profile`,
  },
  workouts: {
    base: `${apiBase}/workouts/`,
    leaderboard: `${apiBase}/workouts/leaderboard`,
  },
  streak: {
    base: `${apiBase}/streak`,
    byUser: (id: string) => `${apiBase}/streak/${id}`,
    leaderboard: `${apiBase}/streak/leaderboard`,
  },
  notifications: {
    base: `${apiBase}/notifications`,
    dismiss: (notificationKey: string) => `${apiBase}/notifications/${encodeURIComponent(notificationKey)}`,
    markRead: (notificationKey: string) => `${apiBase}/notifications/${encodeURIComponent(notificationKey)}/read`,
  },
  password: {
    base: `${apiBase}/password`,
    sendCode: `${apiBase}/password/send-code`,
    verifyCode: `${apiBase}/password/verify-code`,
    reset: `${apiBase}/password/reset`,
  },
  teams: {
    base: `${apiBase}/teams`,
    leaderboard: `${apiBase}/teams/leaderboard`,
    byId: (id: string) => `${apiBase}/teams/${id}`,
    statistics: (id: string) => `${apiBase}/teams/${id}/statistics`,
    challenges: (id: string) => `${apiBase}/teams/${id}/challenges`,
    join: (id: string) => `${apiBase}/teams/${id}/join`,
    leave: (id: string) => `${apiBase}/teams/${id}/leave`,
    joinRequests: (id: string) => `${apiBase}/teams/${id}/join-requests`,
    approveJoinRequest: (teamId: string, requestId: number) => `${apiBase}/teams/${teamId}/join-requests/${requestId}/approve`,
    rejectJoinRequest: (teamId: string, requestId: number) => `${apiBase}/teams/${teamId}/join-requests/${requestId}/reject`,
  },
  reverb: {
    appKey: 'app-key',
    wsHost: hostFromUrl(apiOrigin),
    wsPort: 80,
    wssPort: 443,
    forceTLS: true,
    authEndpoint: `${apiBase}/broadcasting/auth`,
    privateChannel: 'private-live-feed',
    eventName: 'live-feed.item.created',
  },
} as const;
