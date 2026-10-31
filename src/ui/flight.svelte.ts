/**
 * Coins in the air (counted from the moment they're sent, through any delay,
 * until they land), and payments queued to go after them: the table waits on both.
 */
export const flight = $state({ coins: 0, flows: 0 });
