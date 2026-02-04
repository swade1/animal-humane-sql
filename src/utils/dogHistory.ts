import { supabase } from '../lib/supabaseClient';

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
  // Check for recent identical event to prevent duplicates within the last minute
  const { data: recent, error: recentError } = await supabase
    .from('dog_history')
    .select('id, old_value, new_value, name, adopted_date, created_at')
    .eq('dog_id', dogId)
    .eq('event_type', eventType)
    .order('id', { ascending: false })
    .limit(1);

  if (recentError) {
    console.error('[dogHistory] Error fetching recent history for duplicate check:', { dogId, eventType, error: recentError });
  }

  if (
    recent && recent.length > 0 &&
    recent[0].old_value === oldValue &&
    recent[0].new_value === newValue &&
    (name ? recent[0].name === name : true) &&
    (adopted_date ? recent[0].adopted_date === adopted_date : true)
  ) {
    // Check if the last event was within the last minute
    const now = Date.now();
    const createdAt = recent[0].created_at ? new Date(recent[0].created_at).getTime() : 0;
    const oneMinute = 60 * 1000;
    if (createdAt > 0 && (now - createdAt) < oneMinute) {
      console.log('[dogHistory] Duplicate event detected within 1 minute, skipping log:', { dogId, eventType, oldValue, newValue, createdAt: recent[0].created_at });
      return;
    } else {
      console.log('[dogHistory] Identical event found but outside 1 minute window, will log new event:', { dogId, eventType, oldValue, newValue, createdAt: recent[0].created_at });
    }
  }

  const insertObj: {
    dog_id: number;
    event_type: string;
    old_value: string | null;
    new_value: string | null;
    notes?: string;
    name?: string;
    adopted_date?: string | null;
  } = {
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
    console.error('[dogHistory] Failed to log dog history:', { dogId, eventType, oldValue, newValue, error });
  } else {
    console.log('[dogHistory] Successfully logged event:', { dogId, eventType, oldValue, newValue });
  }
}
