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
    - [x] Scaffold DogList and DogDetail components/pages.
    - [x] Implement data fetching from Supabase for list and detail views.
    - [x] Build UI for displaying dog info and history (match wireframes).
    - [ ] Add search/filter/sort functionality to the list.
    - [x] Implement navigation between list and detail views.
    - [x] Handle loading, error, and empty states.
    - [x] Add responsive styles and accessibility features.
- [x] Add clickable dog names linking to public shelter pages
- [x] Implement manual entry/editing UI (developer-only access)
- [x] Add authentication for manual entry (developer-only)
- [ ] Ensure responsive and accessible design
- [x] Add support for additional notes per dog

### 4. Implement an Admin Interface [x]
 - [x] Design admin interface for on-site shelter updates
  - [x] Create wireframes for admin UI layout and workflows
  - [x] Define user roles and permissions (admin vs. developer)
  - [x] Plan mobile-first design for tablet/phone use at shelter
 - [x] Implement authentication and authorization
   - [x] Set up Supabase Auth or alternative authentication system
  - [x] Create login/logout UI and session management
   - [x] Implement role-based access control (RBAC)
  - [x] Add security middleware to protect admin routes
 - [x] Build admin dashboard and dog management interface
   - [x] Create admin homepage with quick stats and recent activity
   - [x] Implement dog list view with search, filter, and sort
   - [x] Build dog edit form for updating all fields
   - [x] Add quick-action buttons (mark adopted, returned, etc.)
 - [x] Implement adoption workflow
   - [x] Create adoption form with date picker (defaults to today in MST)
   - [x] Add validation to ensure adopted_date is stored as MST date
   - [x] Implement status change to 'adopted' with history tracking
   - [x] Add confirmation dialog for adoption actions
 - [x] Implement return workflow
   - [x] Create return form with reason and notes fields
   - [x] Add validation and date handling for return events
   - [x] Implement status change to 'available' with history tracking
   - [x] Add confirmation dialog for return actions
 - [x] Implement status and location management
   - [x] Create UI for updating dog status (available, adopted, trial, etc.)
   - [x] Add location picker/editor for kennel assignments
   - [x] Implement bulk status/location updates for multiple dogs
   - [x] Add history tracking for all status and location changes
 - [x] Implement manual field editing
   - [x] Create forms for origin, coordinates, bite quarantine, notes
   - [x] Add rich text editor for notes field
   - [x] Implement validation and save logic for manual fields
   - [x] Add audit trail for manual field changes
 - [x] Add real-time data updates
   - [x] Implement optimistic UI updates for quick feedback
   - [x] Add data refresh/sync mechanism with Supabase
   - [x] Handle concurrent edits and data conflicts
   - [x] Display last updated timestamp for each dog
 - [x] Implement activity log and audit trail
   - [x] Create activity log view showing recent changes
   - [x] Add filtering and search for audit trail
   - [x] Display user, timestamp, and change details for each action
   - [x] Implement export functionality for audit data
 - [x] Test and validate admin interface
   - [x] Test all CRUD operations on dog records
   - [x] Validate date/time handling for MST timezone
   - [x] Test mobile responsiveness and usability
   - [x] Perform security audit and penetration testing
   - [x] User acceptance testing with shelter staff

### 5. Automate deployment and data update workflow
- [x] Integrate scraper completion with Vercel redeploy trigger
- [ ] Automate deployment pipeline for frontend and backend
- [x] Test end-to-end data update and redeploy workflow
- [ ] Document deployment and update process

### 6. Migrate and validate existing data
- [ ] Export existing data from Elasticsearch/JSON
- [ ] Write migration scripts to import data into Supabase
- [ ] Validate migrated data for completeness and accuracy
- [ ] Clean up legacy data sources and scripts
- [ ] Document migration process and results


## Relevant Files

- `src/pages/index.tsx` - Main landing page for dog data display
- `src/pages/admin.tsx` - Manual entry/editing UI for developer-only access
- `app/admin/page.tsx` - Admin interface for on-site shelter updates
- `src/components/DogList.tsx` - Component for listing dogs
- `src/components/DogDetail.tsx` - Component for dog detail view
- `app/components/AdminDashboard.tsx` - Admin dashboard component
- `app/components/DogEditForm.tsx` - Dog edit form component
- `src/utils/scraper.ts` - Scraper logic for animalhumanenm.org
- `src/utils/supabaseClient.ts` - Supabase client and data utilities
- `scripts/migrate-data.ts` - Data migration script from Elasticsearch/JSON to Supabase
- `supabase/schema.sql` - Supabase schema definition
- `vercel.json` - Vercel deployment configuration
- `README.md` - Project setup and documentation

### Notes
-
---
## Admin User Interface Documentation

### Accessing the Admin Interface
- Navigate to `/admin` in your deployed site or local development environment.
- Log in using your registered email and password (Supabase Auth).
- Only users with admin or developer roles will see admin features.

### Main Features
- **Dashboard:** View quick stats (available, adopted, trial, returned) and recent activity.
- **Dog List:** Search, filter, and sort dogs. Select one or multiple dogs for bulk actions.
- **Dog Edit Form:** Update all dog fields (status, location, origin, coordinates, bite quarantine, notes). Use quick-action buttons for adoption/return.
- **Adoption Workflow:** Mark a dog as adopted, select adoption date (defaults to today in MST), confirm action.
- **Return Workflow:** Mark a dog as returned, enter reason/notes, select date, confirm action.
- **Manual Field Editing:** Edit origin, coordinates, bite quarantine, and notes. Notes support rich text.
- **Status/Location Management:** Update status and location for individual or multiple dogs. Assign kennels/areas.
- **Activity Log:** View recent changes, filter/search by user/action/date, export to CSV.

### Mobile/Tablet Use
- The interface is fully responsive and optimized for touch input.
- Large buttons, collapsible menus, and swipe actions for easy navigation.

### Security & Roles
- Only authenticated users with admin or developer roles can access admin features.
- Role-based access control hides or disables features based on user role.

### Troubleshooting
- If you cannot log in, check your credentials or contact a developer for account setup.
- For permission issues, verify your user role in Supabase.
- For UI bugs or errors, refresh the page or report the issue to the development team.

### Support
- For help, contact the project maintainer or developer listed in the README.md.
- **Testing & Validation:**
  - Test all CRUD operations (create, read, update, delete) for dog records
  - Validate date/time handling for MST timezone in all workflows
  - Test mobile responsiveness and usability on multiple devices
  - Perform security audit and penetration testing of admin features
  - Conduct user acceptance testing with shelter staff and collect feedback
- **Activity Log & Audit Trail:**
  - Activity log view: list of recent changes (adoptions, returns, edits, manual field updates)
  - Filter and search by user, action, date/time
  - Display user, timestamp, and change details for each action
  - Export audit data to CSV for reporting
  - Audit trail stored in Supabase for all admin actions
- **Real-Time Data Updates:**
  - Optimistic UI updates: show changes immediately, rollback on error
  - Data refresh/sync: use Supabase subscriptions or polling for updates
  - Handle concurrent edits: detect conflicts, prompt user to resolve
  - Display last updated timestamp for each dog record
  - Responsive design for mobile/tablet use
- **Manual Field Editing:**
  - Forms for editing origin, coordinates, bite quarantine, notes
  - Rich text editor for notes field (markdown or WYSIWYG)
  - Validation for required fields and correct formats
  - Save logic: update Supabase and refresh UI
  - Audit trail: log all manual field changes with user, timestamp, and details
- **Status and Location Management:**
  - UI for updating dog status (available, adopted, trial, returned, etc.)
  - Location picker/editor for assigning kennels or areas
  - Bulk update feature for status/location changes on multiple dogs
  - History tracking: log all status and location changes with user, timestamp, and details
  - Responsive design for mobile/tablet use
- **Return Workflow:**
  - Return form: select dog, reason field, notes field, date picker (defaults to today, MST)
  - Validation: required fields, correct date handling for MST
  - Status change: update dog status to 'available', record in history table
  - Confirmation dialog before finalizing return
  - UI feedback for success/error
  - History tracking: log return event with user, timestamp, reason, and details
- **Adoption Workflow:**
  - Adoption form: select dog, date picker (defaults to today, MST timezone)
  - Validation: ensure adopted_date is stored as MST date, required fields
  - Status change: update dog status to 'adopted', record in history table
  - Confirmation dialog before finalizing adoption
  - UI feedback for success/error
  - History tracking: log adoption event with user, timestamp, and details
- **Admin Dashboard & Dog Management Interface:**
  - Dashboard homepage: quick stats (# available, adopted, trial, returned), recent activity feed
  - Dog list: searchable, filterable, sortable table/grid with bulk actions
  - Dog edit form: update all fields (status, location, origin, coordinates, bite quarantine, notes)
  - Quick-action buttons: mark adopted, mark returned, update location, save/cancel
  - Responsive design for mobile/tablet use
  - History panel for each dog: recent changes and actions
- **Security Middleware for Admin Routes:**
  - Middleware checks JWT/session validity and user role before allowing access
  - Protects all admin API endpoints and page routes
  - Returns 401/403 error for unauthorized or unauthenticated requests
  - Logs all access attempts and errors for audit trail
  - Integrates with RBAC logic for fine-grained control
  - Can be extended for rate limiting and IP allowlisting
- **Role-Based Access Control (RBAC):**
  - Roles (admin, developer) stored in Supabase user metadata or roles table
  - On login, fetch user role and store in session
  - Frontend: show/hide UI features based on role
  - Backend/API: check role before processing sensitive requests
  - Middleware for API routes to enforce RBAC
  - Unauthorized actions return error and feedback to user
  - Audit log for role changes and access attempts
- **Login/Logout UI & Session Management:**
  - Login modal or dedicated page with email/password fields
  - Error handling: invalid credentials, network issues, feedback messages
  - Session management: store JWT in secure cookie or localStorage
  - Auto-logout after inactivity or session expiration
  - Logout button in top bar/profile menu
  - UI updates based on login state (show/hide admin features)
  - Redirect to login page if not authenticated
  - Password reset and account recovery links
- **Supabase Auth Setup Steps:**
  1. Enable Supabase Auth in Supabase project dashboard
  2. Configure email/password provider (optionally OAuth for Google, etc.)
  3. Set up environment variables for Supabase URL and anon/public key in Next.js
  4. Integrate Supabase client in frontend (src/utils/supabaseClient.ts)
  5. Implement registration, login, logout, and session management in UI
  6. Store user roles in user metadata or roles table
  7. Test authentication flows and error handling
- **Authentication & Authorization Implementation:**
  - Use Supabase Auth for user registration, login, and session management
  - Login/logout UI: modal or dedicated page, with error handling and feedback
  - Store user roles in Supabase user metadata or roles table
  - Role-based access control (RBAC) enforced in frontend and backend
  - Security middleware: protect admin routes, check JWT and user role
  - Session timeout and auto-logout for inactive users
  - Password reset and account recovery flows
  - Audit log for authentication events (login, logout, failed attempts)
- **Mobile-First Design Principles:**
  - Responsive layout using CSS grid/flexbox and Tailwind utilities
  - Large touch targets for all buttons and controls
  - Minimal navigation: collapsible menus, swipe actions, floating action buttons
  - Forms optimized for touch input (date pickers, dropdowns, toggles)
  - Adaptive font sizes and spacing for readability
  - Quick access to key actions (adopt, return, edit, save)
  - Offline-friendly: local caching and sync when reconnected
  - Accessibility: color contrast, ARIA labels, keyboard navigation
  - Tested on iPad, iPhone, Android tablets/phones
- **User Roles and Permissions:**
  - **Admin:**
    - Can view and update dog records (status, location, adoption, return, manual fields)
    - Can access dashboard, dog list, dog edit, activity log
    - Can perform bulk actions and manage manual fields
    - Cannot access developer-only features (schema changes, migration, advanced settings)
  - **Developer:**
    - Full access to all admin features
    - Can manage schema, migration scripts, advanced settings
    - Can impersonate admin users for testing
  - **Role Management:**
    - Roles stored in Supabase Auth user metadata or dedicated roles table
    - Role checked on login and enforced in frontend and backend API
    - UI adapts to show/hide features based on role
    - Security middleware protects sensitive routes and actions
- Admin UI Wireframe Outlines:
  - **Dashboard:**
    - Top bar: Shelter logo, user profile, logout
    - Quick stats: # available, # adopted, # in trial, # returned
    - Recent activity: List of last 10 changes (adoptions, returns, edits)
    - Navigation: Links to Dog List, Activity Log, Manual Fields
  - **Dog List:**
    - Table/grid: Name, status, location, origin, quick actions
    - Search/filter/sort controls
    - Bulk select and bulk actions (status/location)
    - Pagination or infinite scroll
  - **Dog Edit Form:**
    - Editable fields: name, status, location, origin, coordinates, bite quarantine, notes
    - Quick-action buttons: Mark adopted, mark returned, update location
    - Save/cancel, validation, confirmation dialogs
    - History panel: Show recent changes for this dog
  - **Adoption/Return Workflow:**
    - Date picker (defaults to today in MST)
    - Status change logic, confirmation dialog
    - History tracking for all status changes
  - **Manual Field Editing:**
    - Rich text editor for notes
    - Forms for origin, coordinates, bite quarantine
    - Audit trail for manual field changes
  - **Activity Log:**
    - List of recent changes (who, what, when)
    - Filter/search by user, action, date
    - Export to CSV
  - **Mobile-first Design:**
    - Responsive layout for tablets/phones
    - Large touch targets, minimal navigation
    - Collapsible menus, swipe actions
- Admin interface wireframe concept:
  - Dashboard: Quick stats, recent activity, and navigation to dog management
  - Dog List: Search, filter, sort, and bulk actions
  - Dog Edit: Form for updating all fields, quick-action buttons (adopt, return, etc.)
  - Adoption/Return Workflow: Date picker (MST), confirmation dialogs, history tracking
  - Manual Fields: Rich text notes, origin, coordinates, bite quarantine
  - Activity Log: Recent changes, audit trail, export
  - Mobile-first: Responsive layout for tablets/phones, large touch targets, minimal navigation
- Manual entry/editing is restricted to developer-only users (authentication required)
- Admin interface must be mobile-friendly for on-site use at shelter
- All adoption dates must be stored as MST dates to avoid timezone issues
- Scraper must handle iframe parsing and error conditions robustly
- Data is updated every 2 hours, not in real time
- Migration scripts should be idempotent and safe to re-run
- Ensure accessibility and mobile compatibility throughout the UI
- Admin interface requires authentication and role-based access control
