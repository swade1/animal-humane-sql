import React from "react";

type Tab = {
  label: string;
  active: boolean;
  onClick: () => void;
};

type TabsProps = {
  tabs: Tab[];
  isMobileLayout?: boolean;
};

export default function Tabs({ tabs, isMobileLayout = false }: TabsProps) {
  return (
    <div
      className="mb-3"
      style={{
        display: isMobileLayout ? "flex" : "block",
        flexWrap: isMobileLayout ? "wrap" : undefined,
        rowGap: isMobileLayout ? "8px" : undefined,
        paddingTop: isMobileLayout ? "8px" : undefined,
        paddingBottom: isMobileLayout ? "8px" : undefined,
      }}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.label}
          className="mr-2 rounded border-none cursor-pointer"
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
