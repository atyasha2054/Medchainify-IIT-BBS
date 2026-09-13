"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { indianStatesAndCities } from "@/lib/states";
import { validatePincode } from "@/lib/pincode-validator";
import BackgroundPattern from "@/components/BackgroundPattern";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import TetrisLoading from "@/components/ui/tetris-loader";

// Lucide icons for gorgeous styling
import {
  Building2,
  MapPin,
  Compass,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  Building,
  HeartHandshake,
  Upload,
  Image as ImageIcon,
  FileCode,
  FileCheck,
  RotateCcw,
  Sparkle,
} from "lucide-react";

// Dynamic import for GoogleLocationPicker
const GoogleLocationPicker = dynamic(
  () => import("@/components/GoogleLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-87.5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
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
  {
    id: "health",
    label: "Healthcare & Medical Aid",
    icon: "🏥",
    desc: "Providing treatments, clinics, and medical supplies.",
  },
  {
    id: "education",
    label: "Education & Literacy",
    icon: "📚",
    desc: "Funding schools, scholarships, and teaching children.",
  },
  {
    id: "environment",
    label: "Environmental Conservation",
    icon: "🌳",
    desc: "Afforestation, waste management, and clean energy.",
  },
  {
    id: "women",
    label: "Women Empowerment",
    icon: "👩",
    desc: "Skill development, safety, and gender equality programs.",
  },
  {
    id: "child",
    label: "Child Welfare & Protection",
    icon: "👶",
    desc: "Protecting children, orphanage support, and nutrition.",
  },
  {
    id: "poverty",
    label: "Poverty Alleviation & Food",
    icon: "🍞",
    desc: "Rations distribution, soup kitchens, and basic shelter.",
  },
  {
    id: "animal",
    label: "Animal Welfare",
    icon: "🐾",
    desc: "Stray rescue, veterinary care, and shelter operations.",
  },
  {
    id: "rural",
    label: "Rural Development",
    icon: "🚜",
    desc: "Water sanitation, farming assistance, and local infra.",
  },
  {
    id: "disaster",
    label: "Disaster Relief & Rehab",
    icon: "🆘",
    desc: "Emergency rescue, supplies, and rebuilding lives post-disaster.",
  },
  {
    id: "art",
    label: "Art, Culture & Heritage",
    icon: "🎨",
    desc: "Preserving monuments, regional arts, and local crafts.",
  },
  {
    id: "science",
    label: "Science & Tech Innovation",
    icon: "🔬",
    desc: "Fostering local tech hubs, digital training, and research.",
  },
];

export default function CreateNgoPage() {
  const router = useRouter();
  // Current step (1, 2, 3, or 4 for Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields State
  const [ngoName, setNgoName] = useState("");
  const [tagline, setTagline] = useState("");
  const [ngoLogo, setNgoLogo] = useState<string>(""); // Base64 string

  const [address, setAddress] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState<{
    lat: number;
    lng: number;
    addressDetails?: any;
  } | null>(null);

  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);

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

  const [foundingMembers, setFoundingMembers] = useState(3);
  const [description, setDescription] = useState("");
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);

  const handleGenerateTagline = async () => {
    if (!ngoName.trim()) {
      setErrors((prev) => ({
        ...prev,
        tagline: "NGO name is required to generate tagline.",
      }));
      return;
    }
    setIsGeneratingTagline(true);
    try {
      const res = await fetch("/api/ai/tagline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ngoName }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate tagline via API");
      }

      const data = await res.json();
      if (data.tagline) {
        setTagline(data.tagline.slice(0, 70));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.tagline;
          return next;
        });
      }
    } catch (err) {
      console.error("AI tagline generation error:", err);
      // Fallback tagline generation based on NGO name
      const fallbacks = [
        `Empowering change for a better tomorrow.`,
        `Dedicated to service, healthcare, and upliftment.`,
        `Spreading hope and healing through community aid.`,
        `Providing medical support and care where it matters.`,
      ];
      setTagline(
        fallbacks[Math.floor(Math.random() * fallbacks.length)].slice(0, 70),
      );
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const handleGenerateDescription = async () => {
    if (!ngoName.trim() || !tagline.trim() || selectedPurposes.length === 0) {
      setErrors((prev) => ({
        ...prev,
        description:
          "NGO Name, Tagline, and at least 1 Focus Purpose are required to generate description.",
      }));
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const res = await fetch("/api/ai/description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ngoName,
          tagline,
          selectedPurposes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate description via API");
      }

      const data = await res.json();
      if (data.description) {
        setDescription(data.description.slice(0, 500));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.description;
          return next;
        });
      }
    } catch (err) {
      console.error("AI description generation error:", err);
      // Fallback description based on purposes and tagline
      const fallback =
        `Established to drive meaningful change, our organization focuses on key developmental areas including ${selectedPurposes.map((p) => p.toUpperCase()).join(", ")}. Guided by our vision, "${tagline}", we aim to uplift and support the community. We work towards creating sustainable solutions, implementing programs that address critical needs, and collaborating with local networks to maximize our impact.`.slice(
          0,
          500,
        );
      setDescription(fallback);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // UI status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pincodeValid, setPincodeValid] = useState<boolean | null>(null);
  const [pincodeMsg, setPincodeMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [checkingNgo, setCheckingNgo] = useState(true);

  // Check if user already has an NGO registered
  useEffect(() => {
    const checkUserNgo = async () => {
      try {
        const res = await fetch("/api/ngo");
        if (res.ok) {
          const data = await res.json();
          if (data.ngo) {
            router.replace("/ngo-dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Error checking user NGO:", err);
      }
      setCheckingNgo(false);
    };
    checkUserNgo();
  }, [router]);

  // Dynamic Cities list based on selected state
  const availableCities = selectedState
    ? indianStatesAndCities[selectedState] || []
    : [];

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("medchainify_ngo_draft");
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.ngoName) setNgoName(draft.ngoName);
        if (draft.tagline) setTagline(draft.tagline);
        if (draft.ngoLogo) setNgoLogo(draft.ngoLogo);
        if (draft.address) setAddress(draft.address);
        if (draft.selectedState) setSelectedState(draft.selectedState);
        if (draft.selectedCity) setSelectedCity(draft.selectedCity);
        if (draft.pincode) setPincode(draft.pincode);
        if (draft.landmark) setLandmark(draft.landmark);
        if (draft.selectedPurposes) setSelectedPurposes(draft.selectedPurposes);
        if (draft.foundingMembers !== undefined)
          setFoundingMembers(Math.max(0, draft.foundingMembers));
        if (draft.description) setDescription(draft.description);
        if (draft.currentStep) setCurrentStep(draft.currentStep);
      }
    } catch (error) {
      console.error("Error loading draft from localStorage:", error);
    }
  }, []);

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
    if (ngoName.trim().length < 2) {
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
  }, [ngoName]);

  // Save draft state to localStorage
  const saveDraft = (nextStep?: number) => {
    try {
      const draftData = {
        ngoName,
        tagline,
        ngoLogo,
        address,
        selectedState,
        selectedCity,
        pincode,
        landmark,
        selectedPurposes,
        foundingMembers,
        description,
        currentStep: nextStep || currentStep,
      };
      localStorage.setItem("medchainify_ngo_draft", JSON.stringify(draftData));

      // Trigger legacy react-toastify toast in the top right corner
      toast.success("Progress Draft Saved Successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error saving draft to localStorage:", error);
    }
  };

  // Image upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo: "Logo file size must be less than 2MB.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNgoLogo(reader.result as string);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.logo;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  // Step 1 Validation & Proceed
  const handleNextStep1 = () => {
    const newErrors: Record<string, string> = {};
    const nameTrimmed = ngoName.trim();
    if (!nameTrimmed) {
      newErrors.ngoName = "NGO Legal Name is required.";
    } else if (nameTrimmed.length < 4 || nameTrimmed.length > 30) {
      newErrors.ngoName =
        "NGO Legal Name must consist of at least 4 characters and at most 30 characters.";
    } else if (errors.ngoName) {
      newErrors.ngoName = errors.ngoName;
    }
    if (!tagline.trim()) newErrors.tagline = "A catchy tagline is required.";
    if (!ngoLogo) newErrors.logo = "An official logo upload is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    saveDraft(2);
    setCurrentStep(2);
  };

  // Step 2 Validation & Proceed
  const handleNextStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedState) newErrors.state = "State selection is required.";
    if (!selectedCity) newErrors.city = "City selection is required.";
    if (!pincode) {
      newErrors.pincode = "PIN Code is required.";
    } else if (pincodeValid === false) {
      newErrors.pincode = pincodeMsg || "Invalid PIN Code.";
    }
    if (!address.trim())
      newErrors.address = "Full registered address is required.";
    if (!landmark) newErrors.landmark = "Please select a landmark on the map.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    saveDraft(3);
    setCurrentStep(3);
  };

  // Step 3 Validation & Proceed
  const handleNextStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (selectedPurposes.length === 0) {
      newErrors.purposes = "Please select at least 1 focus purpose.";
    } else if (selectedPurposes.length > 5) {
      newErrors.purposes = "Maximum of 5 focus purposes can be chosen.";
    }
    if (!description.trim())
      newErrors.description = "A detailed description is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    saveDraft(4);
    setCurrentStep(4); // Enter review step
  };

  // Back navigation
  const handlePrevStep = () => {
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    saveDraft(prev);
  };

  // Map Selection Auto-fills
  const handleLocationSelect = (location: any) => {
    setLandmark({
      lat: location.lat,
      lng: location.lng,
      addressDetails: location.address,
    });

    if (location.address) {
      const parts = [];
      if (location.address.establishment) {
        parts.push(location.address.establishment);
      }
      if (location.address.display_name) {
        parts.push(location.address.display_name);
      }
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

  // Final submit handler
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalLogoUrl = ngoLogo;

      // Upload logo to Cloudinary if base64 Data URI
      if (ngoLogo && ngoLogo.startsWith("data:image/")) {
        try {
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
        } catch (uploadErr: any) {
          console.error("Cloudinary upload error:", uploadErr);
          setErrors((prev) => ({
            ...prev,
            submit:
              uploadErr.message ||
              "Failed to upload brand logo image to Cloudinary.",
          }));
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/ngo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ngoName,
          tagline,
          ngoLogo: finalLogoUrl,
          address,
          selectedState,
          selectedCity,
          pincode,
          landmark,
          selectedPurposes,
          foundingMembers,
          description,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          submit: result.error || "Failed to create NGO profile.",
        }));
        setIsSubmitting(false);
        return;
      }

      localStorage.removeItem("medchainify_ngo_draft"); // clear draft on success
      router.push("/ngo-dashboard");
    } catch (err) {
      console.error("Submission error:", err);
      setErrors((prev) => ({
        ...prev,
        submit: "An unexpected error occurred during submission.",
      }));
      setIsSubmitting(false);
    }
  };

  // Reset/Create new
  const resetForm = () => {
    setNgoName("");
    setTagline("");
    setNgoLogo("");
    setAddress("");
    setSelectedState("");
    setSelectedCity("");
    setPincode("");
    setLandmark(null);
    setSelectedPurposes([]);
    setFoundingMembers(3);
    setDescription("");
    setErrors({});
    setPincodeValid(null);
    setPincodeMsg("");
    setCurrentStep(1);
    setIsSubmitted(false);
  };

  // Step names
  const steps = [
    {
      num: 1,
      name: "Identity & Co-founders",
      desc: "Logo, Name & Co-founders",
    },
    { num: 2, name: "Location & Map", desc: "Address & Landmark" },
    { num: 3, name: "Focus & Mission", desc: "Purposes & Mission" },
    { num: 4, name: "Review & File", desc: "Final Verification" },
  ];

  if (checkingNgo) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 relative">
        <BackgroundPattern />
        <div className="relative z-10">
          <TetrisLoading
            size="lg"
            speed="normal"
            showLoadingText={true}
            loadingText="Verifying Registration Status..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32 relative">
      <BackgroundPattern />

      <div className="w-full max-w-[90%] space-y-12 relative z-10">
        {/* Header Title */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
            Create Your <span className="text-sky-800">NGO</span>
          </h1>
        </div>

        {/* Wizard Progress Stepper Indicator */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative flex justify-between items-center w-full">
            {/* Background Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full" />

            {/* Active Highlight Line */}
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-sky-800 z-0 rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />

            {steps.map((s) => {
              const isPassed = currentStep > s.num;
              const isActive = currentStep === s.num;

              return (
                <div
                  key={s.num}
                  className="relative z-10 flex flex-col items-center"
                >
                  <motion.button
                    type="button"
                    onClick={() => {
                      // Allow jumping backward to previous valid steps
                      if (s.num < currentStep) {
                        setCurrentStep(s.num);
                        saveDraft(s.num);
                      }
                    }}
                    disabled={s.num >= currentStep}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                      isPassed
                        ? "bg-sky-800 border-slate-900 text-white cursor-pointer"
                        : isActive
                          ? "bg-white border-slate-900 text-sky-800 font-extrabold shadow-md"
                          : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-5 h-5 stroke-3" />
                    ) : (
                      <span className="text-sm">{s.num}</span>
                    )}
                  </motion.button>
                  <div className="absolute top-14 text-center whitespace-nowrap hidden sm:block">
                    <p
                      className={`text-xs font-bold ${isActive ? "text-sky-800" : isPassed ? "text-slate-800" : "text-slate-400"}`}
                    >
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Layout */}
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-16">
              {/* LEFT COLUMN: THE STEPPED FORM PANEL */}
              <div className="lg:col-span-7 bg-white/95 backdrop-blur-sm border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden p-6 sm:p-8 min-h-125 flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {/* STEP 1: IDENTITY & BRANDING */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6 flex-1"
                    >
                      <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-sky-50 shadow-sm shrink-0">
                          <Building2 className="w-6 h-6 text-sky-900" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                            Branding & Co-founders
                          </h2>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                            Step 1: Choose logo, official name, tagline, and
                            co-founders count
                          </p>
                        </div>
                      </div>

                      {/* Logo Upload Dropzone */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                          NGO Logo / Seal{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                          {/* Image Box */}
                          <div className="relative w-32 h-32 mx-auto sm:mx-0 border-2 border-slate-900 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden group">
                            {ngoLogo ? (
                              <>
                                <img
                                  src={ngoLogo}
                                  alt="NGO Logo Preview"
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNgoLogo("")}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer"
                                >
                                  Change Logo
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-3 text-slate-400">
                                <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                                <span className="text-[10px] block mt-1 uppercase font-bold tracking-wider">
                                  No Logo
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Trigger File Input */}
                          <div className="sm:col-span-2 space-y-3">
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <button
                                type="button"
                                className="px-5 py-3 bg-white text-slate-900 border-2 border-slate-900 rounded-xl text-xs font-bold hover:bg-slate-900 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Upload className="w-4 h-4 text-slate-500" />
                                Upload Brand Logo Image
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal uppercase font-semibold">
                              PNG, JPG, WEBP formats. Max 2MB. Displayed on
                              certificates.
                            </p>
                          </div>
                        </div>
                        {errors.logo && (
                          <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.logo}
                          </p>
                        )}
                      </div>

                      {/* Name input */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                          NGO Legal Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={ngoName}
                          onChange={(e) => setNgoName(e.target.value)}
                          placeholder="e.g. Swasthya Welfare Foundation"
                          className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium placeholder:text-slate-300 ${
                            errors.ngoName
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }`}
                        />
                        {errors.ngoName && (
                          <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
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
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isGeneratingTagline
                                ? "Generating..."
                                : "AI Generate"}
                            </button>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tagline.length > 70 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}
                          >
                            {tagline.length}/70
                          </span>
                        </div>
                        <input
                          type="text"
                          value={tagline}
                          onChange={(e) =>
                            setTagline(e.target.value.slice(0, 70))
                          }
                          placeholder="e.g. Fostering medical access to rural India."
                          className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium placeholder:text-slate-300 ${
                            errors.tagline
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }`}
                        />
                        {errors.tagline && (
                          <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.tagline}
                          </p>
                        )}
                      </div>

                      {/* Co-founders Present volume toggle */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                          Number of Co-founders Present{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center gap-4">
                          <div className="flex items-center gap-3 w-full">
                            <button
                              type="button"
                              onClick={() =>
                                setFoundingMembers((prev) =>
                                  Math.max(0, prev - 1),
                                )
                              }
                              disabled={foundingMembers <= 0}
                              className="p-2.5 bg-white border-2 border-slate-900 rounded-full hover:bg-slate-100 disabled:opacity-45 disabled:cursor-not-allowed active:scale-95 transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            {/* Soundwave equalizer bars fanning up representing 1 to 10 */}
                            <div className="flex-1 flex justify-between items-end gap-1 h-12 px-3 py-1.5 bg-slate-200 rounded-lg">
                              {Array.from({ length: 10 }).map((_, index) => {
                                const level = index + 1;
                                const isActive = level <= foundingMembers;
                                const barHeight = `${15 + index * 9.3}%`;

                                let barBg = "bg-emerald-500 shadow-sm";
                                if (level > 7) {
                                  barBg = "bg-rose-500 shadow-sm";
                                } else if (level > 4) {
                                  barBg = "bg-amber-500 shadow-sm";
                                }

                                return (
                                  <div
                                    key={level}
                                    onClick={() => setFoundingMembers(level)}
                                    style={{ height: barHeight }}
                                    className={`flex-1 rounded-sm cursor-pointer transition-all duration-200 ${
                                      isActive
                                        ? barBg
                                        : "bg-slate-300 hover:bg-slate-400"
                                    }`}
                                  />
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setFoundingMembers((prev) =>
                                  Math.min(10, prev + 1),
                                )
                              }
                              disabled={foundingMembers >= 10}
                              className="p-2.5 bg-white border-2 border-slate-900 rounded-full hover:bg-slate-100 disabled:opacity-45 disabled:cursor-not-allowed active:scale-95 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-sky-800" />
                            <span className="text-lg font-black text-sky-900">
                              {foundingMembers} Co-founders Present
                            </span>
                            <span className="text-[10px] bg-sky-50 px-2 py-0.5 border border-sky-200 text-sky-800 rounded-full font-bold">
                              {foundingMembers === 0
                                ? "Sole Founder Structure"
                                : foundingMembers <= 4
                                  ? "Executive Board"
                                  : "General Council"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end pt-6 border-t-2 border-slate-900 mt-6">
                        <button
                          type="button"
                          onClick={handleNextStep1}
                          className="px-6 py-3.5 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          Next Step
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: LOCATION, ADDRESS & GOOGLE MAP */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6 flex-1"
                    >
                      <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-emerald-50 shadow-sm shrink-0">
                          <MapPin className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                            Office Address & Google Map
                          </h2>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                            Step 2: Enter location. Click or search on map to
                            pin office
                          </p>
                        </div>
                      </div>

                      {/* State and City drop-downs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            State <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedState}
                            onChange={(e) => {
                              setSelectedState(e.target.value);
                              setSelectedCity("");
                            }}
                            className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium cursor-pointer ${
                              errors.state
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                          >
                            <option value="">Select State</option>
                            {Object.keys(indianStatesAndCities).map((state) => (
                              <option
                                key={state}
                                value={state}
                                className="text-slate-900 bg-white"
                              >
                                {state}
                              </option>
                            ))}
                          </select>
                          {errors.state && (
                            <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.state}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            City / District{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            disabled={!selectedState}
                            className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              errors.city
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }`}
                          >
                            <option value="">Select City</option>
                            {availableCities.map((city) => (
                              <option
                                key={city}
                                value={city}
                                className="text-slate-900 bg-white"
                              >
                                {city}
                              </option>
                            ))}
                          </select>
                          {errors.city && (
                            <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {errors.city}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pincode Input */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                          PIN Code <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={6}
                            value={pincode}
                            onChange={(e) =>
                              setPincode(e.target.value.replace(/\D/g, ""))
                            }
                            placeholder="e.g. 110001"
                            className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all text-sm font-medium placeholder:text-slate-300 ${
                              errors.pincode
                                ? "border-red-500 focus:border-red-500"
                                : pincodeValid === true
                                  ? "border-emerald-500 focus:border-emerald-500"
                                  : ""
                            }`}
                          />
                          {pincodeValid !== null && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {pincodeValid ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {errors.pincode && (
                          <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.pincode}
                          </p>
                        )}
                        {pincodeValid && pincodeMsg && (
                          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {pincodeMsg}
                          </p>
                        )}
                      </div>

                      {/* Full Address Input */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                          Registered Office Address{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="e.g. Ground Floor, Office No. 12, Vikas Marg"
                          className={`w-full p-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all placeholder:text-slate-300 resize-none text-sm font-medium ${
                            errors.address
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }`}
                        />
                        {errors.address && (
                          <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.address}
                          </p>
                        )}
                      </div>

                      {/* Google Map selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                          Interactive Google Map Landmark{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <GoogleLocationPicker
                          onLocationSelect={handleLocationSelect}
                          initialPosition={
                            landmark
                              ? { lat: landmark.lat, lng: landmark.lng }
                              : null
                          }
                        />
                        {errors.landmark && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.landmark}
                          </p>
                        )}
                        {landmark?.addressDetails && (
                          <div className="p-3 bg-emerald-50 border-2 border-slate-900 rounded-xl text-xs flex items-center gap-2 mt-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-emerald-800">
                              Google Landmark selected:{" "}
                              {landmark.addressDetails.establishment ||
                                "Coordinate Pinned"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-between pt-6 border-t-2 border-slate-900 mt-6">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="px-5 py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep2}
                          className="px-6 py-3.5 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          Next Step
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: MANDATE & FOUNDERS */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6 flex-1"
                    >
                      <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-sky-50 shadow-sm shrink-0">
                          <Compass className="w-6 h-6 text-sky-900" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                            Focus & Mission
                          </h2>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                            Step 3: Select focus areas and detailed mission
                            goals
                          </p>
                        </div>
                      </div>

                      {/* Purposes checkboxes (min 1, max 5) */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                            NGO Purpose Focus{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <span className="text-xs px-2.5 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-full font-bold">
                            {selectedPurposes.length} / 5 Selected
                          </span>
                        </div>

                        {errors.purposes && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.purposes}
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-50 overflow-y-auto pr-1 border-2 border-slate-900 p-2.5 rounded-xl bg-slate-50">
                          {NGO_PURPOSES.map((pur) => {
                            const isSelected = selectedPurposes.includes(
                              pur.id,
                            );
                            const isMax = selectedPurposes.length >= 5;
                            const isDisabled = isMax && !isSelected;

                            return (
                              <div
                                key={pur.id}
                                onClick={() =>
                                  !isDisabled && handlePurposeChange(pur.id)
                                }
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                                  isSelected
                                    ? "bg-sky-50 border-slate-900 text-sky-900 font-bold shadow-sm"
                                    : isDisabled
                                      ? "opacity-50 cursor-not-allowed border-slate-200"
                                      : "bg-white border-slate-200 hover:border-slate-900 cursor-pointer"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  onChange={() => {}} // click handled on wrapper
                                  className="w-4 h-4 text-sky-600 rounded mt-0.5 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                                    <span>{pur.icon}</span>
                                    <span>{pur.label}</span>
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Co-founders count is now selected in Step 1 */}

                      {/* Description textarea */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                              Detailed Mission & Description{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleGenerateDescription}
                              disabled={isGeneratingDescription}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                            >
                              {isGeneratingDescription
                                ? "Generating..."
                                : "AI Generate"}
                            </button>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${description.length > 500 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}
                          >
                            {description.length}/500
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          value={description}
                          onChange={(e) =>
                            setDescription(e.target.value.slice(0, 500))
                          }
                          placeholder="Please write down your NGO's core objectives, targeting programs, and operational structure..."
                          className={`w-full p-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 transition-all placeholder:text-slate-300 resize-none text-sm font-medium ${
                            errors.description
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }`}
                        />
                        {errors.description && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.description}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-between pt-6 border-t-2 border-slate-900 mt-6">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="px-5 py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep3}
                          className="px-6 py-3.5 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          Review Application
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: REVIEW & SUBMIT APPLICATION */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6 flex-1"
                    >
                      <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-purple-100 text-purple-900 shadow-sm shrink-0">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                            Incorporate Application Review
                          </h2>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                            Step 4: Review your legally binding details before
                            final submittal
                          </p>
                        </div>
                      </div>

                      {/* DOCUMENT / CERTIFICATE VIEW: WELL DECORATED */}
                      <div className="relative border-4 border-double border-slate-300 p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-md">
                        {/* Decorative watermark/seal */}
                        <div className="absolute right-6 top-6 opacity-[0.03] pointer-events-none">
                          <Building className="w-48 h-48" />
                        </div>

                        {/* Certificate Header */}
                        <div className="text-center border-b border-slate-200 pb-5 space-y-2">
                          <div className="w-16 h-16 mx-auto rounded-full border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                            {ngoLogo ? (
                              <img
                                src={ngoLogo}
                                alt="Seal"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <h3 className="text-sm font-extrabold tracking-widest text-sky-800 uppercase">
                            DRAFT CONSTITUTION CHARTER
                          </h3>
                          <h4 className="text-2xl font-black text-slate-900 uppercase leading-tight font-serif tracking-tight">
                            {ngoName || "UNSPECIFIED ORGANIZATION"}
                          </h4>
                          <p className="text-xs italic text-slate-500 font-serif">
                            &ldquo;{tagline}&rdquo;
                          </p>
                        </div>

                        {/* Certificate Content Grid */}
                        <div className="py-6 space-y-6 text-xs text-slate-700 leading-relaxed font-sans">
                          {/* Row 1: Headquarters & Address */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-100">
                            <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">
                              Registered Headquarters
                            </span>
                            <span className="md:col-span-2 text-slate-900 font-medium">
                              <p className="font-bold text-sm">{address}</p>
                              <p className="text-slate-500 font-semibold mt-1">
                                {selectedCity}, {selectedState} - PIN {pincode}
                              </p>
                            </span>
                          </div>

                          {/* Row 2: Landmark & Coordinates */}
                          {landmark && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-100">
                              <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">
                                Geo Location Pinned
                              </span>
                              <span className="md:col-span-2 text-slate-900 font-mono text-[11px] font-semibold flex flex-col gap-1">
                                <span className="text-slate-700">
                                  🌐 Lat: {landmark.lat.toFixed(5)}, Lng:{" "}
                                  {landmark.lng.toFixed(5)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-sans italic">
                                  (
                                  {landmark.addressDetails?.establishment ||
                                    "Coordinate Pinned"}
                                  )
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Row 3: Scope of Operation Purposes */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-100">
                            <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">
                              Charter Objectives
                            </span>
                            <div className="md:col-span-2 flex flex-wrap gap-1.5">
                              {selectedPurposes.map((id) => {
                                const pur = NGO_PURPOSES.find(
                                  (p) => p.id === id,
                                );
                                return (
                                  <span
                                    key={id}
                                    className="px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-extrabold rounded-full flex items-center gap-1 shadow-sm"
                                  >
                                    <span>{pur?.icon}</span>
                                    <span>{pur?.label}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Row 4: Co-founders count */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pb-4 border-b border-slate-100">
                            <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">
                              Co-founders
                            </span>
                            <span className="md:col-span-2 text-slate-900 font-extrabold text-sm flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-sky-800" />
                              {foundingMembers} Co-founders Present
                            </span>
                          </div>

                          {/* Row 5: Long Mission Description */}
                          <div className="space-y-2 pt-2">
                            <span className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider block">
                              Detailed Constitutional Mission Statement
                            </span>
                            <p className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 italic leading-relaxed text-sm font-serif">
                              &ldquo;{description}&rdquo;
                            </p>
                          </div>
                        </div>

                        {/* Official Footer */}
                        <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                          <span>MD-REGISTRATION ID: PENDING</span>
                          <span>
                            DATE: {new Date().toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Final Submit Form */}
                      <form
                        onSubmit={handleFinalSubmit}
                        className="pt-2 space-y-4"
                      >
                        {errors.submit && (
                          <div className="p-4 bg-rose-50 border-2 border-red-500 rounded-xl text-xs flex items-center gap-2 text-rose-800 font-bold font-sans shadow-sm">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            {errors.submit}
                          </div>
                        )}
                        {/* Action buttons */}
                        <div className="flex justify-between items-center">
                          <button
                            type="button"
                            onClick={handlePrevStep}
                            className="px-5 py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Edit
                          </button>

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-4 bg-sky-800 text-white border-2 border-slate-900 rounded-2xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Submitting NGO Charter...</span>
                              </>
                            ) : (
                              <>
                                <FileCode className="w-5 h-5" />
                                <span>Submit & Incorporate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* RIGHT COLUMN: CARD PREVIEW */}
              <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
                {/* 1. Interactive Live Card Preview */}
                <div className="bg-white text-slate-800 shadow-xl rounded-3xl overflow-hidden relative border-2 border-sky-800">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-size-[24px_24px] opacity-40" />

                  <div className="relative p-6 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-sky-800" />
                        <span className="text-[10px] font-extrabold text-sky-800 tracking-widest uppercase">
                          Live Profile Preview
                        </span>
                      </div>
                      <div className="px-2.5 py-0.5 bg-sky-50 text-sky-800 text-[9px] font-bold rounded-full border border-sky-200 flex items-center gap-1">
                        <Sparkle className="w-3 h-3 text-sky-600 animate-spin-slow" />
                        Live Draft
                      </div>
                    </div>

                    {/* Logo & Identity Grid */}
                    <div className="flex items-start gap-4">
                      {/* Logo Frame */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {ngoLogo ? (
                          <img
                            src={ngoLogo}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg font-black tracking-tight text-slate-900 line-clamp-1">
                          {ngoName.trim() || "NGO Legal Name"}
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold italic mt-0.5 line-clamp-1">
                          &ldquo;
                          {tagline.trim() || "Your tagline will appear here."}
                          &rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Purpose badges */}
                    {selectedPurposes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedPurposes.map((id) => {
                          const pur = NGO_PURPOSES.find((p) => p.id === id);
                          return (
                            <span
                              key={id}
                              className="text-[9px] bg-sky-50 text-sky-800 border border-sky-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                            >
                              <span>{pur?.icon}</span>
                              <span>{pur?.label.split(" & ")[0]}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        No purposes selected
                      </p>
                    )}

                    {/* Details Box */}
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3 text-xs">
                      {/* Address */}
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-sky-800 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-sky-800 font-bold uppercase">
                            Official Address
                          </p>
                          <p className="text-slate-600 line-clamp-2 mt-0.5 font-medium">
                            {address.trim() ||
                              "Provide address details in Step 2"}
                          </p>
                          {(selectedCity || selectedState || pincode) && (
                            <p className="text-slate-800 font-extrabold mt-1 text-[11px]">
                              {[
                                selectedCity,
                                selectedState,
                                pincode ? `PIN ${pincode}` : "",
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Founders & Status info */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                        <div>
                          <p className="text-[9px] text-sky-800 font-bold uppercase">
                            Co-founders
                          </p>
                          <p className="text-slate-900 font-extrabold text-sm mt-0.5 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-sky-800" />
                            {foundingMembers} Present
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-sky-800 font-bold uppercase">
                            Approval
                          </p>
                          <p className="text-amber-700 font-extrabold text-sm mt-0.5">
                            Draft Phase
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mission Text preview */}
                    <div className="space-y-1">
                      <p className="text-[9px] text-sky-800 font-bold uppercase">
                        Mission Preview
                      </p>
                      <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-3 font-medium bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                        {description.trim() ||
                          "Mission description will show here as you type in Step 3..."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-slate-900 rounded-[1.5rem] p-5 text-xs text-slate-500 space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-slate-900 font-bold pb-2 border-b border-slate-100">
                    <Info className="w-4 h-4 text-sky-800" />
                    <span>Application Guidelines</span>
                  </div>
                  <p className="leading-relaxed">
                    Drafts are saved automatically in your browser's local cache
                    on clicking <strong>Next Step</strong>. You can return at
                    any time to resume incorporation editing.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl mx-auto bg-white/95 backdrop-blur-sm border-2 border-slate-900 rounded-[2.5rem] p-8 text-center shadow-xl relative overflow-hidden"
            >
              <div className="flex flex-col items-center gap-6 py-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-sm">
                  <Check className="w-10 h-10 stroke-3" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                    NGO Incorporation Filed!
                  </h2>
                  <p className="text-sm text-slate-500 font-semibold italic">
                    The registration for &ldquo;{ngoName}&rdquo; has been
                    received and queued for review.
                  </p>
                </div>

                {/* Successful details summary */}
                <div className="w-full text-left bg-slate-50 border-2 border-slate-900 rounded-2xl p-5 space-y-3.5 text-xs shadow-sm">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">
                      Organization
                    </span>
                    <span className="font-bold text-slate-900">{ngoName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">
                      Headquarters
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedCity}, {selectedState} ({pincode})
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">
                      Co-founders Present
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-800" />
                      {foundingMembers} Co-founders
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-slate-500 font-medium">
                      Objectives Signed
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPurposes.map((id) => {
                        const pur = NGO_PURPOSES.find((p) => p.id === id);
                        return (
                          <span
                            key={id}
                            className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full font-bold"
                          >
                            {pur?.icon} {pur?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Return Buttons */}
                <div className="flex gap-4 w-full pt-4">
                  <button
                    onClick={resetForm}
                    className="flex-1 py-3 px-4 bg-white text-slate-900 border-2 border-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    Incorporate Another NGO
                  </button>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="flex-1 py-3 px-4 text-white bg-sky-800 border-2 border-slate-900 rounded-xl font-bold hover:bg-sky-900 transition-all active:scale-[0.98] shadow-md"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
