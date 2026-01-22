import { createClient } from '@supabase/supabase-js';

// Replace with your actual values
const SUPABASE_URL = 'https://huwitedbfnodbwkxyiyp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2l0ZWRiZm5vZGJ3a3h5aXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjc4MDIsImV4cCI6MjA4NDYwMzgwMn0.5_P4ax9X8uP2uNBSArVKz0UlQqoG3owdHoXxNPwyShc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateAndFetchDog(dogId) {
  // Update manual fields
  const updateFields = {
    origin: 'City of Las Vegas Animal Care Center',
    latitude: '35.5939',
    longitude: '-105.2239',
    bite_quarantine: 0,
    returned: 0,
    notes: 'Updated via Node.js script'
  };

  const { error: updateError } = await supabase
    .from('dogs')
    .update(updateFields)
    .eq('id', dogId);

  if (updateError) {
    console.error('Update error:', updateError);
    return;
  }
  console.log('Update successful.');

  // Fetch the updated record
  const { data, error: fetchError } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', dogId)
    .single();

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }
  console.log('Fetched record:', data);
}

// Replace 1 with the actual dog ID you want to update
updateAndFetchDog(211015881);
