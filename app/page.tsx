"use client";
import { PawPrint } from "lucide-react";
import React, { useEffect, useState } from "react";
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
import AverageLengthOfStayByAgeGroupChart from "./components/AverageLengthOfStayByAgeGroupChart";
import WheresFidoTab from "./components/WheresFidoTab";

const tabLabels = [
  "Overview",
  "Recent Pupdates",
  "Current Population",
  "Adoptions",
  "Insights & Spotlight",
  "Where's Fido?",
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const updateLayoutMode = () => {
      setIsMobileLayout(window.innerWidth <= 768);
    };

    updateLayoutMode();
    window.addEventListener('resize', updateLayoutMode);
    return () => window.removeEventListener('resize', updateLayoutMode);
  }, []);

  return (
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
            {activeTab === 0 && <OverviewUnitChart />}
            {activeTab === 1 && <RecentPupdatesTab />}
            {activeTab === 2 && <CurrentPopulationTab />}
            {activeTab === 3 && <AdoptionsTab />}
            {activeTab === 4 && (
              <>
                <InsightsSpotlightTab />
                <div
                  style={{
                    marginTop: 40,
                    width: '100%',
                    overflowX: isMobileLayout ? 'visible' : 'auto',
                    WebkitOverflowScrolling: isMobileLayout ? undefined : 'touch',
                  }}
                >
                  <div style={{ minWidth: isMobileLayout ? undefined : '940px' }}>
                    <ShelterMap />
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 32,
                    width: '100%',
                    overflowX: isMobileLayout ? 'visible' : 'auto',
                    WebkitOverflowScrolling: isMobileLayout ? undefined : 'touch',
                  }}
                >
                  <div
                    style={{
                      minWidth: isMobileLayout ? undefined : '1240px',
                      display: 'flex',
                      flexDirection: isMobileLayout ? 'column' : 'row',
                      alignItems: isMobileLayout ? 'center' : 'flex-end',
                      gap: isMobileLayout ? 24 : 32,
                    }}
                  >
                    <div style={{ width: isMobileLayout ? '100%' : '600px', maxWidth: '600px', flexShrink: 0 }}>
                      <ShelterBarChart />
                    </div>
                    <div style={{ width: isMobileLayout ? '100%' : '600px', maxWidth: '600px', flexShrink: 0 }}>
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
                <div style={{ marginTop: 32 }}>
                  {/* Average length of stay bar chart by age group */}
                  <AverageLengthOfStayByAgeGroupChart />
                </div>
              </>
            )}
            {activeTab === 5 && <WheresFidoTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
