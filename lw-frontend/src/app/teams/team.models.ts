export type TeamGradientPreset =
  | 'amber_emerald'
  | 'rose_violet'
  | 'sky_indigo'
  | 'ocean_teal'
  | 'sunset_orange'
  | 'midnight_purple';

export const TEAM_GRADIENT_PRESETS: { id: TeamGradientPreset; label: string }[] = [
  { id: 'amber_emerald', label: 'Amber → Emerald' },
  { id: 'rose_violet', label: 'Rose → Violet' },
  { id: 'sky_indigo', label: 'Sky → Indigo' },
  { id: 'ocean_teal', label: 'Ocean → Teal' },
  { id: 'sunset_orange', label: 'Sunset' },
  { id: 'midnight_purple', label: 'Midnight' },
];

/** Inline CSS gradients (avoids Tailwind/layer issues with dynamic class names). */
export const TEAM_PRESET_LINEAR_GRADIENT: Record<TeamGradientPreset, string> = {
  amber_emerald: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
  rose_violet: 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)',
  sky_indigo: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  ocean_teal: 'linear-gradient(135deg, #0284c7 0%, #14b8a6 100%)',
  sunset_orange: 'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)',
  midnight_purple: 'linear-gradient(135deg, #312e81 0%, #7c3aed 100%)',
};

export interface TeamSummary {
  id: string;
  name: string;
  logo_url: string | null;
  gradient_preset: TeamGradientPreset;
  members_count: number;
  is_member: boolean;
  is_creator: boolean;
  has_pending_request?: boolean;
  pending_join_requests_count?: number;
}

export interface TeamMember {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  /** Workouts logged while attributed to this team. */
  team_workouts_count: number;
  /** Total lifetime XP (workouts + personal milestones). */
  xp: number;
}

/** Team total = sum of members’ XP + one-time challenge bonuses. */
export interface TeamXpInfo {
  total: number;
  from_members: number;
  from_challenges: number;
  progress_band: { from: number; to: number; progress: number };
  /** Workout XP this week (team-attributed workouts). */
  xp_this_week: number;
}

/** Row for global team leaderboard (total workouts for the team). */
export interface TeamLeaderboardRow {
  id: string;
  name: string;
  logo_url: string | null;
  gradient_preset: TeamGradientPreset;
  total_workouts: number;
  total_xp: number;
  /** Workout XP this week from team-attributed workouts. */
  xp_this_week: number;
}

export interface TeamChallengeItem {
  id: string;
  title: string;
  description: string;
  /** 0–1 progress toward the goal */
  progress: number;
  status_label: string;
  completed: boolean;
  xp_reward: number;
}

export interface TeamChallengesPayload {
  challenges: TeamChallengeItem[];
}

export interface TeamStatistics {
  total_workouts: number;
  workouts_this_week: number;
  /** Full team XP (members + challenge bonuses). */
  total_xp: number;
  /** Workout XP this week from team-attributed workouts only. */
  xp_this_week: number;
  week_starts_at: string;
  week_ends_at: string;
  weekly_ranking: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    workouts_this_week: number;
    xp_this_week: number;
  }[];
  current_week_by_day: {
    day: string;
    workouts: number;
    contributors: {
      initials: string;
      label: string;
      workouts: number;
    }[];
  }[];
  last_12_weeks: {
    week_starts_at: string;
    week_ends_at: string;
    workouts: number;
  }[];
}

export interface TeamDetail extends TeamSummary {
  members: TeamMember[];
  xp: TeamXpInfo;
  has_pending_request?: boolean;
  /** True when you belong to a different team (cannot request to join this one). */
  already_in_another_team?: boolean;
  /** Only meaningful when you are the team creator */
  pending_join_requests_count?: number;
}

export interface TeamJoinRequestItem {
  id: number;
  user: {
    id: string;
    username: string;
    age: number | null;
  };
}

function presetKey(preset: string): TeamGradientPreset {
  const allowed = TEAM_GRADIENT_PRESETS.map((p) => p.id);
  return allowed.includes(preset as TeamGradientPreset) ? (preset as TeamGradientPreset) : 'sky_indigo';
}

/** Use with [style.background] so gradients always render (not purged / not 1px-tall issues). */
export function teamPresetLinearGradient(preset: string): string {
  const k = presetKey(preset);
  return TEAM_PRESET_LINEAR_GRADIENT[k];
}
