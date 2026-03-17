"use client";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import React from "react";

// Type for dog with age_group
type DogWithAge = {
  id: number;
  name: string;
  age_group: string | null;
  location?: string;
  status?: string | null;
  notes?: string;
};

// Helper function to get color based on age_group
const getColorForAgeGroup = (ageGroup: string | null): string => {
  if (!ageGroup) return "#9ca3af"; // gray for null/undefined
  switch (ageGroup.toLowerCase()) {
    case "puppy":
      return "#ef4444"; // red
    case "adult":
      return "#2563eb"; // blue
    case "senior":
      return "#22c55e"; // green
    default:
      return "#9ca3af"; // gray for unexpected values
  }
};

// Helper function to sort dogs by age_group (Puppy, Adult, Senior, then null/other)
const sortDogsByAgeGroup = (dogs: DogWithAge[]): DogWithAge[] => {
  const ageOrder: Record<string, number> = {
    puppy: 1,
    adult: 2,
    senior: 3,
  };
  
  return [...dogs].sort((a, b) => {
    const aOrder = a.age_group ? (ageOrder[a.age_group.toLowerCase()] || 999) : 999;
    const bOrder = b.age_group ? (ageOrder[b.age_group.toLowerCase()] || 999) : 999;
    return aOrder - bOrder;
  });
};

export default function OverviewUnitChart() {
  // Square icon component - now accepts color and name props with custom tooltip
  const Square = ({ color, name }: { color: string; name?: string }) => (
    <span 
      title={name || 'Unknown'}
      className="dog-square"
      data-name={name || 'Unknown'}
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        margin: "0 2px",
        background: color,
        borderRadius: 3,
        cursor: 'help',
        position: 'relative',
      }} 
    />
  );

  // Legend component
  const Legend = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginTop: '20px',
      marginBottom: '8px',
      fontSize: '0.9rem',
      color: '#6b7280',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Square color="#ef4444" name="Puppies" />
        <span>Puppies</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Square color="#2563eb" name="Adults" />
        <span>Adults</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Square color="#22c55e" name="Seniors" />
        <span>Seniors</span>
      </div>
    </div>
  );

  // Fetch Available Soon dogs with age_group
  const { data: availableSoonDogs, isLoading: loadingAvailableSoon } = useQuery({
    queryKey: ['availableSoonDogsWithAge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, location, status, notes, age_group')
        .is('status', null);
      if (error || !data) return { fosterHome: [], onsite: [] };
      
      // Match Recent Pupdates logic: Available Soon in notes, exclude Trial Adoption
      const availableSoon = data.filter(dog => {
        const isAvailableSoon = typeof dog.notes === 'string' && dog.notes.includes('Available Soon');
        const isTrialAdoption = typeof dog.location === 'string' && dog.location.includes('Trial Adoption');
        return isAvailableSoon && !isTrialAdoption;
      });
      
      const fosterHome = availableSoon.filter(dog => 
        typeof dog.location === 'string' && dog.location.toLowerCase() === 'foster home'
      );
      
      const onsite = availableSoon.filter(dog =>
        !fosterHome.includes(dog)
      );
      
      return { 
        fosterHome: sortDogsByAgeGroup(fosterHome), 
        onsite: sortDogsByAgeGroup(onsite)
      };
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  // Fetch available dogs on website from latest_scraped_ids.json with age_group
  const { data: availableDogs, isLoading: loadingAvailable } = useQuery({
    queryKey: ['availableDogsWithAge'],
    queryFn: async () => {
      try {
        const res = await fetch('/latest_scraped_ids.json');
        if (!res.ok) return [];
        const ids = await res.json();
        if (!Array.isArray(ids) || ids.length === 0) return [];
        
        // Fetch dogs with these IDs
        const { data, error } = await supabase
          .from('dogs')
          .select('id, name, age_group')
          .in('id', ids);
        
        if (error || !data) return [];
        return sortDogsByAgeGroup(data);
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  // Fetch temporarily unlisted dogs with age_group
  const { data: temporarilyUnlistedDogs, isLoading: loadingUnlisted } = useQuery({
    queryKey: ['temporarilyUnlistedDogsWithAge'],
    queryFn: async () => {
      // Fetch scraped IDs from public/latest_scraped_ids.json
      let scrapedIds: number[] = [];
      try {
        const res = await fetch('/latest_scraped_ids.json');
        if (res.ok) {
          const ids = await res.json();
          if (Array.isArray(ids)) scrapedIds = ids;
        }
      } catch {}
      
      // Get all available dogs with non-empty location and age_group
      const { data: allAvailable, error: errorAvailable } = await supabase
        .from('dogs')
        .select('id, name, location, age_group')
        .eq('status', 'available');
      if (errorAvailable || !allAvailable) return [];
      
      // Exclude dogs on website and those in Trial Adoption
      const scrapedIdSet = new Set(scrapedIds.map(id => Number(id)));
      const filtered = allAvailable.filter(dog => {
        if (!dog.location || dog.location.includes('Trial Adoption')) return false;
        return !scrapedIdSet.has(Number(dog.id));
      });
      
      return sortDogsByAgeGroup(filtered);
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  // Fetch all dogs with location info, status, and age_group
  const { data: allDogsWithLocation, isLoading: loadingLocations } = useQuery({
    queryKey: ['allDogsWithLocationAndAge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, location, status, age_group');
      return error || !data ? [] : data;
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  // Trial Adoption (location contains 'Trial Adoption', regardless of status)
  const trialAdoptionDogs = sortDogsByAgeGroup(
    allDogsWithLocation?.filter(dog => dog.location?.includes('Trial Adoption')) || []
  );

  // Compose categories with dog arrays and sort descending by count
  const categories = [
    { label: "Listed on Website", dogs: availableDogs ?? [] },
    { label: "Temporarily Unlisted", dogs: temporarilyUnlistedDogs ?? [] },
    { label: "Available Soon (Foster)", dogs: availableSoonDogs?.fosterHome ?? [] },
    { label: "Available Soon (Onsite)", dogs: availableSoonDogs?.onsite ?? [] },
    { label: "Trial Adoption", dogs: trialAdoptionDogs },
  ].sort((a, b) => b.dogs.length - a.dogs.length);

  // Find max label length for right alignment
  const maxLabelLength = Math.max(...categories.map(c => c.label.length));

  const loading = loadingAvailable || loadingUnlisted || loadingLocations || loadingAvailableSoon;

  return (
    <div
      className="overview-unit-chart border border-[#ccc] p-4 rounded bg-[#fafafa]"
      style={{ padding: "24px" }}
    >
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '4px' }}>Shelter Overview</h2>
      </div>
      
      {/* Legend */}
      <Legend />
      
      {/* Responsive scrollable container for mobile */}
      <div
        style={{
          marginTop: '28px',
          marginLeft: '-24px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100vw',
        }}
      >
        <div style={{ minWidth: 320 }}>
          {loading ? (
            <div style={{ color: '#888', fontSize: '1.1rem', marginBottom: 12 }}>Loading...</div>
          ) : (
            categories.map(({ label, dogs }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 12,
                  fontSize: "1.1rem",
                  flexWrap: 'nowrap',
                }}
              >
                {/* Right-justified label */}
                <div
                  style={{
                    minWidth: `${maxLabelLength + 2}ch`,
                    textAlign: "right",
                    fontWeight: 600,
                    color: "#374151",
                    marginRight: 16,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </div>
                {/* Count */}
                <div style={{ minWidth: "2ch", fontWeight: 700, marginRight: 8 }}>
                  {dogs.length}
                </div>
                {/* Squares/icons - colored by age_group */}
                <div
                  style={{
                    overflowX: 'auto',
                    display: 'flex',
                    flexWrap: 'nowrap',
                    minWidth: Math.max(120, dogs.length * 18),
                    maxWidth: '100vw',
                  }}
                >
                  {dogs.map((dog, i) => (
                    <Square key={`${dog.id}-${i}`} color={getColorForAgeGroup(dog.age_group)} name={dog.name} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}