#### Manual Entry/Update Methods (as of Jan 2026)

**1. Supabase Table Editor:**
- Use the Supabase web dashboard Table Editor to directly edit or add records for manual fields (origin, latitude, longitude, bite_quarantine, returned, notes).
- This is the simplest way for quick manual updates and validation.

**2. SQL Queries:**
- Use the SQL editor in the Supabase dashboard to run `UPDATE` or `INSERT` statements for manual fields.
- Example:
  ```sql
  UPDATE dogs SET origin = 'Rescue', latitude = '35.0844', longitude = '-106.6504', bite_quarantine = 0, returned = 1, notes = 'Test entry' WHERE id = 1;
  ```

**3. Node.js Script:**
- Use a Node.js script with the Supabase JS client to programmatically update and fetch records.
- Example:
  ```js
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient('https://your-project.supabase.co', 'your-anon-key');
  async function updateAndFetchDog(dogId) {
    const updateFields = { origin: 'Rescue', latitude: '35.0844', longitude: '-106.6504', bite_quarantine: 1, returned: 0, notes: 'Updated via Node.js script' };
    await supabase.from('dogs').update(updateFields).eq('id', dogId);
    const { data } = await supabase.from('dogs').select('*').eq('id', dogId).single();
    console.log(data);
  }
  updateAndFetchDog(1);
  ```

**4. API/REST Tools (Optional):**
- Use Postman, curl, or similar tools to call the Supabase REST API for updating records.
- Example:
  ```sh
  curl -X PATCH 'https://<your-project>.supabase.co/rest/v1/dogs?id=eq.1' \
    -H 'apikey: <anon-key>' \
    -H 'Authorization: Bearer <anon-key>' \
    -H 'Content-Type: application/json' \
    -d '{"origin":"Rescue","latitude":"35.0844","longitude":"-106.6504","bite_quarantine":0,"returned":1,"notes":"Test"}'
  ```

All methods above update the same fields in the Supabase `dogs` table. Use whichever is most convenient for your workflow. Frontend UI/manual entry is in progress and will further streamline this process.
