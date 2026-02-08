"use client";
import { PawPrint } from "lucide-react";
import React, { useState } from "react";
import Tabs from "./components/Tabs";
import OverviewUnitChart from "./components/OverviewUnitChart";
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
// import LengthOfStayByAgeGroupChart from "./components/LengthOfStayByAgeGroupChart";
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

  const handleLogout = () => {
    sessionStorage.removeItem('sessionToken');
    window.location.reload();
  };

  return (
    <PasswordProtection>
      <div className="min-h-screen bg-white">
      <div className="p-5">
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', marginBottom: '30px', marginLeft: '20px', justifyContent: 'space-between', marginRight: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <PawPrint className="text-orange-500" size={28} style={{ marginLeft: '10px', marginTop: '-6px', transform: 'rotate(-90deg)', position: 'relative' }} />
            <h1
              className="text-2xl font-bold"
              style={{ marginLeft: '5px' }}
            >
              Animal Humane New Mexico: Pet Status and Updates
            </h1>
          </div>
          {activeTab === 0 && (
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              Logout
            </button>
          )}
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
          <div style={{ marginTop: '10px', marginBottom: 0 }}>
            {/* Responsive wrapper for Overview tab */}
            {activeTab === 0 && (
              <div className="overview-scroll-wrapper">
                <OverviewUnitChart />
              </div>
            )}
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

                <div style={{ 
                     marginTop: 32, 
                     display: 'flex', 
                     flexDirection: 'row', 
                     gap: 32, 
                     alignItems: 'flex-start' 
                 }}>
                    <div style={{ flex: 1, minWidth: 0}}>
                      <LengthOfStayHistogram />
                    </div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Average length of stay bar chart by age group */}
                     <AverageLengthOfStayByAgeGroupChart />
                   </div>
                </div>

                {/*<div style={{ marginTop: 32, display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>*/}
                  {/*<div style={{ flex: 1, minWidth: 0 }}>*/}
                    {/* Grouped bar chart for length of stay by age group */}
                    { /*<LengthOfStayByAgeGroupChart />*/}
                  {/*</div>*/}
                  {/*<div style={{ flex: 1, minWidth: 0 }}>*/}
                    {/* Average length of stay bar chart by age group */}
                    {/*<AverageLengthOfStayByAgeGroupChart />*/}
                  {/*</div>*/}
                {/*</div>*/}
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
