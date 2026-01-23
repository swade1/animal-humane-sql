# Task List for Animal Humane Web App Rewrite

## Parent Tasks and Sub-Tasks

### 1. Set up project structure and tech stack
- [x] Create a new Next.js project repository
- [x] Initialize and configure a GitHub repository for the project
- [x] Set up TailwindCSS and Shadcn UI in the Next.js app
- [x] Configure Supabase project and connect to Next.js
- [x] Set up environment variables for Supabase and Vercel
- [x] Configure Vercel deployment for the project
- [x] Set up code linting, formatting, and basic CI

### 2. Implement data scraper and ingestion
- [x] Design Supabase schema for dog data (all required fields)
- [x] Develop a Node.js/TypeScript scraper for animalhumanenm.org and iframes
  - [x] Implement Puppeteer-based dynamic iframe discovery
  - [x] Fetch and log raw HTML from each iframe
  - [x] Parse dog data fields from iframe HTML
  - [x] Map parsed data to Supabase schema structure
  - [x] Handle URL decoding and absolute URL resolution for iframes
  - [x] Add error handling for failed fetches or parsing
  - [x] Test scraper end-to-end and verify output
  - [x] Schedule scraper to run every 2 hours (9am-7pm MST)
  - [x] Monitor scraper runs and handle errors
  - [x] Parse and transform scraped data to match Supabase schema
  - [x] Insert/update dog records in Supabase
  - [x] Implement error handling and logging for scraper
  - [ ] Add support for manual data entry fields (origin, coordinates, bite quarantine, notes)
    - [x] Identify all fields requiring manual entry (origin, latitude, longitude, bite_quarantine, returned, notes)
    - [x] Design and implement UI components for manual data entry in the frontend
    - [x] Add form validation and user feedback for manual fields
    - [x] Implement backend/API logic to update manual fields in Supabase
    - [x] Restrict manual entry/editing to authorized users (developer-only access)
    - [x] Test manual entry workflow end-to-end
    - [x] Document the manual entry process for future maintainers

### 3. Build frontend for data display and manual entry
- [x] Design UI wireframes for dog data display and manual entry
- [x] Outline UI components and pages for each tab based on AH Screenshots directory
- [ ] Implement dog list and detail views (status, location, origin, etc.)
    - [ ] Scaffold DogList and DogDetail components/pages.
    - [ ] Implement data fetching from Supabase for list and detail views.
    - [ ] Build UI for displaying dog info and history (match wireframes).
    - [ ] Add search/filter/sort functionality to the list.
    - [ ] Implement navigation between list and detail views.
    - [ ] Handle loading, error, and empty states.
    - [ ] Add responsive styles and accessibility features.
- [ ] Add clickable dog names linking to public shelter pages
- [ ] Implement manual entry/editing UI (developer-only access)
- [ ] Add authentication for manual entry (developer-only)
- [ ] Ensure responsive and accessible design
- [ ] Add support for additional notes per dog

### 4. Automate deployment and data update workflow
- [ ] Integrate scraper completion with Vercel redeploy trigger
- [ ] Automate deployment pipeline for frontend and backend
- [ ] Test end-to-end data update and redeploy workflow
- [ ] Document deployment and update process

### 5. Migrate and validate existing data
- [ ] Export existing data from Elasticsearch/JSON
- [ ] Write migration scripts to import data into Supabase
- [ ] Validate migrated data for completeness and accuracy
- [ ] Clean up legacy data sources and scripts
- [ ] Document migration process and results

## Relevant Files

- `src/pages/index.tsx` - Main landing page for dog data display
- `src/pages/admin.tsx` - Manual entry/editing UI for developer-only access
- `src/components/DogList.tsx` - Component for listing dogs
- `src/components/DogDetail.tsx` - Component for dog detail view
- `src/utils/scraper.ts` - Scraper logic for animalhumanenm.org
- `src/utils/supabaseClient.ts` - Supabase client and data utilities
- `scripts/migrate-data.ts` - Data migration script from Elasticsearch/JSON to Supabase
- `supabase/schema.sql` - Supabase schema definition
- `vercel.json` - Vercel deployment configuration
- `README.md` - Project setup and documentation

### Notes
- Manual entry/editing is restricted to developer-only users (authentication required)
- Scraper must handle iframe parsing and error conditions robustly
- Data is updated every 2 hours, not in real time
- Migration scripts should be idempotent and safe to re-run
- Ensure accessibility and mobile compatibility throughout the UI
