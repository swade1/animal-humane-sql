# Animal Humane Web App UI Wireframe & Component Outline

## App Layout
- Top-level navigation: Tabbed interface (Overview, Recent Pupdates, Current Population, Adoptions, Insights & Spotlight)
- Consistent header (logo, title, possibly user info)
- Main content area changes with selected tab

---

## Tab 1: Overview
- Components:
  - <OverviewStats /> (summary cards: total dogs, adoptions, etc.)
  - <RecentActivityFeed /> (recent events, updates)
  - <QuickLinks /> (shortcuts to other tabs or actions)

## Tab 2: Recent Pupdates
- Components:
  - <PupdateList /> (list of recent updates, each with dog info, status, date, and notes)
  - <PupdateFilters /> (filter by date, status, etc.)
  - <PupdateDetailModal /> (expand for more info)

## Tab 3: Current Population
- Components:
  - <PopulationTable /> (table/grid of all current dogs, sortable/filterable)
  - <DogDetailDrawer /> (slide-out or modal with full dog details and manual entry fields)
  - <PopulationFilters /> (filter by status, location, etc.)

## Tab 4: Adoptions
- Components:
  - <AdoptionList /> (list of recent adoptions, with dog, date adopted, and length_of_stay_days)

## Tab 5: Insights & Spotlight
- Components:
  - <InsightsCharts /> (charts/graphs: trends, stats)
  - <SpotlightStories /> (featured dogs, success stories)
  - <InsightsFilters /> (date range, type)

---

## Shared/Utility Components
- <Header />
- <TabNav />
- <DogAvatar />
- <DogCard />
- <ManualEntryForm /> (for developer/admins)
- <LoadingSpinner />
- <ErrorBanner />

---

**Notes:**
- Each tab is a page or route (e.g., /overview, /pupdates, /population, /adoptions, /insights).
- Use modals/drawers for detail and edit views to avoid full page reloads.
- Manual entry/editing UI is only visible to authorized users (admin/dev).
- All lists/tables should support filtering and searching.
