"use client";

import React from "react";
import dynamic from "next/dynamic";
import TetrisLoading from "@/components/ui/tetris-loader";
import "leaflet/dist/leaflet.css";

interface OSMCampaignMapProps {
  lat: number;
  lng: number;
  campaignTitle?: string;
  address?: string;
  height?: string;
}

// Client-only dynamic Leaflet Map Canvas to avoid SSR issues
const OpenStreetMapLeaflet = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, useMap } = await import(
      "react-leaflet"
    );
    const L = (await import("leaflet")).default;

    // Custom MedChainify Campaign SVG Pin Marker
    const campaignPinIcon = L.divIcon({
      className: "campaign-osm-pin",
      html: `
        <div style="transform: translate(-50%, -100%); cursor: pointer;">
          <svg viewBox="0 0 100 100" width="46" height="46" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 95 C 45 80, 20 55, 20 38 A 30 30 0 1 1 80 38 C 80 55, 55 80, 50 95 Z" fill="#075985" stroke="#0c4a6e" stroke-width="3" filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.35))"/>
            <circle cx="50" cy="38" r="18" fill="#FFFFFF"/>
            <!-- Medical Cross inside pin -->
            <path d="M46 28 H54 V34 H60 V42 H54 V48 H46 V42 H40 V34 H46 Z" fill="#0284c7"/>
          </svg>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 46],
      popupAnchor: [0, -42],
    });

    // Subcomponent to smoothly pan/fly to coordinates when updated
    function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
      const map = useMap();
      React.useEffect(() => {
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 15);
        }
      }, [lat, lng, map]);
      return null;
    }

    return function LeafletCanvas({
      lat,
      lng,
      campaignTitle,
      address,
    }: OSMCampaignMapProps) {
      const validLat = typeof lat === "number" && !isNaN(lat) ? lat : 28.6139;
      const validLng = typeof lng === "number" && !isNaN(lng) ? lng : 77.209;

      return (
        <MapContainer
          center={[validLat, validLng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ width: "100%", height: "100%", zIndex: 1 }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[validLat, validLng]} icon={campaignPinIcon}>
            {(campaignTitle || address) && (
              <Popup className="custom-osm-popup">
                <div className="p-1 space-y-1 font-sans">
                  {campaignTitle && (
                    <p className="font-extrabold text-xs text-slate-900 leading-tight">
                      {campaignTitle}
                    </p>
                  )}
                  {address && (
                    <p className="text-[11px] text-slate-600 font-medium leading-normal">
                      {address}
                    </p>
                  )}
                  <p className="text-[10px] text-sky-800 font-mono font-bold pt-1 border-t border-slate-100">
                    {validLat.toFixed(5)}, {validLng.toFixed(5)}
                  </p>
                </div>
              </Popup>
            )}
          </Marker>
          <MapRecenter lat={validLat} lng={validLng} />
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-55 bg-slate-100 flex flex-col items-center justify-center p-4">
        <TetrisLoading
          size="sm"
          speed="normal"
          showLoadingText={true}
          loadingText="Loading OpenStreetMap..."
        />
      </div>
    ),
  },
);

export default function OSMCampaignMap({
  lat,
  lng,
  campaignTitle,
  address,
  height = "100%",
}: OSMCampaignMapProps) {
  return (
    <div style={{ height }} className="w-full h-full relative overflow-hidden">
      <OpenStreetMapLeaflet
        lat={lat}
        lng={lng}
        campaignTitle={campaignTitle}
        address={address}
      />
    </div>
  );
}
