"use client";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import React from "react";

export default function OverviewUnitChart() {
    // Fetch count for 'Available Soon' category using SQL query logic
    const { data: availableSoonCount, isLoading: loadingAvailableSoon } = useQuery({
      queryKey: ['availableSoonCount'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('dogs')
          .select('id, location, status, notes')
          .is('status', null);
        if (error || !data) return 0;
        return data.filter(dog =>
          dog.location !== 'Foster Home' &&
          typeof dog.notes === 'string' && dog.notes.includes('Available Soon') &&
          !dog.location.startsWith('Dog Treatment') &&
          !dog.location.endsWith('Trial Adoption') &&
          !dog.location.startsWith('Foster Office')
        ).length;
      },
      staleTime: 1000 * 60 * 60 * 2
    });
  // Square icon component
  const Square = () => (
    <span style={{
      display: "inline-block",
      width: 16,
      height: 16,
      margin: "0 2px",
      background: "#2563eb",
      borderRadius: 3,
    }} />
  );

  // Fetch available dogs on website from latest_scraped_ids.json
  const { data: availableDogs, isLoading: loadingAvailable } = useQuery({
    queryKey: ['availableDogsScrape'],
    queryFn: async () => {
      try {
        const res = await fetch('/latest_scraped_ids.json');
        if (!res.ok) return 0;
        const ids = await res.json();
        return Array.isArray(ids) ? ids.length : 0;
      } catch {
        return 0;
      }
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  // Fetch temporarily unlisted dogs (dogs available in DB, not on website, not Trial Adoption)
  const { data: temporarilyUnlistedDogs, isLoading: loadingUnlisted } = useQuery({
    queryKey: ['temporarilyUnlistedDogsCount'],
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
      // Get all available dogs with non-empty location
      const { data: allAvailable, error: errorAvailable } = await supabase
        .from('dogs')
        .select('id, location')
        .eq('status', 'available');
      if (errorAvailable || !allAvailable) return 0;
      // Exclude dogs on website and those in Trial Adoption
      const scrapedIdSet = new Set(scrapedIds.map(id => Number(id)));
      const filtered = allAvailable.filter(dog => {
        if (!dog.location || dog.location.includes('Trial Adoption')) return false;
        return !scrapedIdSet.has(Number(dog.id));
      });
      return filtered.length;
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  // Fetch all dogs with location info and status (needed for filtering)
  const { data: allDogsWithLocation, isLoading: loadingLocations } = useQuery({
    queryKey: ['allDogsWithLocation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, location, status');
      return error || !data ? [] : data;
    },
    staleTime: 1000 * 60 * 60 * 2
  });

  // Count by location
  const countByLocation = (locationName: string) =>
    allDogsWithLocation?.filter(dog => (dog.location || '').toLowerCase() === locationName.toLowerCase()).length || 0;

  // Trial Adoption (all dogs, regardless of status)
  const trialAdoptionCount = allDogsWithLocation?.filter(dog => dog.location?.includes('Trial Adoption')).length || 0;

  // Foster Home
  const fosterHomeCount = countByLocation('Foster Home');
  // Foster Office (location contains 'Foster Office', regardless of status)
  const fosterOfficeCount = allDogsWithLocation?.filter(dog => dog.location?.includes('Foster Office')).length || 0;
  // Dog Treatment (location contains 'Dog Treatment', regardless of status)
  const dogTreatmentCount = allDogsWithLocation?.filter(dog => dog.location?.includes('Dog Treatment')).length || 0;
  // Clinic (location contains 'Clinic' and status is 'available')
  const clinicCount = allDogsWithLocation?.filter(dog => dog.location?.includes('Clinic') && dog.status === 'available').length || 0;
  // Behavior Office (location contains 'Behavior Office' and status is 'available')
  const behaviorOfficeCount = allDogsWithLocation?.filter(dog => dog.location?.includes('Behavior Office') && dog.status === 'available').length || 0;
  // Parvo Ward (location contains 'Parvo Ward', regardless of status)
  const parvoWardCount = allDogsWithLocation?.filter(dog => dog.location?.includes('Parvo Ward')).length || 0;

  // Compose categories and sort descending by count
  const categories = [
    { label: "Listed on Website", count: availableDogs ?? 0 },
    { label: "Temporarily Unlisted", count: temporarilyUnlistedDogs ?? 0 },
    { label: "Available Soon", count: availableSoonCount ?? 0 },
    { label: "Foster Home", count: fosterHomeCount },
    { label: "Trial Adoption", count: trialAdoptionCount },
    { label: "Foster Office", count: fosterOfficeCount },
    { label: "Dog Treatment", count: dogTreatmentCount },
    { label: "Clinic", count: clinicCount },
    { label: "Behavior Office", count: behaviorOfficeCount },
    { label: "Parvo Ward", count: parvoWardCount },
  ].sort((a, b) => b.count - a.count);

  // Find max label length for right alignment
  const maxLabelLength = Math.max(...categories.map(c => c.label.length));

  // const loading = loadingAvailable || loadingUnlisted || loadingLocations; // Removed duplicate declaration
  const loading = loadingAvailable || loadingUnlisted || loadingLocations || loadingAvailableSoon;

  return (
    <div
      className="overview-unit-chart border border-[#ccc] p-4 rounded bg-[#fafafa]"
      style={{ padding: "24px" }}
    >
      <div className="flex items-center justify-between mt-[10px]">
        <h2 className="m-0 text-left text-lg font-semibold" style={{ marginLeft: '4px' }}>Shelter Overview</h2>
      </div>
      {/* Responsive scrollable container for mobile */}
      <div
        style={{
          marginTop: '32px',
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
            categories.map(({ label, count }) => (
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
                  {count}
                </div>
                {/* Squares/icons */}
                <div
                  style={{
                    overflowX: 'auto',
                    display: 'flex',
                    flexWrap: 'nowrap',
                    minWidth: Math.max(120, count * 18),
                    maxWidth: '100vw',
                  }}
                >
                  {Array.from({ length: count }).map((_, i) => (
                    <Square key={i} />
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