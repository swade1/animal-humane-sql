# Session Summary: Animal Humane SQL Dashboard Fixes

**Date:** February 26, 2026

## Overview
Fixed multiple issues with the Animal Humane New Mexico dashboard scraper and UI, transitioning from Puppeteer-based scraping to direct API calls to bypass bot detection.

---

## Problems Identified

### 1. Recent Pupdates Tab Issues
- **Problem A:** Addie (ID: 212901265) and Barley (ID: 213089233) incorrectly appearing in "Available but Temporarily Unlisted" category despite being on the website
- **Problem B:** Bubbles (ID: 213012292), Jaeger (ID: 213012498), and Banana Pepper (ID: 213029641) not appearing in "New Dogs" category

### 2. Root Cause
- VPN connectivity issue prevented scraper from running successfully
- `latest_scraped_ids.json` was outdated and missing current dog IDs
- Dogs with `status=null` and "Available Soon" notes never transitioned to `status='available'`

### 3. Scraper Bot Detection
- Website blocking Puppeteer headless browsers with "Access Denied" page
- GitHub Actions runner IP (LIMESTONENETWORKS datacenter) was blacklisted
- Local Puppeteer also blocked due to bot detection

### 4. Data Quality Issues
- Scraper was collecting both cats and dogs (73 animals total)
- Only needed dogs (59 animals)
- UI showing cats mixed with dogs in multiple tabs

### 5. Overview Tab Inconsistencies
- "Available Soon" count showing 18 instead of 42
- Double counting dogs in Foster Home category
- Too many granular location categories

---

## Solutions Implemented

### 1. Replaced Puppeteer with Direct API Calls
**File:** `src/utils/scraper.ts`

**Before:**
- Used Puppeteer to load webpage and intercept network requests
- Captured 6 different API endpoint URLs with query parameters
- Prone to bot detection and IP blocking

**After:**
```typescript
export async function getIframeUrls(mainUrl: string): Promise<string[]> {
  console.log('[scraper] Using base API endpoint (no filters needed)');
  
  // Base API endpoint returns ALL dogs from the shelter
  // Last verified: February 26, 2026
  const knownEndpoints = [
    'https://new.shelterluv.com/api/v3/available-animals/1255',
  ];
  
  return knownEndpoints;
}
```

**Benefits:**
- Bypasses bot detection entirely
- Simpler (1 URL instead of 6)
- More stable (base URL won't change)
- Works in GitHub Actions and locally

### 2. Added Cat Filtering
**File:** `src/utils/scraper.ts`

```typescript
// Filter to only include dogs (species === 'Dog')
const dogs = data.animals.filter((animal: Record<string, unknown>) => {
  const species = typeof animal.species === 'string' ? animal.species : '';
  return species.toLowerCase() === 'dog';
});
console.log(`[SCRAPER] Filtered ${dogs.length} dogs from ${data.animals.length} total animals`);
```

**Result:** 59 dogs filtered from 73 total animals (14 cats excluded)

### 3. Fixed Supabase Client for CLI Usage
**File:** `src/lib/supabaseClient.ts`

```typescript
import dotenv from 'dotenv';

// Load .env.local when running from CLI scripts
if (typeof window === 'undefined') {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
```

Enables scraper scripts to run from command line with proper environment variables.

### 4. Fixed Backup Mechanism
**File:** `src/utils/scraper.ts`

Updated backup section to use environment variable fallbacks and gracefully skip if credentials unavailable:

```typescript
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('[SCRAPER][BACKUP] Skipping backup: Supabase credentials not available');
  return;
}
```

### 5. Simplified Overview Tab Categories
**File:** `app/components/OverviewUnitChart.tsx`

**Before:** 11 categories including Foster Home, Dog Treatment, Clinic, Behavior Office, etc.

**After:** 5 streamlined categories
1. **Listed on Website** - Dogs currently on shelter website
2. **Temporarily Unlisted** - `status='available'` but NOT in `latest_scraped_ids.json`
3. **Available Soon (Foster)** - `status=NULL` + "Available Soon" in notes + Foster Home location
4. **Available Soon (Onsite)** - `status=NULL` + "Available Soon" in notes + onsite locations
5. **Trial Adoption** - Dogs in Trial Adoption locations

**Key Fix:** Available Soon breakdown prevents double-counting with Foster Home category

### 6. Updated .gitignore
**File:** `.gitignore`

```
# scripts directory (temporary debugging/testing files)
/scripts/

# misc
*.bak

# debug files
/public/debug-*.json
```

---

## Scripts Created

### Utility Scripts (in `/scripts/` directory)
1. **check-problem-dogs.ts** - Query specific dog statuses
2. **check-dog-history.ts** - Query dog_history events
3. **transition-available-soon-dogs.ts** - Manually transition dogs from null→available status
4. **check-dog-status.ts** - Verify transitions completed
5. **fetch-all-dogs-direct.ts** - Fetch from API endpoints directly (bypass Puppeteer)
6. **compare-urls.ts** - Compare base URL vs query URLs to verify completeness
7. **remove-cats.ts** - Remove cat records from dogs table
8. **test-missing-endpoint.ts** - Test accessibility of specific API endpoint

---

## Manual Database Updates

### Removed Cats
- Manually deleted cat records from `dogs` table
- 14 cats removed to maintain dog-only database

---

## Git History

1. **Reset to f8422dc** - "Updated scraper to catch location changes"
2. **Force push** - Overwrote remote with local reset
3. **Final commits:**
   - Fixed Supabase client with dotenv support
   - Replaced Puppeteer with direct API calls
   - Added cat filtering
   - Fixed backup mechanism
   - Updated .gitignore
   - Simplified Overview tab categories

---

## Technical Details

### API Discovery
- Base endpoint: `https://new.shelterluv.com/api/v3/available-animals/1255`
- Returns 73 animals (59 dogs + 14 cats)
- Query parameters (`saved_query=XXXX`) are just filtered views of the same data
- Base endpoint is stable and doesn't require query parameters

### Dog Status Flow
```
Manual Entry (status=NULL, notes="Available Soon")
    ↓
Available (status='available')
    ↓
Listed on Website (in latest_scraped_ids.json)
    ↓
Adopted (status='adopted')
```

### Categories Logic
- **Listed on Website:** Dog ID exists in `latest_scraped_ids.json`
- **Temporarily Unlisted:** `status='available'` AND NOT in `latest_scraped_ids.json` AND NOT in Trial Adoption
- **Available Soon:** `status=NULL` AND notes contains "Available Soon" AND NOT in Trial Adoption
- **Trial Adoption:** Location contains "Trial Adoption" (any status)

---

## Files Modified

### Core Application Files
- `src/utils/scraper.ts` - Replaced Puppeteer with direct API, added cat filtering
- `src/lib/supabaseClient.ts` - Added dotenv support for CLI
- `app/components/OverviewUnitChart.tsx` - Simplified to 5 categories with Available Soon breakdown
- `app/components/RecentPupdatesTab.tsx` - Fixed returnedDogs query field name
- `public/latest_scraped_ids.json` - Updated with current 59 dog IDs

### Configuration Files
- `.gitignore` - Added scripts/, *.bak, debug files

---

## Running the Scraper

### Local Execution
```bash
npx tsx src/utils/run-scraper-pipeline.ts
```

### Expected Output
```
[SCRAPER] Using base API endpoint (no filters needed)
[SCRAPER] Using 1 API endpoint
[SCRAPER] Filtered 59 dogs from 73 total animals
Saved 59 scraped dog IDs to public/latest_scraped_ids.json
Upserted 59 dogs to Supabase.
[SCRAPER][BACKUP] Backed up dogs to backups/dogs_rows.sql
[SCRAPER][BACKUP] Backed up dog_history to backups/dog_history_rows.sql
```

---

## Success Metrics

✅ Scraper runs successfully locally and in GitHub Actions  
✅ No more bot detection / Access Denied errors  
✅ Only dogs collected (cats filtered out)  
✅ All 59 current dogs captured in `latest_scraped_ids.json`  
✅ Available Soon breakdown shows correct totals (42 dogs)  
✅ No double-counting between categories  
✅ Database backups working automatically  
✅ Recent Pupdates tab showing correct dogs in each category  

---

## Maintenance Notes

### Updating API Endpoints (if needed in future)
1. Visit https://animalhumanenm.org/adopt/adoptable-dogs
2. Open DevTools → Network tab → Filter by "available-animals"
3. Copy all URLs (though base URL should be sufficient)
4. Update endpoints in `src/utils/scraper.ts` line ~136
5. Update "Last verified" date comment

### Expected Stability
- **Base URL:** Very stable (unlikely to change)
- **Query parameters:** Only change if shelter reorganizes website sections
- **Endpoint structure:** `/api/v3/available-animals/1255` where 1255 is shelter ID

---

## Resolved Issues Summary

| Issue | Status | Solution |
|-------|--------|----------|
| Bot detection blocking scraper | ✅ Fixed | Replaced Puppeteer with direct API calls |
| Cats appearing in dog dashboard | ✅ Fixed | Added species='Dog' filter |
| Missing dogs from latest_scraped_ids | ✅ Fixed | Using base API endpoint that returns all animals |
| Available Soon count incorrect | ✅ Fixed | Matched logic between Overview and Recent Pupdates tabs |
| Double counting Foster Home dogs | ✅ Fixed | Split Available Soon into Foster/Onsite categories |
| Addie/Barley in wrong category | ✅ Fixed | Updated latest_scraped_ids.json |
| Bubbles/Jaeger/Banana Pepper missing | ✅ Fixed | Manual status transition + fixed scraper |
| Backup mechanism failing | ✅ Fixed | Added environment variable fallbacks |

---

## End of Session
All changes committed and pushed to repository. Dashboard now accurately reflects shelter dog population with simplified, logical categories.
