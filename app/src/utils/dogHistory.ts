import { supabase } from '../lib/supabaseClient.ts';

/**
 * Logs a change to a dog's data in the dog_history table.
 * @param dogId The dog's id
 * @param eventType e.g. 'location_change', 'status_update'
 * @param oldValue The previous value (e.g. old location)
 * @param newValue The new value (e.g. new location)
 * @param notes Optional notes
 */
export async function logDogHistory({
  dogId,
  eventType,
  oldValue,
  newValue,
  notes = ''
}: {
  dogId: number;
  eventType: string;
  oldValue: string | null;
  newValue: string | null;
  notes?: string;
}) {
  const { error } = await supabase.from('dog_history').insert([
    {
      dog_id: dogId,
      event_type: eventType,
      old_value: oldValue,
      new_value: newValue,
      notes
    }
  ]);
  if (error) {
    console.error('Failed to log dog history:', error);
  }
}
