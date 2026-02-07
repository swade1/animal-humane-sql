"use client";
import { PawPrint } from "lucide-react";
import React, { useState } from "react";
import Tabs from "./components/Tabs";
import OverviewTable from "./components/OverviewTable";
import RecentPupdatesTab from "./components/RecentPupdatesTab";
import CurrentPopulationTab from "./components/CurrentPopulationTab";
import AdoptionsTab from "./components/AdoptionsTab";
import InsightsSpotlightTab from "./components/InsightsSpotlightTab";
import ShelterMap from "./components/ShelterMap";
import ShelterBarChart from "./components/ShelterBarChart";
import ShelterTransferChart from "./components/ShelterTransferChart";
// ...existing code...
import OwnerSurrenderHeatmap from "./components/OwnerSurrenderHeatmap";
import LengthOfStayHistogram from "./components/LengthOfStayHistogram";
import LengthOfStayByAgeGroupChart from "./components/LengthOfStayByAgeGroupChart";
import AverageLengthOfStayByAgeGroupChart from "./components/AverageLengthOfStayByAgeGroupChart";
import PasswordProtection from "./components/PasswordProtection";

const tabLabels = [
  "Overview",
  "Recent Pupdates",
  "Current Population",
  "Adoptions",
  "Insights & Spotlight",
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <PasswordProtection>
      <div className="min-h-screen bg-white">
      <div className="p-5">
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '60px', marginBottom: '30px', marginLeft: '20px' }}>
          <PawPrint className="text-orange-500" size={28} style={{ marginLeft: '10px', marginTop: '-6px', transform: 'rotate(-90deg)', position: 'relative' }} />
          <h1
            className="text-2xl font-bold"
            style={{ marginLeft: '5px' }}
          >
            Animal Humane New Mexico: Pet Status and Updates
          </h1>
        </div>
        <div className="p-5">
          <div style={{ marginLeft: '20px', marginTop: 0, marginBottom: 0 }}>
            <Tabs
              tabs={tabLabels.map((label, idx) => ({
                label,
                active: idx === activeTab,
                onClick: () => setActiveTab(idx),
              }))}
            />
          </div>
          <div style={{ marginTop: '10px', marginLeft: '20px', marginRight: '20px', marginBottom: 0 }}>
            {activeTab === 0 && <OverviewTable />}
            {activeTab === 1 && <RecentPupdatesTab />}
            {activeTab === 2 && <CurrentPopulationTab />}
            {activeTab === 3 && <AdoptionsTab />}
            {activeTab === 4 && (
              <>
                <InsightsSpotlightTab />
                <div style={{ marginTop: 40, display: "flex", flexDirection: "row", alignItems: "flex-end", gap: 32 }}>
                  <ShelterMap />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '600px', maxWidth: '100%' }}>
                    <ShelterBarChart />
                    <div style={{ marginTop: 32 }}>
                      <OwnerSurrenderHeatmap />
                    </div>
                  </div>
                </div>
                <div style={{ clear: 'both', width: '100%' }}>
                  <ShelterTransferChart />
                </div>
                <div style={{ marginTop: 32 }}>
                  <LengthOfStayHistogram />
                </div>
                <div style={{ marginTop: 32, display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Grouped bar chart for length of stay by age group */}
                    <LengthOfStayByAgeGroupChart />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Average length of stay bar chart by age group */}
                    <AverageLengthOfStayByAgeGroupChart />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Add other tab content as needed */}
        </div>
      </div>
    </div>
    </PasswordProtection>
  );
}
