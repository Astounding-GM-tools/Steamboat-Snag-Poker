/** The voyage's flags, by name, so a typo won't compile. */
export const FLAG = {
  /** Willie has been ashore, and found work. */
  jobFound: 'jobFound',
  /** Willie has told you about the pilot (you've been at the deck game where he did). */
  heardOfPilot: 'met:deckIntel',
  owesGaylord: 'owesGaylord',
  /** You've hired him. He despises anyone who won't play their own seat, and that means his clients. */
  gaylordsClient: 'hiredGaylord',
  /** You've finished a table ahead of him: he only lends to people who can play. */
  beatGaylord: 'beatGaylord',
} as const;
