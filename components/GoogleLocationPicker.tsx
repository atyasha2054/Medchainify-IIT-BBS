"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
} from "@react-google-maps/api";
import {
  Search,
  MapPin,
  Locate,
  AlertTriangle,
  X,
  Building2,
  Navigation2,
} from "lucide-react";
import TetrisLoading from "@/components/ui/tetris-loader";

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // Default: New Delhi, India

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export interface LocationPickerProps {
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
  mapTypeId?: string;
}

function parseGooglePlaceOrGeocode(
  lat: number,
  lng: number,
  result?: google.maps.GeocoderResult | google.maps.places.PlaceResult,
  placeNameOverride?: string,
) {
  let state = "";
  let city = "";
  let pincode = "";
  let establishment = placeNameOverride || "";
  let country = "";
  const rawFormattedAddress =
    result?.formatted_address ||
    `Coordinates: (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

  if (result && result.address_components) {
    for (const comp of result.address_components) {
      const types = comp.types || [];
      if (types.includes("country")) {
        country = comp.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      }
      if (
        types.includes("locality") ||
        types.includes("administrative_area_level_2") ||
        types.includes("sublocality_level_1") ||
        types.includes("postal_town")
      ) {
        if (!city || types.includes("locality")) {
          city = comp.long_name;
        }
      }
      if (types.includes("postal_code")) {
        pincode = comp.long_name.replace(/\D/g, "");
      }
      if (
        types.includes("point_of_interest") ||
        types.includes("establishment") ||
        types.includes("premise") ||
        types.includes("subpremise") ||
        types.includes("health") ||
        types.includes("hospital")
      ) {
        if (!establishment) {
          establishment = comp.long_name;
        }
      }
    }
  }

  // Fallback for establishment name
  if (!establishment) {
    if (result && "name" in result && (result as any).name) {
      establishment = (result as any).name;
    } else if (rawFormattedAddress) {
      const firstPart = rawFormattedAddress.split(",")[0].trim();
      if (
        firstPart &&
        !firstPart.includes("Unnamed") &&
        !firstPart.includes("Coordinates")
      ) {
        establishment = firstPart;
      }
    }
  }

  // Construct complete display_name ALWAYS including the place name (establishment) at the beginning
  let full_address = rawFormattedAddress;
  if (
    establishment &&
    establishment !== "Selected Location" &&
    establishment !== "Pinned Location"
  ) {
    const lowerFull = full_address.toLowerCase();
    const lowerEst = establishment.toLowerCase();
    if (!lowerFull.startsWith(lowerEst)) {
      full_address = `${establishment}, ${full_address}`;
    }
  }

  const addressDetails: Record<string, string> = {};
  if (establishment) addressDetails["Place Name"] = establishment;
  if (state) addressDetails["State"] = state;
  if (city) addressDetails["City"] = city;
  if (pincode) addressDetails["PIN Code"] = pincode;
  if (establishment) addressDetails["Establishment"] = establishment;
  if (country) addressDetails["Country"] = country;

  const resolved = {
    state,
    city,
    pincode,
    display_name: full_address,
    establishment: establishment || "Selected Location",
  };

  return { resolved, addressDetails };
}

export default function GoogleLocationPicker({
  onLocationSelect,
  initialPosition = null,
  readOnly = false,
  height = "380px",
  mapTypeId = "roadmap",
}: LocationPickerProps) {
  const apiKey =
    process.env.NEXT_PUBLIC_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [position, setPosition] = useState<{ lat: number; lng: number }>(
    initialPosition ?? DEFAULT_CENTER,
  );
  const [addressLoading, setAddressLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [markerAnimation, setMarkerAnimation] = useState<google.maps.Animation | null>(null);

  const [resolvedAddress, setResolvedAddress] = useState<{
    display_name?: string;
    establishment?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null>(null);

  // Search & debounced predictions state
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize AutocompleteService when Google Maps API loads
  useEffect(() => {
    if (
      isLoaded &&
      typeof window !== "undefined" &&
      window.google?.maps?.places
    ) {
      autocompleteServiceRef.current =
        new window.google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Smooth Camera Migration & Flight Animation
  const smoothFlyTo = useCallback(
    (targetLat: number, targetLng: number, targetZoom: number = 16) => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      const currentCenter = map.getCenter();

      const triggerMarkerArrival = () => {
        if (
          typeof window !== "undefined" &&
          window.google?.maps?.Animation
        ) {
          setMarkerAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            setMarkerAnimation(null);
          }, 900);
        }
      };

      if (!currentCenter) {
        map.panTo({ lat: targetLat, lng: targetLng });
        map.setZoom(targetZoom);
        triggerMarkerArrival();
        return;
      }

      const startLat = currentCenter.lat();
      const startLng = currentCenter.lng();
      const dist = Math.hypot(targetLat - startLat, targetLng - startLng);

      if (dist > 0.0005) {
        setIsFlying(true);
        // Calculate duration based on distance (700ms - 1500ms)
        const duration = Math.min(1500, Math.max(700, dist * 3500));
        const startTime = performance.now();

        const animateFlight = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Cubic ease-in-out curve for smooth acceleration and deceleration
          const ease =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          const curLat = startLat + (targetLat - startLat) * ease;
          const curLng = startLng + (targetLng - startLng) * ease;

          map.panTo({ lat: curLat, lng: curLng });

          if (progress < 1) {
            requestAnimationFrame(animateFlight);
          } else {
            map.panTo({ lat: targetLat, lng: targetLng });
            map.setZoom(targetZoom);
            setIsFlying(false);
            triggerMarkerArrival();
          }
        };

        requestAnimationFrame(animateFlight);
      } else {
        map.panTo({ lat: targetLat, lng: targetLng });
        map.setZoom(targetZoom);
        triggerMarkerArrival();
      }
    },
    [],
  );

  // Reverse Geocoding and position change handler
  const handlePositionChange = useCallback(
    async (
      lat: number,
      lng: number,
      placeResult?: google.maps.places.PlaceResult | google.maps.GeocoderResult,
      placeNameOverride?: string,
      skipFlyAnimation?: boolean,
    ) => {
      setPosition({ lat, lng });

      if (!skipFlyAnimation) {
        smoothFlyTo(lat, lng, 16);
      }

      if (placeResult && placeResult.address_components) {
        const { resolved, addressDetails } = parseGooglePlaceOrGeocode(
          lat,
          lng,
          placeResult,
          placeNameOverride,
        );
        setResolvedAddress(resolved);
        onLocationSelect({
          lat,
          lng,
          address: resolved,
          addressDetails,
        });
        return;
      }

      // Reverse geocode via Geocoder
      if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
        setAddressLoading(true);
        try {
          const geocoder = new window.google.maps.Geocoder();
          const response = await geocoder.geocode({
            location: { lat, lng },
          });

          if (response.results && response.results.length > 0) {
            const { resolved, addressDetails } = parseGooglePlaceOrGeocode(
              lat,
              lng,
              response.results[0],
              placeNameOverride,
            );
            setResolvedAddress(resolved);
            onLocationSelect({
              lat,
              lng,
              address: resolved,
              addressDetails,
            });
          } else {
            const fallback = {
              display_name: `Coordinates: (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
              establishment: "Pinned Location",
            };
            setResolvedAddress(fallback);
            onLocationSelect({ lat, lng, address: fallback });
          }
        } catch (err) {
          console.error("[GoogleLocationPicker] Geocoding error:", err);
          const fallback = {
            display_name: `Coordinates: (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
            establishment: "Pinned Location",
          };
          setResolvedAddress(fallback);
          onLocationSelect({ lat, lng, address: fallback });
        } finally {
          setAddressLoading(false);
        }
      }
    },
    [onLocationSelect, smoothFlyTo],
  );

  // DEBOUNCED SEARCH: Debounces when input length >= 3 characters
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 3) {
      setPredictions([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      if (autocompleteServiceRef.current) {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: trimmed,
            componentRestrictions: { country: "in" },
          },
          (results, status) => {
            setIsSearching(false);
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              results
            ) {
              setPredictions(results);
              setShowDropdown(true);
            } else {
              setPredictions([]);
            }
          },
        );
      } else {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce rate

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close predictions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPrediction = (
    prediction: google.maps.places.AutocompletePrediction,
  ) => {
    setShowDropdown(false);
    setSearchQuery(prediction.description);
    setPredictions([]);

    if (typeof window === "undefined" || !window.google?.maps) return;

    const placeName =
      prediction.structured_formatting?.main_text ||
      prediction.description.split(",")[0].trim();

    // Prefer PlacesService.getDetails if available for richer geometry and place metadata
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: [
            "name",
            "formatted_address",
            "geometry",
            "address_components",
          ],
        },
        (place, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place &&
            place.geometry?.location
          ) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            smoothFlyTo(lat, lng, 16);
            handlePositionChange(lat, lng, place as any, place.name || placeName, true);
            return;
          }

          // Fallback to Geocoder
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ placeId: prediction.place_id }, (results, gStatus) => {
            if (gStatus === window.google.maps.GeocoderStatus.OK && results && results[0]) {
              const gPlace = results[0];
              const lat = gPlace.geometry.location.lat();
              const lng = gPlace.geometry.location.lng();

              smoothFlyTo(lat, lng, 16);
              handlePositionChange(lat, lng, gPlace as any, placeName, true);
            }
          });
        },
      );
    } else {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const place = results[0];
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          smoothFlyTo(lat, lng, 16);
          handlePositionChange(lat, lng, place as any, placeName, true);
        }
      });
    }
  };

  // Map Loaded callback
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (typeof window !== "undefined" && window.google?.maps?.places) {
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          map,
        );
      }
      if (initialPosition) {
        map.panTo(initialPosition);
      }
    },
    [initialPosition],
  );

  // Sync initialPosition
  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
      if (mapRef.current) {
        mapRef.current.panTo(initialPosition);
      }
      if (!resolvedAddress && isLoaded && !readOnly) {
        handlePositionChange(initialPosition.lat, initialPosition.lng, undefined, undefined, true);
      }
    }
  }, [initialPosition?.lat, initialPosition?.lng, isLoaded, readOnly]);

  // GPS Locate Current Position
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        smoothFlyTo(userPos.lat, userPos.lng, 16);
        handlePositionChange(userPos.lat, userPos.lng, undefined, undefined, true);
        setLocating(false);
      },
      (err) => {
        console.error("GPS locating failed:", err);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Handle map click
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (readOnly || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      handlePositionChange(lat, lng);
    },
    [readOnly, handlePositionChange],
  );

  // Handle marker drag
  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (readOnly || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      handlePositionChange(lat, lng, undefined, undefined, true);
    },
    [readOnly, handlePositionChange],
  );

  // Marker icon styling
  const customMarkerIcon = React.useMemo(() => {
    if (
      !isLoaded ||
      typeof window === "undefined" ||
      !window.google?.maps?.Size ||
      !window.google?.maps?.Point
    ) {
      return undefined;
    }
    return {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
        <svg viewBox="0 0 100 100" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 95 C 45 80, 20 55, 20 38 A 30 30 0 1 1 80 38 C 80 55, 55 80, 50 95 Z" fill="#0369A1" stroke="#082F49" stroke-width="2.5" filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.35))"/>
          <circle cx="50" cy="38" r="19" fill="#FFFFFF"/>
          <path d="M50 28 C 48.5 26.5, 46 26.5, 44.5 28 C 43 29.5, 43 32, 44.5 33.5 L 50 39 L 55.5 33.5 C 57 32, 57 29.5, 55.5 28 C 54 26.5, 51.5 26.5, 50 28 Z" fill="#EF4444"/>
          <path d="M37 42 C 40 45, 45 47, 50 47 C 55 47, 60 45, 63 42 C 64 41, 63.5 39, 61.5 40 C 58.5 41.5, 54.5 42.5, 50 42.5 C 45.5 42.5, 41.5 41.5, 38.5 40 C 36.5 39, 36 41, 37 42 Z" fill="#0369A1"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(48, 48),
      anchor: new window.google.maps.Point(24, 48),
    };
  }, [isLoaded]);

  if (loadError) {
    return (
      <div
        style={{ height }}
        className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-900 bg-rose-50 flex flex-col items-center justify-center p-6 text-center gap-3"
      >
        <AlertTriangle className="w-8 h-8 text-rose-600" />
        <p className="text-sm font-bold text-slate-900">
          Failed to load Google Maps
        </p>
        <p className="text-xs text-slate-500 max-w-md">
          Please verify your Google Maps API key and network connection.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-900"
      >
        <TetrisLoading
          size="sm"
          speed="normal"
          showLoadingText={true}
          loadingText="Loading Google Maps..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {/* 1. SEPARATELY CODED SEARCH BOX OUTSIDE THE MAP (WITH 3-CHAR DEBOUNCE) */}
      {!readOnly && (
        <div ref={searchContainerRef} className="relative space-y-2 z-30">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-slate-900 px-3.5 h-12 shadow-sm focus-within:border-sky-800 transition-colors">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (predictions.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search hospital, community hall, street or PIN (min 3 chars)..."
                  className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />

                {/* Loading indicator or clear button */}
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-sky-800 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPredictions([]);
                      setShowDropdown(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Debounced Place Predictions Dropdown */}
              {showDropdown && predictions.length > 0 && (
                <div className="absolute top-14 left-0 right-0 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {predictions.map((p) => (
                    <button
                      key={p.place_id}
                      type="button"
                      onClick={() => handleSelectPrediction(p)}
                      className="w-full text-left p-3 hover:bg-sky-50 transition-all flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-sky-100 flex items-center justify-center text-slate-600 group-hover:text-sky-800 shrink-0 mt-0.5 border border-slate-300">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 truncate group-hover:text-sky-900">
                          {p.structured_formatting?.main_text || p.description}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {p.structured_formatting?.secondary_text || ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Locate Me Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              className="h-12 px-3.5 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center gap-1.5 text-slate-900 hover:bg-sky-50 hover:border-sky-800 transition-all font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
              title="Use Current GPS Location"
            >
              {locating ? (
                <div className="w-4 h-4 border-2 border-sky-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Locate className="w-4 h-4 text-sky-800" />
              )}
              <span className="hidden sm:inline">GPS</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. PURE MAP CANVAS (EVERY CONTROLLER REMOVED WITH MOVING MAP TRANSITION) */}
      <div
        style={{ height }}
        className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-900 z-10 bg-slate-100 shadow-inner"
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={position}
          zoom={15}
          mapTypeId={mapTypeId}
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            disableDefaultUI: true, // REMOVES ALL GOOGLE CONTROLLERS
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
          }}
        >
          <MarkerF
            position={position}
            draggable={!readOnly}
            onDragEnd={handleMarkerDragEnd}
            icon={customMarkerIcon}
            animation={
              markerAnimation ??
              (isLoaded &&
              typeof window !== "undefined" &&
              window.google?.maps?.Animation
                ? window.google.maps.Animation.DROP
                : undefined)
            }
          />
        </GoogleMap>

        {/* Dynamic moving map flight animation badge */}
        {isFlying && (
          <div className="absolute top-3 right-3 z-20 bg-sky-900/95 text-white px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-lg border border-sky-400/50 animate-pulse">
            <Navigation2 className="w-3.5 h-3.5 text-sky-300 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Flying to Venue…
            </span>
          </div>
        )}

        {/* Loading overlay badge when reverse-geocoding */}
        {addressLoading && (
          <div className="absolute top-3 left-3 z-20 bg-slate-900/90 text-white px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-md">
            <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-[9px] font-black uppercase tracking-wider">
              Pinning Venue…
            </span>
          </div>
        )}
      </div>

      {/* 3. INTELLIGENT LOCATION DETAILS STATUS BADGE BELOW MAP */}
      {!readOnly && resolvedAddress && (
        <div className="p-3 bg-sky-50/70 rounded-xl border-2 border-sky-800/30 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 min-w-0">
            <MapPin className="w-4 h-4 text-sky-800 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-black text-slate-900 truncate">
                {resolvedAddress.establishment || "Selected Map Venue"}
              </p>
              <p className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-0.5">
                {resolvedAddress.display_name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                🌐 Lat: {position.lat.toFixed(5)}, Lng: {position.lng.toFixed(5)}
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-[10px] font-extrabold uppercase shrink-0">
            Pinned
          </span>
        </div>
      )}
    </div>
  );
}
