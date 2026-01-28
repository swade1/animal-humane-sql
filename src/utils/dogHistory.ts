import { supabase } from '../lib/supabaseClient';

/**
 * Logs a change to a dog's data in the dog_history table.
 * @param dogId The dog's id
 * @param name The dog's name (optional)
 * @param eventType e.g. 'location_change', 'status_update'
 * @param oldValue The previous value (e.g. old location)
 * @param newValue The new value (e.g. new location)
 * @param notes Optional notes
 * @param adopted_date Optional adopted date (for adoptions)
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
  name?: string;
  eventType: string;
  oldValue: string | null;
  newValue: string | null;
  notes?: string;
  adopted_date?: string | null;
}) {
  // Check for recent identical event to prevent duplicates
  const { data: recent, error: fetchError } = await supabase
    .from('dog_history')
    .select('*')
    .eq('dog_id', dogId)
    .eq('event_type', eventType)
    .order('id', { ascending: false })
    .limit(1);

  if (
    recent && recent.length > 0 &&
    recent[0].old_value === oldValue &&
    recent[0].new_value === newValue &&
    (name ? recent[0].name === name : true) &&
    (adopted_date ? recent[0].adopted_date === adopted_date : true)
  ) {
    // Duplicate found, skip insert
    console.log('[dogHistory] Duplicate event detected, skipping log:', { dogId, eventType, oldValue, newValue });
    return;
  }

  const insertObj: any = {
    dog_id: dogId,
    event_type: eventType,
    old_value: oldValue,
    new_value: newValue,
    notes
  };
  if (name) insertObj.name = name;
  if (adopted_date) insertObj.adopted_date = adopted_date;
  const { error } = await supabase.from('dog_history').insert([insertObj]);
  if (error) {
    console.error('Failed to log dog history:', error);
  }
}
