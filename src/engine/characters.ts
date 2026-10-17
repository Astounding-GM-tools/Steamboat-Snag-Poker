export type AiId = 'pete' | 'willie' | 'felix' | 'betty' | 'sherlock';

export interface CharacterDef {
  id: string;
  ai: AiId;
  startPopularity: number;
  /** 'start' = in the league from month 1; 'firstElimination' = joins after the first drop-out. */
  joins: 'start' | 'firstElimination';
}

/** Display names and blurbs live in the i18n dictionary under `character.<id>.*`. */
export const ROSTER: CharacterDef[] = [
  { id: 'pete', ai: 'pete', startPopularity: 45, joins: 'start' },
  { id: 'willie', ai: 'willie', startPopularity: 55, joins: 'start' },
  { id: 'felix', ai: 'felix', startPopularity: 70, joins: 'start' },
  { id: 'betty', ai: 'betty', startPopularity: 65, joins: 'start' },
  { id: 'sherlock', ai: 'sherlock', startPopularity: 30, joins: 'firstElimination' },
];

export const HUMAN_ID = 'captain';
