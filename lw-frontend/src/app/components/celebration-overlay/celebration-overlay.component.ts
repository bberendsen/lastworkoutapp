import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CelebrationType = 'workout-logged' | 'streak' | 'welcome-back' | 'custom';

export interface CelebrationPreset {
  title: string;
  subtitle: string;
  icon: 'check' | 'flame' | 'wave';
}

const PRESETS: Record<Exclude<CelebrationType, 'custom'>, CelebrationPreset> = {
  'workout-logged': {
    title: 'Workout logged',
    subtitle: "Keep the streak going. You're doing great.",
    icon: 'check',
  },
  streak: {
    title: 'Second workout in a row!',
    subtitle: "You're on fire. Keep it up!",
    icon: 'flame',
  },
  'welcome-back': {
    title: 'Where have you been?',
    subtitle: "Great to see you back. Let's go!",
    icon: 'wave',
  },
};

@Component({
  standalone: true,
  selector: 'app-celebration-overlay',
  imports: [CommonModule],
  templateUrl: './celebration-overlay.component.html',
  styleUrls: ['./celebration-overlay.component.css'],
})
export class CelebrationOverlayComponent {
  show = input<boolean>(false);
  type = input<CelebrationType>('workout-logged');
  title = input<string | undefined>(undefined);
  subtitle = input<string | undefined>(undefined);

  get preset(): CelebrationPreset | null {
    const t = this.type();
    if (t === 'custom') {
      const title = this.title();
      const subtitle = this.subtitle();
      if (title != null) {
        return {
          title,
          subtitle: subtitle ?? '',
          icon: 'check',
        };
      }
      return null;
    }
    return PRESETS[t] ?? null;
  }
}
