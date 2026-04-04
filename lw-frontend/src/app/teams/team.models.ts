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
}

export interface TeamMember {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface TeamDetail extends TeamSummary {
  members: TeamMember[];
  has_pending_request?: boolean;
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
