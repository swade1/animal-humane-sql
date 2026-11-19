// Dogs whose AHNM-A tag number is far below the current active population almost
// certainly predate this database (adopted long before scraping began) and are now
// back at the shelter, even though no adopted->available dog_history event exists
// for them to detect the return normally. There's currently a ~70,000-wide gap
// between the AHNM-A numbers of the oldest still-active dogs (~10,800) and the
// newest intakes (~86,000+), so any number below this threshold is an unambiguous
// signal of an old intake rather than a genuinely new dog.
export const LOW_AHNM_A_RETURN_THRESHOLD = 70000;

export const isLowAhnmA = (ahnmA: unknown): boolean =>
  typeof ahnmA === 'number' && ahnmA > 0 && ahnmA < LOW_AHNM_A_RETURN_THRESHOLD;
