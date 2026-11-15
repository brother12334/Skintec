import type { NightKind } from '../types';

/** One mood per kind of routine; each is a pastel and a deep ink of the same hue. */
export type Mood = 'am' | NightKind;

export const MOOD_CLASSES = ['mood-am', 'mood-bha', 'mood-adapalene', 'mood-recovery'] as const;

export function moodClass(mood: Mood): string {
  return `mood-${mood}`;
}

/** Swatch class for colour-coding a night next to other nights. */
export function swatchClass(kind: Mood): string {
  return `sw-${kind}`;
}
