# PRD: Animal Humane Web App Rewrite

## Introduction/Overview
The goal is to rebuild the Animal Humane Albuquerque web app to be robust, extensible, and easier to maintain. The current app scrapes animalhumanenm.org and its iframes, aggregates and summarizes dog data, and displays it on a Vercel-hosted site. The new app will use Next.js, Shadcn, TailwindCSS (frontend), and Supabase (database), replacing the brittle Elasticsearch and static JSON file approach.

## Goals
1. Provide reliable, regularly updated dog status and data for the shelter.
2. Make manual data entry (origin, bite quarantine, coordinates) easier and more robust.
3. Enable easy extension and modification of queries and features.
4. Improve deployment and update automation.
5. Enhance user experience and maintainability.

## User Stories
- As a shelter volunteer, I want to track dogs that no longer appear on the website or are no longer present in the shelter.
- As a shelter volunteer, I want to see up-to-date dog status, location, and details 
- As a shelter volunteer, I want to track overall shelter data such as number of adoptions, euthanizations, etc.
- As a developer, I want to add new features or change queries without deep code changes.
- As a developer, I want to update dog origin and bite quarantine info easily so the website stays accurate.

## Functional Requirements
1. The system must scrape animalhumanenm.org and its iframes every 2 hours (9am-7pm MST).
2. The system must store scraped and manual data in Supabase.
3. The frontend must display dog data, including status, location, origin, bite quarantine, and coordinates.
4. The system must allow manual entry/editing of origin, coordinates, and bite quarantine per dog.
5. The frontend must provide clickable dog names linking to their public shelter page.
6. The system must automate deployment on data update (Vercel integration).
7. The frontend must use Next.js, Shadcn, and TailwindCSS for UI.
8. The backend must use Supabase for data storage and queries.
9. The system must calculate and display length of stay and age group dynamically.
10. The system must permit manual entry of additional notes.

## Non-Goals (Out of Scope)
- Real-time live updates (data is updated every 2 hours, not instantly).
- Support for species other than dogs.
- Advanced analytics or reporting features.
- Integration with legacy Elasticsearch or static JSON files.

## Design Considerations
- Use Shadcn and TailwindCSS for a modern, responsive UI.
- Ensure accessibility and mobile compatibility.
- Provide clear UI for manual data entry and editing.

## Technical Considerations
- Scraper must handle iframe parsing and error conditions.
- Supabase schema should support all required fields (see Animal Humane AI Rewrite.md).
- Deployment pipeline should trigger Vercel redeploys on data update.
- Migration plan for existing data from Elasticsearch/JSON to Supabase.

## Success Metrics
- 99% uptime and reliability for data updates and site availability.
- Manual data entry errors reduced by 90%.
- Feature additions/changes require <50% less developer effort.
- Positive feedback from site visitors.

## Open Questions
- Should manual data entry be restricted to authenticated users? 
    - Yes. Manual data entry should be restricted to developer only.
- Is there a need for audit logs or change history for manual edits?
    - No
- Any plans to support other species or expand to other shelters?
    - No
- Preferred authentication method for developer?
    - Password
