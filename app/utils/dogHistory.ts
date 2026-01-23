import { supabase } from '../lib/supabaseClient';

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
  name,
  eventType,
  oldValue,
  newValue,
  notes = '',
  adopted_date
}: {
  dogId: number;
  name: string;
  eventType: string;
  oldValue: string | null;
  newValue: string | null;
  notes?: string;
  adopted_date?: string | null;
}) {
  const { error } = await supabase.from('dog_history').insert([
    {
      dog_id: dogId,
      name,
      event_type: eventType,
      old_value: oldValue,
      new_value: newValue,
      notes,
      adopted_date
    }
  ]);
  if (error) {
    console.error('Failed to log dog history:', error);
  }
}
