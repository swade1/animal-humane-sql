
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";




// Only import L from leaflet on the client side
let L: typeof import('leaflet') | undefined = undefined;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  L = require('leaflet');
}



export default function ShelterMap() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (L && L.Icon && L.Icon.Default) {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    }
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["shelterMapData"],
    queryFn: async () => {
      // Query unique origins with lat/lng and dog count
      const { data: rows, error, status, statusText } = await supabase
        .from("dogs")
        .select("origin, latitude, longitude")
        .not("origin", "is", null)
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      console.log("Supabase response:", { rows, error, status, statusText });
      if (error) {
        if (Object.keys(error).length === 0) {
          console.error("Supabase error: Unknown error (empty object)", error, { rows, status, statusText });
        } else {
          console.error("Supabase error:", error);
        }
        throw error;
      }
      // Group by origin, lat, lng, but skip if lat/lng is 0
      const map = new Map();
      for (const row of rows) {
        if (!row.latitude || !row.longitude || Number(row.latitude) === 0 || Number(row.longitude) === 0) continue;
        const key = `${row.origin}|${row.latitude}|${row.longitude}`;
        if (!map.has(key)) {
          map.set(key, { origin: row.origin, latitude: row.latitude, longitude: row.longitude, count: 1 });
        } else {
          map.get(key).count++;
        }
      }
      const result = Array.from(map.values());
      console.log("ShelterMap data:", result);
      return result;
    },
    staleTime: 1000 * 60 * 60 * 2,
  });

  if (!mounted) return null;

  // Dynamically import react-leaflet components only after mount
  const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
  const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
  const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
  const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
  if (isLoading) return <div>Loading map...</div>;
  if (error) {
    if (Object.keys(error).length === 0) {
      console.error("ShelterMap render error: Unknown error (empty object)", error);
    } else {
      console.error("ShelterMap render error:", error);
    }
    return <div>Error loading map data.</div>;
  }
  if (!data || data.length === 0) {
    console.warn("No shelter transfer data found.");
    return <div>No shelter transfer data found.</div>;
  }

  // Center and bounds for New Mexico
  const center: [number, number] = [34.5, -106];
  const zoom = 7;
  // Adjusted bounding box: reduce west/east, add more north/south
  // New Mexico approx: W: -109.050, E: -103.000, S: 31.332, N: 37.000
  // Even wider/taller bounds: W: -109.2, E: -102.5, S: 31.0, N: 38.0 (more space top/right for popups)
  const bounds: [[number, number], [number, number]] = [
    [31.0, -109.2], // More west
    [38.0, -102.5], // More north and more east
  ];

  return (
    <div style={{ width: '900px', maxWidth: '100%', marginRight: 24, marginLeft: 20, display: "inline-block", verticalAlign: "top" }}>
      <div style={{ width: '100%', maxWidth: 880, marginLeft: 0, marginBottom: 8, textAlign: "left", display: "flex", justifyContent: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: 0.5, paddingLeft: 0 }}>Shelter Transfer Map</span>
      </div>
      <div style={{ width: '100%', maxWidth: 880, marginLeft: 20, marginBottom: 18, textAlign: "left", fontSize: 15, color: "#444", opacity: 0.92, lineHeight: 1.6 }}>
        {`Since January 1, 2026, `}
        <span style={{ fontWeight: 700 }}>{data.length} shelters and rescues</span>
        {` throughout New Mexico have partnered with Animal Humane to find homes for their dogs. Click on each pin to view shelter/rescue name and the number of dogs transferred from that location.`}
      </div>
      <div style={{ width: '100%', maxWidth: 880, minWidth: 320, margin: '0 auto' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ width: '100%', height: '60vw', minHeight: 350, maxHeight: 700, borderRadius: 16, border: "1px solid #ccc", boxSizing: "border-box" }}
          scrollWheelZoom={true}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
          minZoom={7}
          maxZoom={12}
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
          {data.map((shelter, i) => (
            <Marker key={i} position={[shelter.latitude, shelter.longitude]}>
              <Popup>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{shelter.origin}</div>
                  <div>Dogs: {shelter.count}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
