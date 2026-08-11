import { parseISO } from 'date-fns';

// Postgres returns timestamp columns without a 'Z' suffix even though the stored value is UTC,
// so a plain `new Date(value)` would be misparsed as the viewer's local time. Append 'Z' first.
export const parseUtcTimestamp = (value: string): Date => {
  const withZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value) ? `${value}Z` : value;
  return parseISO(withZ);
};
