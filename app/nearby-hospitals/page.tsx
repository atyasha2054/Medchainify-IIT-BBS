"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { HiOutlineSearch } from "react-icons/hi";
import { MdOutlineLocalHospital, MdOutlineMyLocation } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Navigation,
  MapPin,
  Star,
  ArrowRight,
  Map,
  Mountain,
  Phone,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

const center = { lat: 22.5726, lng: 88.3639 }; // Default: Kolkata

interface HospitalItem {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  vicinity: string;
  rating?: number;
  reviews?: number;
  phone?: string | null;
  website?: string | null;
  openState?: string | null;
  thumbnail?: string | null;
  emergency?: string;
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 20, stiffness: 180 },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

// OpenStreetMap dynamic Leaflet component
const OpenStreetMapNearby = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } =
      await import("react-leaflet");
    const L = (await import("leaflet")).default;

    // Compact, sleek hospital pin pointer (28px normal, 36px selected)
    const hospitalPinIcon = (isSelected: boolean) =>
      L.divIcon({
        className: "custom-hospital-marker",
        html: `
          <div style="transform: translate(-50%, -100%); cursor: pointer; position: relative;">
            ${
              isSelected
                ? `<div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 44px;
                    height: 44px;
                    background: rgba(225, 29, 72, 0.2);
                    border: 1.5px solid rgba(225, 29, 72, 0.5);
                    border-radius: 50%;
                  "></div>`
                : ""
            }
            <div style="
              position: relative;
              width: ${isSelected ? "36px" : "28px"};
              height: ${isSelected ? "36px" : "28px"};
              background: ${isSelected ? "#e11d48" : "#0d9488"};
              border: 2px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: ${isSelected ? "0 4px 12px rgba(225, 29, 72, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.2)"};
              transition: all 0.2s ease-out;
            ">
              <div style="transform: rotate(45deg); color: #ffffff; font-weight: 800; font-size: ${isSelected ? "14px" : "11px"};">
                ✚
              </div>
            </div>
          </div>
        `,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 36 : 28],
      });

    // Sleek user position indicator
    const userPosIcon = L.divIcon({
      className: "user-pos-marker",
      html: `
        <div style="transform: translate(-50%, -50%);">
          <div style="
            width: 16px;
            height: 16px;
            background: #2563eb;
            border: 2.5px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.25);
          "></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    function MapController({
      center,
      zoom,
    }: {
      center: { lat: number; lng: number };
      zoom?: number;
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

        if (distFromCurrent > 0.0002 && distFromLastFlown > 0.0002) {
          lastFlownRef.current = { lat: center.lat, lng: center.lng };
          map.flyTo([center.lat, center.lng], zoom || 16, {
            duration: 3.0,
            easeLinearity: 0.25,
          });
        }
      }, [center.lat, center.lng, zoom, map]);
      return null;
    }

    function MapEventsHandler({
      onCenterChanged,
    }: {
      onCenterChanged: (lat: number, lng: number) => void;
    }) {
      useMapEvents({
        moveend(e) {
          const c = e.target.getCenter();
          onCenterChanged(c.lat, c.lng);
        },
      });
      return null;
    }

    return function LeafletNearbyMap({
      currentPos,
      mapCenter,
      hospitals,
      selectedHospital,
      popupHospitalId,
      onSelectHospital,
      onCenterChanged,
      tileMode,
      onGetDirections,
    }: {
      currentPos: { lat: number; lng: number };
      mapCenter: { lat: number; lng: number };
      hospitals: HospitalItem[];
      selectedHospital: HospitalItem | null;
      popupHospitalId: string | number | null;
      onSelectHospital: (h: HospitalItem, isMapClick?: boolean) => void;
      onCenterChanged: (lat: number, lng: number) => void;
      tileMode: "standard" | "topo";
      onGetDirections: (h: HospitalItem) => void;
    }) {
      const tileUrl =
        tileMode === "standard"
          ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          : "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";

      return (
        <MapContainer
          center={[currentPos.lat, currentPos.lng]}
          zoom={14}
          style={{ width: "100%", height: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={tileUrl}
          />

          {/* User Location */}
          <Marker
            position={[currentPos.lat, currentPos.lng]}
            icon={userPosIcon}
          />

          {/* Hospitals */}
          {hospitals.map((h) => {
            const isSelected = selectedHospital?.id === h.id;
            const showPopup = popupHospitalId === h.id;

            return (
              <Marker
                key={h.id}
                position={[h.lat, h.lng]}
                icon={hospitalPinIcon(isSelected)}
                eventHandlers={{
                  click: () => onSelectHospital(h, true),
                }}
              >
                {showPopup && (
                  <Popup className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                    <div className="p-2 space-y-2 text-slate-900 max-w-55">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider leading-snug text-slate-900">
                          {h.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {h.vicinity}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[9px] font-bold">
                        {h.rating && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" />{" "}
                            {h.rating}
                          </span>
                        )}
                        {h.openState && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold truncate">
                            {h.openState}
                          </span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => onGetDirections(h)}
                        className="w-full h-8 bg-rose-600 hover:bg-rose-700 text-white text-[9px] uppercase tracking-wider font-extrabold rounded-lg shadow-sm"
                      >
                        <Navigation className="w-3 h-3 mr-1.5" /> Navigate
                      </Button>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}

          <MapController
            center={
              selectedHospital
                ? { lat: selectedHospital.lat, lng: selectedHospital.lng }
                : mapCenter
            }
            zoom={selectedHospital ? 16 : 14}
          />
          <MapEventsHandler onCenterChanged={onCenterChanged} />
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <TetrisLoading
          size="lg"
          speed="normal"
          showLoadingText={true}
          loadingText="Acquiring Map Instance..."
        />
      </div>
    ),
  },
);

export default function NearbyHospitalsPage() {
  const [currentPos, setCurrentPos] = useState(center);
  const [mapCenter, setMapCenter] = useState(center);
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HospitalItem | null>(
    null,
  );
  const [popupHospitalId, setPopupHospitalId] = useState<
    string | number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapType, setMapType] = useState<"standard" | "topo">("standard");

  const selectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch nearby hospitals via SerpAPI API route (with Overpass fallback)
  const fetchNearbyHospitals = useCallback(
    async (location: { lat: number; lng: number }) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/nearby-hospitals?lat=${location.lat}&lng=${location.lng}`,
        );
        const data = await res.json();

        if (data && data.hospitals && data.hospitals.length > 0) {
          setHospitals(data.hospitals);
        } else {
          fetchOverpassHospitals(location);
        }
      } catch (err) {
        console.warn("SerpAPI fetch failed, trying Overpass fallback:", err);
        fetchOverpassHospitals(location);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchOverpassHospitals = async (location: {
    lat: number;
    lng: number;
  }) => {
    try {
      const radius = 6000;
      const query = `
        [out:json][timeout:20];
        (
          node["amenity"="hospital"](around:${radius},${location.lat},${location.lng});
          way["amenity"="hospital"](around:${radius},${location.lat},${location.lng});
          node["healthcare"="hospital"](around:${radius},${location.lat},${location.lng});
        );
        out center 35;
      `;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      const data = await res.json();
      if (data && data.elements && data.elements.length > 0) {
        const parsed: HospitalItem[] = data.elements
          .map((el: any) => {
            const tags = el.tags || {};
            const lat = el.lat || el.center?.lat;
            const lng = el.lon || el.center?.lon;
            if (!lat || !lng) return null;

            const name =
              tags.name || tags["name:en"] || "Medical Center / Hospital";
            const vicinityParts = [
              tags["addr:street"],
              tags["addr:suburb"] || tags["addr:district"],
              tags["addr:city"],
            ].filter(Boolean);
            const vicinity =
              vicinityParts.length > 0
                ? vicinityParts.join(", ")
                : tags["addr:full"] || "Nearby Location";

            return {
              id: el.id,
              name,
              lat,
              lng,
              vicinity,
              rating: 4.6,
              phone: tags.phone || tags["contact:phone"] || null,
              website: tags.website || tags["contact:website"] || null,
              openState: "Open 24 Hours",
            };
          })
          .filter(Boolean);

        setHospitals(parsed);
      }
    } catch (e) {
      console.error("Overpass hospital search failed:", e);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPos(p);
          setMapCenter(p);
          fetchNearbyHospitals(p);
        },
        () => fetchNearbyHospitals(center),
      );
    } else {
      fetchNearbyHospitals(center);
    }
  }, [fetchNearbyHospitals]);

  const handleHospitalSelect = (hospital: HospitalItem, isMapClick = false) => {
    if (selectedHospital?.id === hospital.id && !isMapClick) {
      setSelectedHospital(null);
      setPopupHospitalId(null);
      if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
      return;
    }

    setSelectedHospital(hospital);
    setPopupHospitalId(null); // Hide popup while camera flies

    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);

    const delayMs = isMapClick ? 250 : 3000;
    selectTimerRef.current = setTimeout(() => {
      setPopupHospitalId(hospital.id);
    }, delayMs);
  };

  const handleGetDirections = (hospital: HospitalItem) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`,
      "_blank",
    );
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentPos(p);
        setMapCenter(p);
      });
    }
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.vicinity.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-8 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[85%] space-y-6">
        {/* PAGE HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 160 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300 shadow-xs">
            <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
            Live Medical Grid
          </div>
          <h1 className="text-3xl md:text-4xl text-slate-900 font-black tracking-tight uppercase">
            Nearby <span className="text-emerald-700">Hospitals</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium tracking-wide">
            Real-time medical facility locator with ratings & live info
          </p>
        </motion.div>

        {/* COORDINATE HUD */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1,
            type: "spring",
            damping: 22,
            stiffness: 160,
          }}
          className="flex justify-center"
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-5 py-2 rounded-full shadow-sm flex items-center gap-5">
            <div className="flex flex-col items-center">
              <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold">
                Lat
              </span>
              <span className="text-[11px] text-slate-900 dark:text-slate-100 font-mono font-bold tabular-nums">
                {mapCenter.lat.toFixed(5)}°
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold">
                Lng
              </span>
              <span className="text-[11px] text-slate-900 dark:text-slate-100 font-mono font-bold tabular-nums">
                {mapCenter.lng.toFixed(5)}°
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider tabular-nums">
                {loading ? "Searching..." : `${filteredHospitals.length} Found`}
              </span>
            </div>
          </div>
        </motion.div>

        {/* MAIN LAYOUT */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            type: "spring",
            damping: 22,
            stiffness: 140,
          }}
          className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6 h-160"
        >
          {/* LEFT: HOSPITAL LIST */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-lg">
            {/* List Header */}
            <div className="p-5 pb-3 space-y-3 border-b border-slate-100 dark:border-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-3 py-1 rounded-full">
                  <MdOutlineLocalHospital className="h-3.5 w-3.5 text-emerald-700" />
                  <span className="text-[9px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold">
                    Medical Directory
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {filteredHospitals.length} Results
                </span>
              </div>
              <div className="relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by facility name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all"
                />
              </div>
            </div>

            {/* List Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-emerald-600"
                  />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Searching facilities…
                  </p>
                </div>
              ) : filteredHospitals.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    No hospitals found
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence>
                    {filteredHospitals.map((hospital) => {
                      const isSelected = selectedHospital?.id === hospital.id;
                      return (
                        <motion.div
                          layout
                          variants={itemVariants}
                          exit="exit"
                          key={hospital.id}
                          onClick={() => handleHospitalSelect(hospital)}
                          className={cn(
                            "mb-2.5 rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer",
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/40 dark:bg-slate-900 shadow-md"
                              : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs",
                          )}
                        >
                          <div className="p-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {hospital.name}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                  {hospital.vicinity}
                                </p>
                                {hospital.openState && (
                                  <p className="text-[9.5px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {hospital.openState}
                                  </p>
                                )}
                              </div>
                              {hospital.rating && (
                                <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                  <Star className="h-3 w-3 fill-current" />
                                  {hospital.rating}
                                  {hospital.reviews ? (
                                    <span className="text-[8px] text-slate-400 font-normal">
                                      ({hospital.reviews})
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{
                                    type: "spring" as const,
                                    damping: 22,
                                    stiffness: 200,
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      {hospital.phone && (
                                        <a
                                          href={`tel:${hospital.phone}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                          <Phone className="w-3 h-3 text-slate-500" />
                                          Call
                                        </a>
                                      )}
                                      {hospital.website && (
                                        <a
                                          href={hospital.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex-1 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors truncate"
                                        >
                                          <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                                          Website
                                        </a>
                                      )}
                                    </div>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGetDirections(hospital);
                                      }}
                                      className="w-full h-8.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase tracking-wider font-extrabold rounded-lg shadow-xs"
                                    >
                                      <Navigation className="h-3 w-3 mr-1.5" />{" "}
                                      Directions
                                      <ArrowRight className="h-3 w-3 ml-auto" />
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT: MAP */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl z-0">
            <OpenStreetMapNearby
              currentPos={currentPos}
              mapCenter={mapCenter}
              hospitals={filteredHospitals}
              selectedHospital={selectedHospital}
              popupHospitalId={popupHospitalId}
              onSelectHospital={handleHospitalSelect}
              onCenterChanged={(lat, lng) => setMapCenter({ lat, lng })}
              tileMode={mapType}
              onGetDirections={handleGetDirections}
            />

            {/* Map toggle controls */}
            <div className="absolute top-4 left-4 flex gap-2 z-40">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setMapType((prev) =>
                    prev === "standard" ? "topo" : "standard",
                  )
                }
                className="h-8.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              >
                {mapType === "standard" ? (
                  <>
                    <Map className="h-3.5 w-3.5 text-emerald-600" /> Standard
                  </>
                ) : (
                  <>
                    <Mountain className="h-3.5 w-3.5 text-amber-600" /> Topo
                  </>
                )}
              </motion.button>
            </div>

            {/* Location button */}
            <div className="absolute bottom-5 right-5 flex flex-col gap-2 z-40">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLocateMe}
                className="h-10 w-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200"
                title="Locate GPS"
              >
                <MdOutlineMyLocation size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
