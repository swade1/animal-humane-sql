// Folder structure for Animal Humane Web App (Next.js)

app/
  src/
    components/
      Header.tsx
      TabNav.tsx
      OverviewStats.tsx
      RecentActivityFeed.tsx
      QuickLinks.tsx
      PupdateList.tsx
      PupdateFilters.tsx
      PupdateDetailModal.tsx
      PopulationTable.tsx
      DogDetailDrawer.tsx
      PopulationFilters.tsx
      AdoptionList.tsx
      InsightsCharts.tsx
      SpotlightStories.tsx
      InsightsFilters.tsx
      DogAvatar.tsx
      DogCard.tsx
      ManualEntryForm.tsx
      LoadingSpinner.tsx
      ErrorBanner.tsx
    pages/
      overview.tsx
      pupdates.tsx
      population.tsx
      adoptions.tsx
      insights.tsx
    lib/
      supabaseClient.ts
      types.ts
      utils.ts
    styles/
      globals.css
      tailwind.css
  public/
    logo.png
    favicon.ico
    ...
  .env
  .env.local
  next.config.js
  tailwind.config.js
  postcss.config.mjs
  tsconfig.json
  package.json

// Starter code for main pages

// app/src/pages/overview.tsx
import Header from '../components/Header';
import TabNav from '../components/TabNav';
import OverviewStats from '../components/OverviewStats';
import RecentActivityFeed from '../components/RecentActivityFeed';
import QuickLinks from '../components/QuickLinks';

export default function OverviewPage() {
  return (
    <>
      <Header />
      <TabNav />
      <main className="p-4">
        <OverviewStats />
        <RecentActivityFeed />
        <QuickLinks />
      </main>
    </>
  );
}

// app/src/pages/pupdates.tsx
import Header from '../components/Header';
import TabNav from '../components/TabNav';
import PupdateList from '../components/PupdateList';
import PupdateFilters from '../components/PupdateFilters';

export default function PupdatesPage() {
  return (
    <>
      <Header />
      <TabNav />
      <main className="p-4">
        <PupdateFilters />
        <PupdateList />
      </main>
    </>
  );
}

// app/src/pages/population.tsx
import Header from '../components/Header';
import TabNav from '../components/TabNav';
import PopulationTable from '../components/PopulationTable';
import PopulationFilters from '../components/PopulationFilters';

export default function PopulationPage() {
  return (
    <>
      <Header />
      <TabNav />
      <main className="p-4">
        <PopulationFilters />
        <PopulationTable />
      </main>
    </>
  );
}

// app/src/pages/adoptions.tsx
import Header from '../components/Header';
import TabNav from '../components/TabNav';
import AdoptionList from '../components/AdoptionList';

export default function AdoptionsPage() {
  return (
    <>
      <Header />
      <TabNav />
      <main className="p-4">
        <AdoptionList />
      </main>
    </>
  );
}

// app/src/pages/insights.tsx
import Header from '../components/Header';
import TabNav from '../components/TabNav';
import InsightsCharts from '../components/InsightsCharts';
import SpotlightStories from '../components/SpotlightStories';
import InsightsFilters from '../components/InsightsFilters';

export default function InsightsPage() {
  return (
    <>
      <Header />
      <TabNav />
      <main className="p-4">
        <InsightsFilters />
        <InsightsCharts />
        <SpotlightStories />
      </main>
    </>
  );
}
