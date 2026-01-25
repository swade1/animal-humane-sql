"use client";
import { PawPrint } from "lucide-react";
import React, { useState } from "react";
import Tabs from "./components/Tabs";
import OverviewTable from "./components/OverviewTable";
import RecentPupdatesTab from "./components/RecentPupdatesTab";

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
    <div className="min-h-screen bg-white">
      <div className="p-5">
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '60px', marginBottom: '30px', marginLeft: '20px' }}>
          <PawPrint className="text-orange-500" size={28} style={{ marginLeft: '2px' }} />
          <h1
            className="text-2xl font-bold"
            style={{ marginLeft: '5px' }}
          >
            Animal Humane New Mexico: Pet Status and Updates
          </h1>
        </div>
        <div className="p-5">
          <div style={{ marginLeft: '20px' }}>
            <Tabs
              tabs={tabLabels.map((label, idx) => ({
                label,
                active: idx === activeTab,
                onClick: () => setActiveTab(idx),
              }))}
            />
          </div>
          <div style={{ marginTop: '10px', marginLeft: '20px', marginRight: '20px' }}>
            {activeTab === 0 && <OverviewTable />}
            {activeTab === 1 && <RecentPupdatesTab />}
          </div>
          {/* Add other tab content as needed */}
        </div>
      </div>
    </div>
  );
}
