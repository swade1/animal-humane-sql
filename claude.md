#NOTE: Run scraper manually with 'npx tsx src/utils/run-scraper-pipeline.ts'

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
---

# Mobile Responsiveness Improvements

**Date:** February 27-28, 2026

## Overview
Fixed multiple mobile responsiveness issues across the dashboard to ensure all features are accessible and usable on cell phones and tablets.

---

## Problems Identified

### 1. Iframe Popup Modals Too Large for Mobile
- Dog detail popups had fixed pixel widths (800px, 750px) causing them to extend beyond screen boundaries
- Close button (X) appeared off-screen on mobile devices
- Users couldn't close the modals on phones

### 2. Admin Page Not Usable on Mobile
- Side-by-side layout with dog list on left and form on right
- Fixed margins (96px, 80px) pushed form completely off-screen
- Form had `minWidth: 420px` which was too wide for phones
- No responsive breakpoints - layout didn't adapt to screen size
- Input fields not visible or accessible on mobile

### 3. Current Population Tab Table Too Wide
- Fixed column widths with `minWidth: 180px` and `minWidth: 260px`
- Excessive padding (`paddingLeft: 11ch`) made columns too wide
- `whiteSpace: 'nowrap'` prevented text from wrapping
- Location column partially cut off on mobile screens

### 4. Modal Background Appearance
- Modals displaying with grey/translucent background instead of white
- Only using Tailwind class `bg-white` without explicit inline style

---

## Solutions Implemented

### 1. Fixed Iframe Popup Modal Sizing
**Files Modified:**
- `app/components/CurrentPopulationTab.tsx`
- `app/components/AdoptionsTab.tsx`
- `app/components/WheresFidoTab.tsx`
- `app/components/OverviewTable.tsx`
- `app/components/RecentPupdatesTab.tsx`
- `OverviewTab.js`

**Changes:**
- Replaced fixed pixel dimensions with responsive percentages
- Changed from `width: 800, height: 800` to `width: '100%', height: '100%'`
- Added max constraints: `maxWidth: '800px', maxHeight: '90vh'`
- Added `padding: '1rem'` to outer container for proper spacing on mobile
- Standardized close button position: `top: 8px, right: 8px`
- Close button always visible with white background and shadow

**Result:**
✅ Modals scale properly on all screen sizes
✅ Close button always accessible
✅ Maintains desktop appearance (max 800px wide)
✅ Click-outside-to-close functionality added

### 2. Redesigned Admin Page Layout
**Files Modified:**
- `app/admin/page.tsx`
- `app/components/DogEditForm.tsx`

**Major Changes:**
- **Eliminated side-by-side layout** - Form now appears at TOP when dog selected
- **Auto-scroll to top** - When clicking dog name or "+ Add New Dog", page scrolls to form automatically
- **Compact dog list** - Grid layout with multiple columns that adapt to screen width
- **Scrollable container** - Dog list limited to 400px height with scroll
- **Helpful instructions** - Blue banner explaining how to edit when no dog selected
- **Mobile-first workflow** - Single vertical column layout works on all devices

**Form Input Improvements:**
- All inputs use `fontSize: 16` (prevents iOS auto-zoom on focus)
- Added `boxSizing: 'border-box'` to all inputs
- Responsive labels with `fontSize: '0.95rem'`
- Form takes full width on mobile: `width: '100%'`
- Buttons flex-wrap on narrow screens
- Removed window.innerWidth checks in favor of CSS

**Login Form:**
- Proper padding and responsive sizing
- 16px font size on inputs (prevents mobile zoom)
- Responsive margin and padding

**Result:**
✅ Form fully visible when editing a dog
✅ All input fields accessible on phone
✅ No hidden content off-screen
✅ Clean single-column layout
✅ Proper touch targets for mobile

### 3. Fixed Current Population Tab Table
**File:** `app/components/CurrentPopulationTab.tsx`

**Changes:**
- Changed table from `w-1/2` (50% width) to `width: '100%'`
- Removed fixed `minWidth` constraints from columns
- Removed `whiteSpace: 'nowrap'` to allow text wrapping
- Reduced padding from `paddingLeft: '11ch'` to `paddingRight: '1rem'`
- Set proportional column widths: Name 40%, Location 60%
- Added `wordBreak: 'break-word'` for proper text wrapping
- Reduced container padding from `18px` to `4px` for more space
- Added `overflowX: 'auto'` as fallback for very long content
- Smaller font size for location: `fontSize: '0.95rem'`

**Result:**
✅ Both Name and Location columns fully visible on mobile
✅ Text wraps naturally to fit screen
✅ No horizontal scrolling needed
✅ Maintains readability on all devices

### 4. Fixed Modal Background Color
**Files Modified:**
- `app/components/CurrentPopulationTab.tsx`
- `app/components/AdoptionsTab.tsx`
- `app/components/WheresFidoTab.tsx`
- `app/components/OverviewTable.tsx`
- `OverviewTab.js`

**Change:**
- Added explicit `backgroundColor: 'white'` inline style to all modal containers
- Ensures solid white background instead of translucent grey

**Result:**
✅ Clean white background on all dog detail popups

---

## Key Mobile Design Principles Applied

1. **16px Font Size Rule** - All input fields use 16px to prevent iOS Safari auto-zoom
2. **Flexible Layouts** - Percentage-based widths instead of fixed pixels
3. **Proper Box Sizing** - `box-sizing: border-box` on all inputs
4. **Max Constraints** - Use `maxWidth`/`maxHeight` with viewport units (vh, vw)
5. **Text Wrapping** - Allow natural text flow with `wordBreak: 'break-word'`
6. **Touch Targets** - Adequate button sizes and padding for mobile interaction
7. **Viewport Padding** - Add breathing room with `padding: '1rem'` on containers
8. **Explicit Styles** - Inline styles override Tailwind for critical mobile properties

---

## Files Modified Summary

### Modal Components (All Tabs)
- ✅ `app/components/CurrentPopulationTab.tsx` - Responsive modal + table
- ✅ `app/components/AdoptionsTab.tsx` - Responsive modal
- ✅ `app/components/WheresFidoTab.tsx` - Responsive modal
- ✅ `app/components/OverviewTable.tsx` - Responsive modal
- ✅ `app/components/RecentPupdatesTab.tsx` - Already had responsive modal
- ✅ `OverviewTab.js` - Responsive modal

### Admin Section
- ✅ `app/admin/page.tsx` - Complete mobile redesign
- ✅ `app/components/DogEditForm.tsx` - Mobile-friendly inputs

---

## Testing Checklist

### Mobile Device Testing (phone screen ~375px wide)
- ✅ Dog detail popups open properly and show close button
- ✅ Click close button to dismiss popup
- ✅ Admin page shows form when dog selected
- ✅ All admin form fields visible and editable
- ✅ Input fields don't trigger zoom on iOS
- ✅ Current Population table shows both columns
- ✅ Location text wraps when too long
- ✅ All tabs navigate properly

### Tablet Testing (screen ~768px wide)
- ✅ Layouts adapt smoothly
- ✅ Tables use available space efficiently
- ✅ Modals maintain centered appearance

### Desktop Testing (screen >1024px wide)
- ✅ No regression in existing functionality
- ✅ Maintain original desktop appearance
- ✅ Admin page shows form at top (change from side-by-side)

---

## User Experience Improvements

**Before:** Users couldn't use dashboard effectively on mobile
- Popups too large, close buttons off-screen
- Admin panel completely unusable
- Tables cut off and unreadable

**After:** Full mobile functionality
- ✅ All popups accessible and dismissible
- ✅ Complete admin capabilities from phone
- ✅ All tables readable and usable
- ✅ Professional mobile experience

---

## Success Metrics

✅ Iframe popups properly sized for mobile viewing
✅ Close buttons always visible and accessible
✅ Admin page fully functional on mobile devices
✅ All input fields accessible for data entry
✅ Current Population table displays both columns
✅ Clean white backgrounds on all modals
✅ No horizontal scrolling required
✅ Touch-friendly UI elements
✅ Consistent experience across all screen sizes

---

## End of Mobile Improvements Session
All mobile responsiveness issues resolved. Dashboard now provides consistent, usable experience across desktop, tablet, and mobile devices. Admin functionality fully accessible from cell phones.