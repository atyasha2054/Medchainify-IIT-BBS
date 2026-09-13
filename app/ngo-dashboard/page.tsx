"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { indianStatesAndCities } from "@/lib/states";
import { validatePincode } from "@/lib/pincode-validator";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";

// Lucide icons
import {
  Building2,
  MapPin,
  Compass,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Check,
  Edit2,
  X,
  Save,
  ChevronLeft,
  Upload,
  Image as ImageIcon,
  Building,
  ExternalLink,
} from "lucide-react";

// Dynamic import for GoogleLocationPicker
const GoogleLocationPicker = dynamic(
  () => import("@/components/GoogleLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-87.5 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-slate-900">
        <TetrisLoading
          size="sm"
          speed="normal"
          showLoadingText={true}
          loadingText="Loading Google Maps..."
        />
      </div>
    ),
  },
);

// Predefined 11 NGO purposes with modern icons and styling
const NGO_PURPOSES = [
  { id: "health", label: "Healthcare & Medical Aid", icon: "🏥" },
  { id: "education", label: "Education & Literacy", icon: "📚" },
  { id: "environment", label: "Environmental Conservation", icon: "🌳" },
  { id: "women", label: "Women Empowerment", icon: "👩" },
  { id: "child", label: "Child Welfare & Protection", icon: "👶" },
  { id: "poverty", label: "Poverty Alleviation & Food", icon: "🍞" },
  { id: "animal", label: "Animal Welfare", icon: "🐾" },
  { id: "rural", label: "Rural Development", icon: "🚜" },
  { id: "disaster", label: "Disaster Relief & Rehab", icon: "🆘" },
  { id: "art", label: "Art, Culture & Heritage", icon: "🎨" },
  { id: "science", label: "Science & Tech Innovation", icon: "🔬" },
];

export default function NgoDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // NGO Data State
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode Toggle
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit Form Fields State
  const [ngoName, setNgoName] = useState("");
  const [tagline, setTagline] = useState("");
  const [ngoLogo, setNgoLogo] = useState("");
  const [address, setAddress] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState<any>(null);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [foundingMembers, setFoundingMembers] = useState(3);
  const [description, setDescription] = useState("");

  // Validation / UI status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);
  const [pincodeMsg, setPincodeMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const availableCities = selectedState
    ? indianStatesAndCities[selectedState] || []
    : [];

  // Protect Route
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Fetch NGO data
  const fetchNgoDetails = async () => {
    try {
      const res = await fetch("/api/ngo");
      if (!res.ok) throw new Error("Failed to fetch NGO details");
      const data = await res.json();
      if (data.ngo) {
        setNgo(data.ngo);
        // Initialize form fields
        setNgoName(data.ngo.name);
        setTagline(data.ngo.tagline);
        setNgoLogo(data.ngo.logo);
        setAddress(data.ngo.address);
        setSelectedState(data.ngo.state);
        setSelectedCity(data.ngo.city);
        setPincode(data.ngo.pincode);
        setLandmark(data.ngo.landmark);
        setSelectedPurposes(data.ngo.selectedPurposes || []);
        setFoundingMembers(
          data.ngo.foundingMembers !== undefined ? data.ngo.foundingMembers : 3,
        );
        setDescription(data.ngo.description);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error loading NGO profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchNgoDetails();
    }
  }, [status]);

  // Sync validation status when state/city/pincode updates
  useEffect(() => {
    if (selectedState && selectedCity && pincode.length === 6) {
      const result = validatePincode(selectedState, selectedCity, pincode);
      setPincodeValid(result.isValid);
      setPincodeMsg(result.message || "Valid PIN Code");
      if (result.isValid) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.pincode;
          return next;
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          pincode: result.message || "Invalid Pincode for chosen city/state.",
        }));
      }
    } else {
      setPincodeValid(null);
      setPincodeMsg("");
    }
  }, [pincode, selectedState, selectedCity]);

  // Debounced unique name checking
  useEffect(() => {
    if (
      !isEditMode ||
      ngoName.trim().length < 2 ||
      ngoName.trim().toLowerCase() === ngo?.name?.toLowerCase()
    ) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.ngoName;
        return next;
      });
      return;
    }

    const checkNameUnique = async () => {
      try {
        const res = await fetch(
          `/api/ngo/check-name?name=${encodeURIComponent(ngoName.trim())}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.available) {
          setErrors((prev) => ({
            ...prev,
            ngoName:
              "This NGO name is already registered. Please choose a unique name.",
          }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.ngoName;
            return next;
          });
        }
      } catch (err) {
        console.error("Name check error:", err);
      }
    };

    const timer = setTimeout(checkNameUnique, 400);
    return () => clearTimeout(timer);
  }, [ngoName, isEditMode, ngo]);

  // Logo Upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNgoLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Tagline Generator
  const handleGenerateTagline = async () => {
    if (!ngoName.trim()) {
      toast.warning("Please enter the NGO name first.");
      return;
    }
    setIsGeneratingTagline(true);
    try {
      const res = await fetch("/api/ai/tagline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoName }),
      });
      if (!res.ok) throw new Error("Failed to generate tagline");
      const data = await res.json();
      setTagline(data.tagline.slice(0, 70));
    } catch (error) {
      console.error(error);
      const fallbacks = [
        `Empowering change for a better tomorrow.`,
        `Dedicated to service, healthcare, and community upliftment.`,
        `Spreading hope and healing through collaborative aid.`,
      ];
      setTagline(
        fallbacks[Math.floor(Math.random() * fallbacks.length)].slice(0, 70),
      );
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  // Description Generator
  const handleGenerateDescription = async () => {
    if (!ngoName.trim() || !tagline.trim() || selectedPurposes.length === 0) {
      toast.warning("Name, tagline, and purposes must be set first.");
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ngoName, tagline, selectedPurposes }),
      });
      if (!res.ok) throw new Error("Failed to generate description");
      const data = await res.json();
      setDescription(data.description.slice(0, 500));
    } catch (error) {
      console.error(error);
      const fallback =
        `Established to drive meaningful change, our organization focuses on key developmental areas including ${selectedPurposes.map((p) => p.toUpperCase()).join(", ")}. Guided by our vision, "${tagline}", we aim to uplift and support the community. We work towards creating sustainable solutions, implementing programs that address critical needs.`.slice(
          0,
          500,
        );
      setDescription(fallback);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Purposes handler
  const handlePurposeChange = (id: string) => {
    setSelectedPurposes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      } else {
        if (prev.length >= 5) return prev;
        return [...prev, id];
      }
    });
  };

  // Location select handler
  const handleLocationSelect = (location: any) => {
    setLandmark({
      lat: location.lat,
      lng: location.lng,
      addressDetails: location.address,
    });

    if (location.address) {
      const parts = [];
      if (location.address.establishment)
        parts.push(location.address.establishment);
      if (location.address.display_name)
        parts.push(location.address.display_name);
      const geocodedAddress = parts.join(", ").slice(0, 200);
      if (!address.trim()) {
        setAddress(geocodedAddress);
      }

      if (location.address.state) {
        const stateKey = Object.keys(indianStatesAndCities).find(
          (s) => s.toLowerCase() === location.address.state.toLowerCase(),
        );
        if (stateKey) {
          setSelectedState(stateKey);
          if (
            location.address.city ||
            location.address.town ||
            location.address.village
          ) {
            const cityName =
              location.address.city ||
              location.address.town ||
              location.address.village;
            const matchCity = indianStatesAndCities[stateKey].find(
              (c) => c.toLowerCase() === cityName.toLowerCase(),
            );
            if (matchCity) setSelectedCity(matchCity);
          }
        }
      }

      if (location.address.pincode) {
        const code = location.address.pincode.replace(/\s/g, "");
        if (code.length === 6 && !isNaN(Number(code))) {
          setPincode(code);
        }
      }
    }
  };

  // Save changes
  const handleSaveChanges = async () => {
    const nameTrimmed = ngoName.trim();
    if (
      !nameTrimmed ||
      !tagline.trim() ||
      !address.trim() ||
      !selectedState ||
      !selectedCity ||
      !pincode ||
      !landmark ||
      selectedPurposes.length === 0 ||
      !description.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (nameTrimmed.length < 4 || nameTrimmed.length > 30) {
      toast.error(
        "NGO Legal Name must consist of at least 4 characters and at most 30 characters.",
      );
      return;
    }

    if (errors.ngoName || errors.pincode) {
      toast.error("Please resolve validation errors first.");
      return;
    }

    setIsSaving(true);
    const run = async () => {
      let finalLogoUrl = ngoLogo;

      // Upload logo to Cloudinary if base64 Data URI
      if (ngoLogo && ngoLogo.startsWith("data:image/")) {
        const resBlob = await fetch(ngoLogo);
        const blob = await resBlob.blob();
        const file = new File([blob], "logo.png", { type: blob.type });

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Failed to upload image.");
        }

        const uploadData = await uploadRes.json();
        finalLogoUrl = uploadData.secure_url;

        // Delete old logo from Cloudinary if it was a valid Cloudinary URL
        if (ngo && ngo.logo && ngo.logo.includes("cloudinary.com")) {
          try {
            await fetch("/api/delete-image", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: ngo.logo }),
            });
          } catch (delErr) {
            console.error("Failed to delete old image:", delErr);
          }
        }
      }

      const res = await fetch("/api/ngo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ngoName,
          tagline,
          logo: finalLogoUrl,
          address,
          state: selectedState,
          city: selectedCity,
          pincode,
          landmark,
          selectedPurposes,
          foundingMembers,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      setNgo(data.ngo);
      setIsEditMode(false);
      return data;
    };

    toast
      .promise(run(), {
        pending: "Saving NGO details...",
        success: "NGO details updated successfully!",
        error: {
          render({ data }: any) {
            return data?.message || "An error occurred while saving";
          },
        },
      })
      .finally(() => setIsSaving(false));
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    if (ngo) {
      setNgoName(ngo.name);
      setTagline(ngo.tagline);
      setNgoLogo(ngo.logo);
      setAddress(ngo.address);
      setSelectedState(ngo.state);
      setSelectedCity(ngo.city);
      setPincode(ngo.pincode);
      setLandmark(ngo.landmark);
      setSelectedPurposes(ngo.selectedPurposes || []);
      setFoundingMembers(
        ngo.foundingMembers !== undefined ? ngo.foundingMembers : 3,
      );
      setDescription(ngo.description);
    }
    setErrors({});
    setIsEditMode(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 relative">
        <BackgroundPattern />
        <div className="relative z-10">
          <TetrisLoading
            size="lg"
            speed="normal"
            showLoadingText={true}
            loadingText="Loading NGO Dashboard..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32 relative">
      <BackgroundPattern />

      <div className="w-full max-w-[90%] space-y-12 relative z-10">
        {/* NGO NOT REGISTERED CALL-TO-ACTION */}
        {!ngo ? (
          <div className="max-w-xl mx-auto bg-white border-2 border-slate-900 rounded-[2rem] p-8 text-center shadow-xl space-y-6">
            <div className="w-16 h-16 bg-sky-50 text-sky-800 rounded-full border-2 border-slate-900 flex items-center justify-center mx-auto">
              <Building className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-slate-900">
                No NGO Profile Found
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                You have not created an NGO profile yet. Register your NGO to
                start integrating with telemedicine and logistics networks.
              </p>
            </div>
            <button
              onClick={() => router.push("/create-ngo")}
              className="w-full py-4 bg-sky-800 text-white border-2 border-slate-900 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-md active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              Incorporate Your NGO
            </button>
          </div>
        ) : (
          <>
            {/* DASHBOARD HEADER */}
            <div className="bg-white border-2 border-slate-900 shadow-xl rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row">
                <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {ngoLogo ? (
                    <img
                      src={ngoLogo}
                      alt="NGO Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight truncate max-w-100">
                      {ngoName}
                    </h1>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                      Active Partner
                    </span>
                  </div>
                  <p className="text-slate-500 italic text-sm mt-1">
                    &ldquo;{tagline}&rdquo;
                  </p>
                </div>
              </div>

              {/* Action Toggle buttons */}
              <div className="flex gap-3 shrink-0 items-center">
                {!isEditMode ? (
                  <>
                    <button
                      onClick={() => router.push("/create-campaign")}
                      className="px-5 py-3 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-blue-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Create Campaign
                    </button>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-5 py-3 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="px-5 py-3 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="px-5 py-3 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-sky-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {isSaving ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* DASHBOARD DETAILS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: BRANDING AND OBJECTIVES */}
              <div className="lg:col-span-7 space-y-8">
                {/* BRANDING CARD */}
                <Card className="border-2 border-slate-900 shadow-lg rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-900">
                      <Building2 className="w-6 h-6 text-sky-800" />
                      <h2 className="text-lg font-black uppercase text-slate-900">
                        Branding & Co-founders
                      </h2>
                    </div>

                    {isEditMode ? (
                      <div className="space-y-5">
                        {/* Logo upload */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                            NGO Logo Image
                          </label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 border-2 border-slate-900 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                              {ngoLogo ? (
                                <img
                                  src={ngoLogo}
                                  alt="Logo"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <button
                                type="button"
                                className="px-4 py-2 bg-white text-slate-900 border-2 border-slate-900 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                Replace Logo
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Name input */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            NGO Legal Name{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={ngoName}
                            onChange={(e) => setNgoName(e.target.value)}
                            className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium ${
                              errors.ngoName ? "border-red-500" : ""
                            }`}
                          />
                          {errors.ngoName && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.ngoName}
                            </p>
                          )}
                        </div>

                        {/* Tagline input */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                                NGO Tagline{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={handleGenerateTagline}
                                disabled={isGeneratingTagline}
                                className="px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 text-[9px] font-bold rounded transition-all cursor-pointer"
                              >
                                {isGeneratingTagline
                                  ? "Generating..."
                                  : "AI Generate"}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {tagline.length}/70
                            </span>
                          </div>
                          <input
                            type="text"
                            value={tagline}
                            onChange={(e) =>
                              setTagline(e.target.value.slice(0, 70))
                            }
                            className="w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium"
                          />
                        </div>

                        {/* Co-founder volume slider */}
                        <div className="space-y-3 pt-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            Number of Co-founders Present{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3 w-full">
                              <button
                                type="button"
                                onClick={() =>
                                  setFoundingMembers((p) => Math.max(0, p - 1))
                                }
                                disabled={foundingMembers <= 0}
                                className="p-2 bg-white border-2 border-slate-900 rounded-full disabled:opacity-50"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <div className="flex-1 flex justify-between items-end gap-1 h-10 px-3 py-1 bg-slate-200 rounded-lg">
                                {Array.from({ length: 10 }).map((_, index) => {
                                  const level = index + 1;
                                  const isActive = level <= foundingMembers;
                                  const barHeight = `${15 + index * 8.5}%`;
                                  return (
                                    <div
                                      key={level}
                                      onClick={() => setFoundingMembers(level)}
                                      style={{ height: barHeight }}
                                      className={`flex-1 rounded-sm cursor-pointer transition-all duration-200 ${
                                        isActive
                                          ? "bg-emerald-500"
                                          : "bg-slate-300"
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setFoundingMembers((p) => Math.min(10, p + 1))
                                }
                                disabled={foundingMembers >= 10}
                                className="p-2 bg-white border-2 border-slate-900 rounded-full disabled:opacity-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-black text-sky-900 flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {foundingMembers} Co-founders Present (
                              {foundingMembers === 0
                                ? "Sole Founder Structure"
                                : foundingMembers <= 4
                                  ? "Executive Board"
                                  : "General Council"}
                              )
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              NGO Partner ID
                            </p>
                            <p className="font-mono text-xs font-bold text-slate-900 mt-1">
                              {ngo._id}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Co-founders Registered
                            </p>
                            <p className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-1 text-sm">
                              <Users className="w-4 h-4 text-sky-850" />
                              {foundingMembers} Co-founders Present
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wide">
                              Structure:{" "}
                              {foundingMembers === 0
                                ? "Sole Founder Structure"
                                : foundingMembers <= 4
                                  ? "Executive Board"
                                  : "General Council"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                              Partner Joined Date
                            </p>
                            <p className="font-bold text-slate-950 mt-1 text-sm">
                              {ngo.createdAt
                                ? new Date(ngo.createdAt).toLocaleDateString(
                                    "en-IN",
                                  )
                                : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TARGET OBJECTIVES / FOCUS AREAS CARD */}
                <Card className="border-2 border-slate-900 shadow-lg rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
                      <div className="flex items-center gap-3">
                        <Compass className="w-6 h-6 text-sky-800" />
                        <h2 className="text-lg font-black uppercase text-slate-900">
                          Focus Objectives
                        </h2>
                      </div>
                      {isEditMode && (
                        <span className="text-xs px-2.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-full font-bold">
                          {selectedPurposes.length} / 5 Selected
                        </span>
                      )}
                    </div>

                    {isEditMode ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-2 border-slate-900 p-2.5 rounded-xl bg-slate-50 max-h-50 overflow-y-auto pr-1">
                        {NGO_PURPOSES.map((pur) => {
                          const isSelected = selectedPurposes.includes(pur.id);
                          const isMax = selectedPurposes.length >= 5;
                          const isDisabled = isMax && !isSelected;

                          return (
                            <div
                              key={pur.id}
                              onClick={() =>
                                !isDisabled && handlePurposeChange(pur.id)
                              }
                              className={`flex items-start gap-2.5 p-2 rounded-xl border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-sky-50 border-slate-900 text-sky-900 font-bold shadow-sm"
                                  : isDisabled
                                    ? "opacity-50 cursor-not-allowed border-slate-200"
                                    : "bg-white border-slate-200 hover:border-slate-900"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => {}}
                                className="w-4 h-4 text-sky-600 rounded mt-0.5"
                              />
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {pur.icon} {pur.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        {selectedPurposes.map((id) => {
                          const pur = NGO_PURPOSES.find((p) => p.id === id);
                          return (
                            <div
                              key={id}
                              className="px-3.5 py-1.5 bg-sky-50 border-2 border-slate-900 text-sky-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                            >
                              <span>{pur?.icon}</span>
                              <span>{pur?.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* MISSION STATEMENT CARD */}
                <Card className="border-2 border-slate-900 shadow-lg rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-6 h-6 text-sky-800" />
                        <h2 className="text-lg font-black uppercase text-slate-900">
                          Detailed Mission Statement
                        </h2>
                      </div>
                      {isEditMode && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDescription}
                            className="px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 text-[9px] font-bold rounded transition-all cursor-pointer"
                          >
                            {isGeneratingDescription
                              ? "Generating..."
                              : "AI Generate"}
                          </button>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {description.length}/500
                          </span>
                        </div>
                      )}
                    </div>

                    {isEditMode ? (
                      <textarea
                        rows={5}
                        value={description}
                        onChange={(e) =>
                          setDescription(e.target.value.slice(0, 500))
                        }
                        className="w-full p-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium resize-none"
                      />
                    ) : (
                      <p className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-900 text-slate-800 italic leading-relaxed text-sm font-serif shadow-inner">
                        &ldquo;{description}&rdquo;
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN: LOCATION & GOOGLE MAP */}
              <div className="lg:col-span-5 space-y-8">
                {/* LOCATION CARD */}
                <Card className="border-2 border-slate-900 shadow-lg rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-900">
                      <MapPin className="w-6 h-6 text-emerald-600" />
                      <h2 className="text-lg font-black uppercase text-slate-900">
                        Headquarters Address
                      </h2>
                    </div>

                    {isEditMode ? (
                      <div className="space-y-4">
                        {/* State & City inputs */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                              State
                            </label>
                            <select
                              value={selectedState}
                              onChange={(e) => {
                                setSelectedState(e.target.value);
                                setSelectedCity("");
                              }}
                              className="w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 text-xs font-bold cursor-pointer"
                            >
                              <option value="">Select State</option>
                              {Object.keys(indianStatesAndCities).map(
                                (state) => (
                                  <option key={state} value={state}>
                                    {state}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                              City
                            </label>
                            <select
                              value={selectedCity}
                              onChange={(e) => setSelectedCity(e.target.value)}
                              disabled={!selectedState}
                              className="w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 text-xs font-bold cursor-pointer disabled:opacity-50"
                            >
                              <option value="">Select City</option>
                              {availableCities.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Pincode */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            Pincode
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={pincode}
                            onChange={(e) =>
                              setPincode(e.target.value.replace(/\D/g, ""))
                            }
                            className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 text-sm font-medium ${
                              errors.pincode
                                ? "border-red-500"
                                : pincodeValid
                                  ? "border-emerald-500"
                                  : ""
                            }`}
                          />
                          {pincodeValid && pincodeMsg && (
                            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {pincodeMsg}
                            </p>
                          )}
                        </div>

                        {/* Full Address */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            Office Address
                          </label>
                          <textarea
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 text-sm font-medium resize-none"
                          />
                        </div>

                        {/* Google Map picker */}
                        <div className="space-y-2 pt-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            Map Marker Position
                          </label>
                          <GoogleLocationPicker
                            onLocationSelect={handleLocationSelect}
                            initialPosition={
                              landmark
                                ? { lat: landmark.lat, lng: landmark.lng }
                                : null
                            }
                            height="450px"
                            mapTypeId="hybrid"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="space-y-2.5">
                          <p className="text-slate-800 font-extrabold text-sm leading-relaxed">
                            {address}
                          </p>
                          <p className="text-slate-500 font-bold text-xs uppercase tracking-wide">
                            {selectedCity}, {selectedState} - PIN {pincode}
                          </p>
                        </div>

                        {landmark && (
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                            {landmark.addressDetails?.display_name && (
                              <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">
                                  NGO Landmark
                                </p>
                                <p className="text-slate-800 font-extrabold text-xs mt-1">
                                  📍{" "}
                                  {landmark.addressDetails.establishment
                                    ? `${landmark.addressDetails.establishment} - `
                                    : ""}
                                  {landmark.addressDetails.display_name}
                                </p>
                              </div>
                            )}
                            <div className="text-xs font-bold font-mono text-slate-500 flex items-center gap-1">
                              <span>
                                🌐 GPS Latitude: {landmark.lat?.toFixed(5)}
                              </span>
                              <span className="mx-2">|</span>
                              <span>Longitude: {landmark.lng?.toFixed(5)}</span>
                            </div>
                            <div className="w-full h-112.5 rounded-2xl overflow-hidden border-2 border-slate-900">
                              <GoogleLocationPicker
                                onLocationSelect={() => {}}
                                initialPosition={{
                                  lat: landmark.lat,
                                  lng: landmark.lng,
                                }}
                                readOnly={true}
                                height="450px"
                                mapTypeId="hybrid"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
