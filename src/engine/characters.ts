/** How a captain plays. Several captains may share a style. */
export type AiId =
  | 'bully' // Pete: biggest cards, never risks a Joker
  | 'shark' // Der Captain: solid, and loves a Joker in trips
  | 'prankster' // Hans & Fritz: mostly random mischief
  | 'loose' // Jiggs: plays fast and loose for big pots
  | 'careful' // Maggie: tight, careful, punishing
  | 'gambler' // Gaylord Ravenal: calculates everything
  | 'dreamer' // Little Nemo: drifts between brilliant and baffling
  | 'clueless' // Felix: thinks Jokers are good for you
  | 'anarchist' // Ignatz: throws away his whole hand, flings Jokers like bricks
  | 'stubborn'; // Steamboat Bill: stands pat, never changes his mind

export interface CharacterDef {
  id: string;
  ai: AiId;
  startMoney: number;
  /**
   * When the captain enters the river: 'start'; 'firstElimination' (after
   * anyone is busted); or { after: id } (once that captain is busted).
   */
  joins: 'start' | 'firstElimination' | { after: string };
}

/** Names, boats and blurbs live in the i18n dictionary under `character.<id>.*`. */
export const ROSTER: CharacterDef[] = [
  { id: 'pete', ai: 'bully', startMoney: 45, joins: 'start' },
  { id: 'derCaptain', ai: 'shark', startMoney: 55, joins: 'start' },
  { id: 'hansFritz', ai: 'prankster', startMoney: 40, joins: 'start' },
  { id: 'jiggs', ai: 'loose', startMoney: 60, joins: 'start' },
  { id: 'nemo', ai: 'dreamer', startMoney: 50, joins: 'start' },
  { id: 'felix', ai: 'clueless', startMoney: 70, joins: 'start' },
  { id: 'ignatz', ai: 'anarchist', startMoney: 45, joins: 'start' },
  { id: 'steamboatBill', ai: 'stubborn', startMoney: 50, joins: 'start' },
  { id: 'gaylord', ai: 'gambler', startMoney: 30, joins: 'firstElimination' },
  { id: 'maggie', ai: 'careful', startMoney: 70, joins: { after: 'jiggs' } },
];

/** Styles of retired captains, so older saved games keep playing. */
export const LEGACY_AI: Record<string, AiId> = {
  pete: 'bully',
  willie: 'dreamer',
  felix: 'clueless',
  betty: 'careful',
  sherlock: 'gambler',
};

export const HUMAN_ID = 'captain';
