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

---

# Session Continuation Summary: March 16–17, 2026

## Overview
Follow-up work focused on UI polish (chart sizing, alignment, and messaging), then a user-requested hard reset to the latest commit, followed by partial recovery of deleted context docs and build-error remediation.

---

## Work Attempted (UI/Styling)

### 1. Insights & Spotlight visualization sizing/alignment
- Iterated on matching sizes/heights for:
  - `Dog Intake Sources` (`ShelterBarChart`)
  - `Owner Surrendered Dogs by Age and Size` (`OwnerSurrenderHeatmap`)
- Applied equal-width card approach and tuned fixed heights.
- Increased heatmap cell sizes to reduce bottom whitespace.
- Added mobile-specific stacking logic in `app/page.tsx` for the dual-visualization row.

### 2. Overview and messaging updates
- Removed `Unknown` from the Overview legend in `OverviewUnitChart`.
- Added update-delay disclaimer to main page and adjusted styling from yellow alert-like tone to light blue info tone.
- Added official/non-official project disclaimer text.
- Moved corrections contact line to below the Overview unit graph, outside the card.

### 3. Chart visual consistency pass
- Standardized chart title style to a shared spec across major visualization components.
- Standardized secondary/subtitle text style (`fontSize`, color tone, line-height) across chart/map description blocks.

---

## Major Reset Event

At user request, the repo was reverted to latest commit via:

```bash
git reset --hard HEAD
git clean -fd
```

### Important impact
- Local untracked files were deleted from working directory.
- Tracked files were reset to committed versions.
- Ignored files remained (as expected).

---

## Recovery Actions Performed

### Restored deleted docs
- Recreated:
  - `docs/premium-request-rubric.md`
  - `docs/premium_prompt.md`

### Build/import fix after reset
- Resolved module error:
  - `Module not found: Can't resolve './components/ShelterTransferChart'`
- Updated `app/page.tsx` to use existing `ShelterStackedBarChart` import/component.

---

## Notes for Next AI Session

1. **Inspect live file state first** before applying assumptions from prior edits.
   - User/editor made additional post-reset edits across multiple chart components and `app/page.tsx`.
2. `claude.md` remains the canonical continuity file and should be appended (not replaced).
3. If user asks to “revert,” confirm whether they mean:
   - code-only reset (`git reset --hard`) **or**
   - full cleanup including untracked deletion (`git clean -fd`).
4. For any recovery request, prefer restoring from:
   - git history (tracked files), then
   - known session content (for previously untracked docs/scripts).

---

## Current Known State (Quick Verification)

Use this 2-minute checklist at session start:

- [ ] Confirm app builds/runs without import errors from `app/page.tsx`.
- [ ] Verify Insights & Spotlight tab renders all sections:
  - `InsightsSpotlightTab`
  - `ShelterMap`
  - dual row (`ShelterBarChart` + `OwnerSurrenderHeatmap`)
  - `ShelterStackedBarChart`
  - `LengthOfStayHistogram`
  - `AverageLengthOfStayByAgeGroupChart`
- [ ] Confirm update-delay notice appears near top of main page and uses light blue informational styling.
- [ ] Confirm Overview legend excludes `Unknown`.
- [ ] Confirm corrections contact line appears below the Overview unit graph, outside the card:
  - `Send dashboard corrections or updates to susan.wade09@gmail.com`
- [ ] Confirm project disclaimer text remains visible near top of main page.
- [ ] Confirm recovered docs exist:
  - `docs/premium-request-rubric.md`
  - `docs/premium_prompt.md`

---

# Session Continuation Summary: March 17, 2026 (Mobile + Insights UI Polish)

## Overview
This session focused on targeted mobile/desktop presentation fixes across the main page and Insights & Spotlight tab, plus chart interaction polish on touch devices.

---

## Completed Changes

### 1. Main headline placement, spacing, and icon alignment
**File:** `app/page.tsx`

- Reworked headline content to:
  - `Animal Humane New Mexico` + paw icon + `Pet Status & Updates`
- Replaced the colon with the paw icon and used explicit spacing around the icon.
- Tuned icon alignment and final orientation to `-45deg`.
- Kept laptop styling stable while applying mobile-specific vertical icon adjustment.
- Set fixed left/right headline margins to `20px` to align with top message cards.

**Result:**
✅ Headline now reflects requested copy and icon placement in both laptop/mobile views.

---

### 2. Overview-only placement for independent-resource disclaimer
**File:** `app/page.tsx`

- Moved the long independent-resource disclaimer from the shared top area.
- Inserted it below `OverviewUnitChart` only (Overview tab).
- Added spacing (blank line/separator) between that disclaimer and the corrections contact line.

**Result:**
✅ Disclaimer now appears only at the bottom of Overview and no longer appears on other tabs.

---

### 3. Tab spacing behavior on mobile
**Files:**
- `app/components/Tabs.tsx`
- `app/page.tsx`

- Identified that prior Tailwind breakpoint-only changes were not reliably applying in runtime.
- Added `isMobileLayout` prop to `Tabs` and passed it from `page.tsx`.
- Applied explicit inline mobile layout styles for wrapped tab rows:
  - `display: flex`
  - `flex-wrap: wrap`
  - `rowGap: 8px`
  - vertical padding on mobile

**Result:**
✅ Mobile tab rows now have visible whitespace between wrapped rows without disturbing desktop layout.

---

### 4. Adoptions tab explanatory text right-side spacing
**File:** `app/components/AdoptionsTab.tsx`

- Added `paddingRight: '18px'` to the “Dogs are assumed...” explanatory text container.

**Result:**
✅ Wrapped lines no longer run into card border on right side (desktop/mobile).

---

### 5. Where’s Fido label/input breathing room
**File:** `app/components/WheresFidoTab.tsx`

- Replaced utility-only spacing with explicit inline spacing for reliability:
  - label `marginBottom`
  - form `marginTop`

**Result:**
✅ Visible spacing between “Enter a dog’s name:” and search input.

---

### 6. Daily Adoptions mobile x-axis readability
**File:** `app/components/InsightsSpotlightTab.tsx`

- Added `isMobileLayout` detection in component.
- Mobile-only axis tuning for Daily Adoptions line chart:
  - Fewer x-axis ticks (`interval` increased on mobile)
  - Short date format (`M/D`) on x-axis labels
  - Full tooltip detail retained (full date + exact count + names)

**Result:**
✅ Mobile x-axis labels are significantly more readable.

---

### 7. Tap/focus black border suppression on Insights charts
**Files:**
- `app/components/InsightsSpotlightTab.tsx`
- `app/page.tsx`
- `app/globals.css`

- Added scoped class wrappers for chart containers requiring suppression.
- Disabled Recharts accessibility focus layer on Daily Adoptions `LineChart`.
- Added strong scoped CSS to suppress tap highlight/focus outlines and border artifacts on chart elements.
- Extended suppression to Insights visualizations except:
  - `ShelterMap`
  - `OwnerSurrenderHeatmap`

**Result:**
✅ Removed tap-triggered thick/thin black border artifacts on targeted Insights visualizations.

---

### 8. Shelter map description clipping fix on mobile
**Files:**
- `app/components/ShelterMap.tsx`
- `app/globals.css`

- Added class to map description text block.
- Added mobile-only CSS override to remove excessive left margin (`margin-left: 0`) under `768px`.

**Result:**
✅ Description text shifts left on mobile and no longer clips on the right side.

---

## Files Modified This Session

- `app/page.tsx`
- `app/components/Tabs.tsx`
- `app/components/AdoptionsTab.tsx`
- `app/components/WheresFidoTab.tsx`
- `app/components/InsightsSpotlightTab.tsx`
- `app/components/ShelterMap.tsx`
- `app/globals.css`

---

## Notes for Next Session

1. If any mobile spacing/offset appears unchanged, verify active viewport width and cached CSS (hard refresh).
2. For mobile-specific behavior in this project, JS breakpoint state (`isMobileLayout`) proved more reliable than some Tailwind breakpoint-only tweaks in prior attempts.
3. Black border suppression is intentionally scoped to Insights chart wrappers and excludes map/heatmap by request.

