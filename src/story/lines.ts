/** The ways of saying things at the table, and what the story calls people. */
import { t } from '../i18n';
import type { SpeechLine } from '../ui/Speech.svelte';

export const say = (who: string, text: string | string[]): SpeechLine => ({ size: 'scene', who, text });
export const aside = (who: string, text: string): SpeechLine => ({ size: 'aside', who, text });
export const you = (text: string): SpeechLine => say('you', text);

export const called = (id: string) => t(`character.${id}.called`);
export const capital = (s: string) => s[0].toUpperCase() + s.slice(1);
