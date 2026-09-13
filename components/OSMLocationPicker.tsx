"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Search,
  MapPin,
  Locate,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // Default: New Delhi

interface LocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address?: {
      state?: string;
      city?: string;
      pincode?: string;
      display_name?: string;
      establishment?: string;
    };
    addressDetails?: Record<string, string>;
  }) => void;
  initialPosition?: { lat: number; lng: number } | null;
  readOnly?: boolean;
  height?: string;
  mapTypeId?: "roadmap" | "satellite" | "hybrid" | "terrain";
}

// Leaflet Map client component loaded dynamically to avoid Next.js SSR window errors
const OpenStreetMapCanvas = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, useMapEvents, useMap } =
      await import("react-leaflet");
    const L = (await import("leaflet")).default;

    // Custom OpenStreetMap NGO Pin Marker
    const ngoPinIcon = L.divIcon({
      className: "custom-osm-pin",
      html: `
        <div style="transform: translate(-50%, -100%); cursor: pointer;">
          <svg viewBox="0 0 100 100" width="46" height="46" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 95 C 45 80, 20 55, 20 38 A 30 30 0 1 1 80 38 C 80 55, 55 80, 50 95 Z" fill="#0D9488" stroke="#047857" stroke-width="2.5" filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.3))"/>
            <circle cx="50" cy="38" r="19" fill="#FFFFFF"/>
            <path d="M50 28 C 48.5 26.5, 46 26.5, 44.5 28 C 43 29.5, 43 32, 44.5 33.5 L 50 39 L 55.5 33.5 C 57 32, 57 29.5, 55.5 28 C 54 26.5, 51.5 26.5, 50 28 Z" fill="#EF4444"/>
            <path d="M37 42 C 40 45, 45 47, 50 47 C 55 47, 60 45, 63 42 C 64 41, 63.5 39, 61.5 40 C 58.5 41.5, 54.5 42.5, 50 42.5 C 45.5 42.5, 41.5 41.5, 38.5 40 C 36.5 39, 36 41, 37 42 Z" fill="#0F766E"/>
          </svg>
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 46],
    });

    function MapEventHandler({
      onPositionChange,
      readOnly,
    }: {
      onPositionChange: (lat: number, lng: number) => void;
      readOnly?: boolean;
    }) {
      useMapEvents({
        click(e) {
          if (!readOnly) {
            onPositionChange(e.latlng.lat, e.latlng.lng);
          }
        },
      });
      return null;
    }

    function MapController({
      center,
    }: {
      center: { lat: number; lng: number };
    }) {
      const map = useMap();
      const lastFlownRef = useRef<{ lat: number; lng: number } | null>(null);

      useEffect(() => {
        if (!center) return;
        const currentCenter = map.getCenter();
        const distFromCurrent = Math.hypot(
          currentCenter.lat - center.lat,
          currentCenter.lng - center.lng,
        );
        const distFromLastFlown = lastFlownRef.current
          ? Math.hypot(
              lastFlownRef.current.lat - center.lat,
              lastFlownRef.current.lng - center.lng,
            )
          : Infinity;

        if (distFromCurrent > 0.0003 && distFromLastFlown > 0.0003) {
          lastFlownRef.current = { lat: center.lat, lng: center.lng };
          map.flyTo([center.lat, center.lng], 16, { duration: 3.0 });
        }
      }, [center.lat, center.lng, map]);
      return null;
    }

    return function LeafletMapWrapper({
      position,
      onPositionChange,
      readOnly,
    }: {
      position: { lat: number; lng: number };
      onPositionChange: (lat: number, lng: number) => void;
      readOnly?: boolean;
    }) {
      return (
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <Marker position={[position.lat, position.lng]} icon={ngoPinIcon} />
          )}
          <MapEventHandler
            onPositionChange={onPositionChange}
            readOnly={readOnly}
          />
          <MapController center={position} />
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
        <p className="text-slate-500 font-bold uppercase tracking-wider text-xs">
          Loading OpenStreetMap…
        </p>
      </div>
    ),
  },
);

export default function OSMLocationPicker({
  onLocationSelect,
  initialPosition = null,
  readOnly = false,
  height = "400px",
}: LocationPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>(
    initialPosition ?? DEFAULT_CENTER,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [resolvedAddress, setResolvedAddress] = useState<{
    display_name?: string;
    establishment?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null>(null);

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Geocode lat/lng to address details via OpenStreetMap Nominatim API
  const fetchAddressFromCoords = useCallback(
    async (lat: number, lng: number) => {
      setAddressLoading(true);
      setConfirmed(false);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "en",
            },
          },
        );
        const data = await res.json();

        if (data && data.address) {
          const addr = data.address;
          const state = addr.state || addr.region || "";
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            addr.county ||
            addr.municipality ||
            "";
          const pincode = addr.postcode || "";
          const establishment =
            data.name ||
            addr.shop ||
            addr.amenity ||
            addr.building ||
            addr.office ||
            addr.tourism ||
            addr.hospital ||
            addr.road ||
            "";

          const addressDetails: Record<string, string> = {};
          if (state) addressDetails["State"] = state;
          if (city) addressDetails["City"] = city;
          if (pincode) addressDetails["PIN Code"] = pincode;
          if (establishment) addressDetails["Establishment"] = establishment;
          if (addr.country) addressDetails["Country"] = addr.country;

          const resolved = {
            state,
            city,
            pincode,
            display_name: data.display_name,
            establishment:
              establishment ||
              data.display_name?.split(",")[0] ||
              "Pinned Location",
          };

          setResolvedAddress(resolved);
          onLocationSelect({
            lat,
            lng,
            address: resolved,
            addressDetails,
          });
        } else {
          setResolvedAddress({
            display_name: `Coordinates: (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          });
          onLocationSelect({ lat, lng });
        }
      } catch (err) {
        console.error("[OSMLocationPicker] Reverse geocode error:", err);
        onLocationSelect({ lat, lng });
      } finally {
        setAddressLoading(false);
      }
    },
    [onLocationSelect],
  );

  // Sync initialPosition
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
      if (!resolvedAddress) {
        fetchAddressFromCoords(initialPosition.lat, initialPosition.lng);
      }
    }
  }, [initialPosition]);

  // Request user GPS on mount if initialPosition is not set
  useEffect(() => {
    if (initialPosition) return;
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(userPos);
        fetchAddressFromCoords(userPos.lat, userPos.lng);
        setLocating(false);
      },
      () => {
        setLocating(false);
        fetchAddressFromCoords(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const handlePositionChange = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    fetchAddressFromCoords(lat, lng);
  };

  // Search OpenStreetMap Nominatim for locations
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=5&addressdetails=1&countrycodes=in`,
        {
          headers: {
            "Accept-Language": "en",
          },
        },
      );
      const data = await res.json();
      setSearchResults(data || []);
      setShowResults(true);
    } catch (err) {
      console.error("[OSMLocationPicker] Search error:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(val);
    }, 500);
  };

  const handleResultClick = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    handlePositionChange(lat, lng);
    setSearchQuery(result.display_name?.split(",")[0] || result.display_name);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(userPos);
        fetchAddressFromCoords(userPos.lat, userPos.lng);
        setLocating(false);
      },
      (err) => {
        console.error("Locating failed:", err);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleViewOnOSM = () => {
    window.open(
      `https://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=16/${position.lat}/${position.lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div
      style={{ height }}
      className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-900 z-0 bg-slate-100"
    >
      {/* 1. Search Bar Overlay */}
      {!readOnly && (
        <div className="absolute top-3 left-3 right-3 z-50 flex flex-col gap-1.5">
          <div className="relative">
            <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-2 border-slate-900 px-3 py-1.5 backdrop-blur-sm">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <Input
                type="text"
                placeholder="Search hospital, street, city or PIN code (OpenStreetMap)…"
                value={searchQuery}
                onChange={handleSearchChange}
                className="flex-1 border-0 focus-visible:ring-0 text-slate-900 dark:text-slate-100 focus-visible:ring-offset-0 bg-transparent py-1 text-xs font-bold"
              />
              {searching && (
                <Loader2 className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
              )}
            </div>

            {/* Dropdown list */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-950 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] border-2 border-slate-900 max-h-50 overflow-y-auto z-50">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleResultClick(item)}
                    className="px-3 py-2.5 hover:bg-teal-50 dark:hover:bg-slate-900 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {item.display_name?.split(",")[0]}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate font-semibold">
                          {item.display_name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. OpenStreetMap Canvas */}
      <OpenStreetMapCanvas
        position={position}
        onPositionChange={handlePositionChange}
        readOnly={readOnly}
      />

      {/* 3. Floating GPS & View buttons */}
      {!readOnly && (
        <div className="absolute right-3 bottom-32 flex flex-col gap-2 z-40">
          <button
            type="button"
            onClick={handleLocateMe}
            className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
            title="Locate GPS Position"
          >
            <Locate className="w-5 h-5 text-slate-800 dark:text-slate-100" />
          </button>
          <button
            type="button"
            onClick={handleViewOnOSM}
            className="w-10 h-10 bg-white/95 dark:bg-slate-900/95 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
            title="Open in OpenStreetMap"
          >
            <ExternalLink className="w-4 h-4 text-slate-800 dark:text-slate-100" />
          </button>
        </div>
      )}

      {/* 4. Status Badges */}
      {!readOnly && locating && (
        <div className="absolute top-16 right-3 z-40 bg-slate-900/90 border border-slate-700 text-white px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm">
          <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
          <span className="text-[9px] font-black uppercase tracking-wider">
            Locating GPS…
          </span>
        </div>
      )}

      {!readOnly && addressLoading && (
        <div className="absolute top-16 left-3 z-40 bg-slate-900/90 border border-slate-700 text-white px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-sm">
          <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
          <span className="text-[9px] font-black uppercase tracking-wider">
            Resolving address details…
          </span>
        </div>
      )}

      {/* 5. Address Details Sheet */}
      {!readOnly && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-2 border-slate-900 rounded-xl p-3 shadow-xl z-40">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex gap-2 items-start flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border-2 border-teal-700 flex items-center justify-center text-teal-700 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-extrabold text-slate-950 dark:text-slate-50 uppercase tracking-wider truncate">
                  {resolvedAddress?.establishment || "NGO Office Coordinates"}
                </h4>
                <p className="text-[9px] text-slate-600 dark:text-slate-400 font-bold leading-relaxed truncate mt-0.5">
                  {resolvedAddress?.display_name ||
                    "Click or drag map to select office landmark"}
                </p>
                {resolvedAddress?.pincode && (
                  <span className="inline-block text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 mt-1">
                    PIN: {resolvedAddress.pincode}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmed(true)}
              disabled={!resolvedAddress}
              className={`px-4 py-2.5 rounded-lg border-2 border-slate-900 uppercase tracking-widest text-[9px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0 ${
                confirmed
                  ? "bg-emerald-500 text-white shadow-inner"
                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-md active:scale-95"
              }`}
            >
              {confirmed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Office Pinned
                </>
              ) : (
                <>Confirm Location</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
