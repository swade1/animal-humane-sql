"use client";
import React, { useState } from 'react';

const TABS = [
  { label: 'Overview', id: 'overview' },
  { label: 'Recent Pupdates', id: 'recent-pupdates' },
  { label: 'Current Population', id: 'current-population' },
  { label: 'Adoptions', id: 'adoptions' },
  { label: 'Insights & Spotlight', id: 'insights-spotlight' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Animal Humane New Mexico: Pet Status and Updates</h1>
        <div className="flex border-b mb-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-200 focus:outline-none ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600'
              }`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-6" role="tabpanel">
          {activeTab === 'overview' && <div className="text-gray-700">Overview content goes here.</div>}
          {activeTab === 'recent-pupdates' && <div className="text-gray-700">Recent Pupdates content goes here.</div>}
          {activeTab === 'current-population' && <div className="text-gray-700">Current Population content goes here.</div>}
          {activeTab === 'adoptions' && <div className="text-gray-700">Adoptions content goes here.</div>}
          {activeTab === 'insights-spotlight' && <div className="text-gray-700">Insights & Spotlight content goes here.</div>}
        </div>
      </div>
    </div>
  );
}
