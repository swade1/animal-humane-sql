import React from "react";

type Tab = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="mb-3 py-2 md:py-0 max-md:flex max-md:flex-wrap max-md:gap-y-2">
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          className="mr-2 mb-0 rounded border-none cursor-pointer"
          style={{
            backgroundColor: tab.active ? "#007bff" : "#f0f0f0",
            color: tab.active ? "white" : "black",
            border: "none",
            borderRadius: "4px",
            marginRight: "8px",
            padding: "8px 16px",
            fontSize: "0.95rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
          onClick={tab.onClick}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
