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

export interface TeamSummary {
  id: string;
  name: string;
  logo_url: string | null;
  gradient_preset: TeamGradientPreset;
  members_count: number;
  is_member: boolean;
  is_creator: boolean;
}

export interface TeamMember {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface TeamDetail extends TeamSummary {
  members: TeamMember[];
}

export function teamStrokeClass(preset: string): string {
  const allowed: TeamGradientPreset[] = TEAM_GRADIENT_PRESETS.map((p) => p.id);
  const key = allowed.includes(preset as TeamGradientPreset) ? preset : 'sky_indigo';
  return `team-stroke team-stroke--${key}`;
}

/** Full-area gradient for preset picker cards */
export function teamPresetCardClass(preset: string): string {
  const allowed: TeamGradientPreset[] = TEAM_GRADIENT_PRESETS.map((p) => p.id);
  const key = allowed.includes(preset as TeamGradientPreset) ? preset : 'sky_indigo';
  return `team-preset-card team-preset-card--${key}`;
}

/** Vertical strip for compact lists (e.g. team overview rows) */
export function teamPresetStripClass(preset: string): string {
  const allowed: TeamGradientPreset[] = TEAM_GRADIENT_PRESETS.map((p) => p.id);
  const key = allowed.includes(preset as TeamGradientPreset) ? preset : 'sky_indigo';
  return `team-preset-strip team-preset-strip--${key}`;
}
