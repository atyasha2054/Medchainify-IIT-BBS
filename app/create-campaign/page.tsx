"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";

// Lucide icons
import {
  Megaphone,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Bot,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  X,
  FileCode,
  HeartHandshake,
  Stethoscope,
  Building,
  DollarSign,
  Tag,
  Info,
  Check,
  Layers,
} from "lucide-react";

// Dynamic import for GoogleLocationPicker
const GoogleLocationPicker = dynamic(
  () => import("@/components/GoogleLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-87.5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-900">
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

const REQUIREMENT_OPTIONS = [
  { id: "Doctor", label: "Doctor", icon: Stethoscope, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { id: "Volunteer", label: "Volunteer", icon: Users, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { id: "Fund", label: "Fund", icon: DollarSign, color: "text-amber-700 bg-amber-50 border-amber-200" },
  { id: "Venue", label: "Venue", icon: Building, color: "text-purple-700 bg-purple-50 border-purple-200" },
];

const SERVICE_SUGGESTIONS = [
  "Free General Health Checkup",
  "Blood Pressure & Sugar Screening",
  "Free Blood Donation Camp",
  "Dental Hygiene & Checkup",
  "Eye Screening & Vision Test",
  "Pediatric & Child Health Care",
  "Ayurveda & Holistic Consultation",
  "Nutrition & Diet Counseling",
  "ECG & Cardiac Screening",
  "Free Medicine Distribution",
];

// 12-Hour format time options list (30-min intervals)
const TIME_OPTIONS_12H = [
  "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM",
  "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM",
];

function parse12HTimeToMinutes(time12h: string): number {
  if (!time12h) return 0;
  const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function getCombinedDateTime(dateStr: string, time12hStr: string): Date {
  const d = new Date(dateStr);
  const minutes = parse12HTimeToMinutes(time12hStr);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  d.setHours(h, m, 0, 0);
  return d;
}

// Alphanumeric checks
const NAME_REGEX = /^[a-zA-Z0-9\s]+$/;
const DESC_REGEX = /^[a-zA-Z0-9\s.,!?'"()\-–—\n\r]+$/;

export default function CreateCampaignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1 STATE: Basics & Logistics
  const [campaignName, setCampaignName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState<string>(""); // Base64 string for preview
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [venueAddress, setVenueAddress] = useState("");
  const [landmark, setLandmark] = useState<{
    lat: number;
    lng: number;
    addressDetails?: any;
  } | null>(null);

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  // STEP 2 STATE: Fees & Services
  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [feeAmount, setFeeAmount] = useState<string>("");

  const [services, setServices] = useState<string[]>([]);
  const [currentServiceInput, setCurrentServiceInput] = useState("");

  // STEP 3 STATE: Requirements & Capacity
  const [requirements, setRequirements] = useState<string[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState<string[]>([]);
  const [currentInstructionInput, setCurrentInstructionInput] = useState("");
  const [capacity, setCapacity] = useState<string>("100");

  // Status & Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStepText, setSubmitStepText] = useState("");

  // Gemini AI generation state
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // AI Handler: Generate heart-touching Tagline
  const handleGenerateAITagline = async () => {
    if (!campaignName.trim()) {
      setErrors((prev) => ({
        ...prev,
        campaignName: "Please enter a campaign name first to generate an AI tagline.",
      }));
      toast.warn("Please enter a campaign name first.");
      return;
    }

    setIsGeneratingTagline(true);
    try {
      const res = await fetch("/api/campaigns/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tagline",
          campaignName: campaignName.trim(),
          services,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate tagline");
      }

      if (data.tagline) {
        setTagline(data.tagline);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.tagline;
          return next;
        });
        toast.success("Heart-touching tagline generated with Gemini AI!");
      }
    } catch (err: any) {
      console.error("AI Tagline generation error:", err);
      toast.error(err.message || "Failed to generate tagline");
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  // AI Handler: Generate clear & comprehensive Description
  const handleGenerateAIDescription = async () => {
    if (!campaignName.trim()) {
      setErrors((prev) => ({
        ...prev,
        campaignName: "Please enter a campaign name first to generate an AI description.",
      }));
      toast.warn("Please enter a campaign name first.");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const res = await fetch("/api/campaigns/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "description",
          campaignName: campaignName.trim(),
          tagline: tagline.trim(),
          services,
          venue: venueAddress.trim(),
          feeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate description");
      }

      if (data.description) {
        setDescription(data.description);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.description;
          return next;
        });
        toast.success("Clear & comprehensive description generated with Gemini AI!");
      }
    } catch (err: any) {
      console.error("AI Description generation error:", err);
      toast.error(err.message || "Failed to generate description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
    }
  }, [status, router]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medchainify_campaign_draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.campaignName) setCampaignName(draft.campaignName);
        if (draft.tagline) setTagline(draft.tagline);
        if (draft.description) setDescription(draft.description);
        if (draft.bannerImage) setBannerImage(draft.bannerImage);
        if (draft.venueAddress) setVenueAddress(draft.venueAddress);
        if (draft.landmark) setLandmark(draft.landmark);
        if (draft.startDate) setStartDate(draft.startDate);
        if (draft.startTime) setStartTime(draft.startTime);
        if (draft.endDate) setEndDate(draft.endDate);
        if (draft.endTime) setEndTime(draft.endTime);
        if (draft.feeType) setFeeType(draft.feeType);
        if (draft.feeAmount) setFeeAmount(draft.feeAmount);
        if (draft.services) setServices(draft.services);
        if (draft.requirements) setRequirements(draft.requirements);
        if (draft.additionalInstructions) setAdditionalInstructions(draft.additionalInstructions);
        if (draft.capacity) setCapacity(draft.capacity);
        if (draft.currentStep) setCurrentStep(draft.currentStep);
      }
    } catch (e) {
      console.error("Error loading campaign draft:", e);
    }
  }, []);

  // Save draft
  const saveDraft = (stepNumber?: number) => {
    try {
      const draft = {
        campaignName,
        tagline,
        description,
        bannerImage,
        venueAddress,
        landmark,
        startDate,
        startTime,
        endDate,
        endTime,
        feeType,
        feeAmount,
        services,
        requirements,
        additionalInstructions,
        capacity,
        currentStep: stepNumber || currentStep,
      };
      localStorage.setItem("medchainify_campaign_draft", JSON.stringify(draft));
      toast.success("Campaign draft saved!", { autoClose: 1500 });
    } catch (e) {
      console.error("Error saving campaign draft:", e);
    }
  };

  // Image upload handler with 2MB limit validation
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        bannerImage: "Image file size must be under 2MB.",
      }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        bannerImage: "Please upload a valid image file (PNG, JPG, WEBP).",
      }));
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerImage(reader.result as string);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.bannerImage;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  // Service tag handler on Enter press
  const handleAddService = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (e && "preventDefault" in e) e.preventDefault();

    const trimmed = currentServiceInput.trim();
    if (!trimmed) return;

    if (services.includes(trimmed)) {
      toast.info("Service already added.");
      return;
    }

    setServices((prev) => [...prev, trimmed]);
    setCurrentServiceInput("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.services;
      return next;
    });
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSuggestedService = (serviceText: string) => {
    if (services.includes(serviceText)) return;
    setServices((prev) => [...prev, serviceText]);
  };

  // Additional instructions tag handler on Enter press
  const handleAddInstruction = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && "key" in e && e.key !== "Enter") return;
    if (e && "preventDefault" in e) e.preventDefault();

    const trimmed = currentInstructionInput.trim();
    if (!trimmed) return;

    if (additionalInstructions.includes(trimmed)) {
      toast.info("Instruction already added.");
      return;
    }

    setAdditionalInstructions((prev) => [...prev, trimmed]);
    setCurrentInstructionInput("");
  };

  const handleRemoveInstruction = (index: number) => {
    setAdditionalInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  // Requirement toggle
  const toggleRequirement = (id: string) => {
    setRequirements((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Google Map Location Select Handler
  const handleLocationSelect = (loc: any) => {
    setLandmark({
      lat: loc.lat,
      lng: loc.lng,
      addressDetails: loc.address,
    });

    if (loc.address?.display_name) {
      setVenueAddress(loc.address.display_name);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.venueAddress;
        delete next.landmark;
        return next;
      });
    }
  };

  // STEP 1 VALIDATION & PROCEED
  const handleNextStep1 = () => {
    const errs: Record<string, string> = {};

    const nameTrimmed = campaignName.trim();
    if (!nameTrimmed) {
      errs.campaignName = "Campaign name is required.";
    } else if (nameTrimmed.length < 3 || nameTrimmed.length > 100) {
      errs.campaignName = "Campaign name must be between 3 and 100 characters.";
    } else if (!NAME_REGEX.test(nameTrimmed)) {
      errs.campaignName = "No special characters allowed in campaign name (letters, numbers and spaces only).";
    }

    const taglineTrimmed = tagline.trim();
    if (!taglineTrimmed) {
      errs.tagline = "Campaign tagline is required.";
    } else if (taglineTrimmed.length > 100) {
      errs.tagline = "Tagline cannot exceed 100 characters.";
    }

    const descTrimmed = description.trim();
    if (!descTrimmed) {
      errs.description = "Campaign description is required.";
    } else if (descTrimmed.length > 750) {
      errs.description = "Description cannot exceed 750 characters.";
    } else if (!DESC_REGEX.test(descTrimmed)) {
      errs.description = "No special characters allowed in description (alphanumerics and standard punctuation only).";
    }

    if (!bannerImage) {
      errs.bannerImage = "Square aspect ratio banner image is required (under 2MB).";
    }

    if (!venueAddress.trim()) {
      errs.venueAddress = "Venue address is required.";
    }

    if (!landmark) {
      errs.landmark = "Please select the venue landmark on the Google Map.";
    }

    if (!startDate) errs.startDate = "Start date is required.";
    if (!startTime) errs.startTime = "Start time is required.";
    if (!endDate) errs.endDate = "End date is required.";
    if (!endTime) errs.endTime = "End time is required.";

    if (startDate && endDate && startTime && endTime) {
      const startDateTime = getCombinedDateTime(startDate, startTime);
      const endDateTime = getCombinedDateTime(endDate, endTime);
      if (endDateTime <= startDateTime) {
        errs.endDate = "End date & time must be after start date & time.";
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please resolve highlighted errors before proceeding.");
      return;
    }

    setErrors({});
    saveDraft(2);
    setCurrentStep(2);
  };

  // STEP 2 VALIDATION & PROCEED
  const handleNextStep2 = () => {
    const errs: Record<string, string> = {};

    if (feeType === "paid") {
      const amount = Number(feeAmount);
      if (!amount || amount <= 0) {
        errs.feeAmount = "Please enter a valid fee amount per person greater than 0.";
      }
    }

    if (services.length === 0) {
      errs.services = "Please add at least 1 service offered in this campaign.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    saveDraft(3);
    setCurrentStep(3);
  };

  // STEP 3 VALIDATION & PROCEED
  const handleNextStep3 = () => {
    const errs: Record<string, string> = {};

    const cap = Number(capacity);
    if (!cap || cap < 1) {
      errs.capacity = "Target capacity must be at least 1 person.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    saveDraft(4);
    setCurrentStep(4);
  };

  const handlePrevStep = () => {
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    saveDraft(prev);
  };

  // FINAL SUBMISSION
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStepText("Uploading banner image to Cloudinary...");

    try {
      let finalImageUrl = bannerImage;

      // 1. Upload banner image to Cloudinary if Base64 Data URI
      if (bannerImage.startsWith("data:image/")) {
        try {
          const resBlob = await fetch(bannerImage);
          const blob = await resBlob.blob();
          const file = new File([blob], "campaign-banner.png", { type: blob.type });

          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetch("/api/upload-image", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            throw new Error(errData.error || "Failed to upload banner image to Cloudinary.");
          }

          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.secure_url;
        } catch (uploadErr: any) {
          console.error("Cloudinary upload error:", uploadErr);
          setErrors((prev) => ({
            ...prev,
            submit: uploadErr.message || "Failed to upload banner image to Cloudinary.",
          }));
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Save Campaign document in MongoDB
      setSubmitStepText("Registering campaign & dispatching confirmation email...");

      const campaignPayload = {
        name: campaignName.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        bannerImage: finalImageUrl,
        location: {
          address: venueAddress.trim(),
          state: landmark?.addressDetails?.state || "",
          city: landmark?.addressDetails?.city || "",
          pincode: landmark?.addressDetails?.pincode || "",
          lat: landmark?.lat || 0,
          lng: landmark?.lng || 0,
          addressDetails: landmark?.addressDetails || null,
        },
        startDate,
        startTime,
        endDate,
        endTime,
        feeType,
        feeAmount: feeType === "paid" ? Number(feeAmount) : 0,
        services,
        requirements,
        additionalInstructions,
        capacity: Number(capacity),
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignPayload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to create campaign.");
      }

      localStorage.removeItem("medchainify_campaign_draft");
      toast.success("Campaign created successfully! Full details have been sent to your email.");
      router.push(`/campaigns/${result.campaign._id}`);
    } catch (err: any) {
      console.error("Campaign creation error:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "An unexpected error occurred during submission.",
      }));
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, name: "Basics & Venue", desc: "Name, Banner, Map & Dates" },
    { num: 2, name: "Fees & Services", desc: "Pricing & Services Offered" },
    { num: 3, name: "Needs & Capacity", desc: "Requirements & Capacity" },
    { num: 4, name: "Review & Publish", desc: "Final Verification & Incorporation" },
  ];

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 relative">
        <BackgroundPattern />
        <TetrisLoading size="lg" speed="normal" showLoadingText={true} loadingText="Verifying credentials..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-36 relative">
      <BackgroundPattern />

      <div className="w-full max-w-7xl space-y-10 relative z-10">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" />
            Healthcare Outreach & Camp Registry
          </div>
          <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
            Create A <span className="text-sky-800">Campaign</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-semibold uppercase tracking-wider max-w-2xl mx-auto">
            Host a healthcare drive, medical consultation camp, or health awareness initiative
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="relative flex justify-between items-center w-full">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full" />
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-sky-800 z-0 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />

            {steps.map((s) => {
              const isPassed = currentStep > s.num;
              const isActive = currentStep === s.num;

              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
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
                          ? "bg-white border-slate-900 text-sky-800 font-black shadow-md"
                          : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isPassed ? <Check className="w-5 h-5 stroke-3" /> : <span className="text-sm font-extrabold">{s.num}</span>}
                  </button>
                  <div className="absolute top-14 text-center whitespace-nowrap hidden sm:block">
                    <p className={`text-xs font-bold ${isActive ? "text-sky-800" : isPassed ? "text-slate-800" : "text-slate-400"}`}>
                      {s.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-14">
          {/* LEFT COLUMN: FORM STEP PANEL */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-sm border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden p-6 sm:p-8 min-h-135 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* STEP 1: BASICS & LOGISTICS */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 flex-1"
                >
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-sky-50 shadow-sm shrink-0">
                      <Megaphone className="w-6 h-6 text-sky-900" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">
                        Step 1: Campaign Basics & Logistics
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Banner, Campaign identity, venue location on Google Maps & dates
                      </p>
                    </div>
                  </div>

                  {/* Campaign Name */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                        Campaign Name <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        No special characters
                      </span>
                    </div>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => {
                        setCampaignName(e.target.value);
                        if (errors.campaignName) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.campaignName;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Free Mega Cardiology Camp 2026"
                      maxLength={100}
                      className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 text-sm font-medium ${
                        errors.campaignName ? "border-red-500" : ""
                      }`}
                    />
                    {errors.campaignName && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.campaignName}
                      </p>
                    )}
                  </div>

                  {/* Campaign Tagline */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                        Campaign Tagline <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateAITagline}
                          disabled={isGeneratingTagline}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border-2 border-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          title="Generate touching tagline with Gemini AI"
                        >
                          <Bot className={`w-3.5 h-3.5 text-sky-800 ${isGeneratingTagline ? "animate-spin" : ""}`} />
                          <span>{isGeneratingTagline ? "Generating…" : "AI Tagline"}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">
                          {tagline.length} / 100
                        </span>
                      </div>
                    </div>
                    <input
                      type="text"
                      maxLength={100}
                      value={tagline}
                      onChange={(e) => {
                        setTagline(e.target.value.slice(0, 100));
                        if (errors.tagline) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.tagline;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Bringing comprehensive heart wellness directly to your community."
                      className={`w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 text-sm font-medium ${
                        errors.tagline ? "border-red-500" : ""
                      }`}
                    />
                    {errors.tagline && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.tagline}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                        Campaign Description <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateAIDescription}
                          disabled={isGeneratingDescription}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border-2 border-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          title="Generate clear & comprehensive description with Gemini AI"
                        >
                          <Bot className={`w-3.5 h-3.5 text-purple-800 ${isGeneratingDescription ? "animate-spin" : ""}`} />
                          <span>{isGeneratingDescription ? "Generating…" : "AI Description"}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">
                          {description.length} / 750
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value.slice(0, 750));
                        if (errors.description) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.description;
                            return next;
                          });
                        }
                      }}
                      placeholder="Provide comprehensive details about the purpose, goals, target audience and procedures of this medical camp..."
                      className={`w-full p-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 resize-none text-sm font-medium ${
                        errors.description ? "border-red-500" : ""
                      }`}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Square Banner Image Upload (1:1 Ratio, <2MB) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center justify-between">
                      <span>Square Banner Image (1:1 Ratio) <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-slate-500 font-normal">Max 2MB</span>
                    </label>

                    <div className="flex items-center gap-4">
                      {bannerImage ? (
                        <div className="relative w-28 h-28 rounded-2xl border-2 border-slate-900 overflow-hidden shrink-0 shadow-md">
                          <img
                            src={bannerImage}
                            alt="Banner Preview"
                            className="w-full h-full object-cover aspect-square"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBannerImage("");
                              setBannerFile(null);
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <Megaphone className="w-7 h-7" />
                          <span className="text-[9px] font-bold uppercase mt-1">1:1 Square</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-900 rounded-xl cursor-pointer hover:bg-slate-900 hover:text-white transition-all text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                          <Upload className="w-4 h-4" />
                          <span>{bannerImage ? "Replace Banner" : "Upload Banner Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Please upload a square picture under 2MB showcasing your medical drive or camp artwork.
                        </p>
                      </div>
                    </div>
                    {errors.bannerImage && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.bannerImage}
                      </p>
                    )}
                  </div>

                  {/* Venue Address */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                        Full Venue Address <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-sky-800 font-bold uppercase">
                        Auto-updates with map &bull; Editable
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={venueAddress}
                      onChange={(e) => {
                        setVenueAddress(e.target.value);
                        if (errors.venueAddress) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.venueAddress;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Community Health Center Hall, Sector 12, Vikas Marg (or pick on Google Maps below to auto-fill)"
                      className={`w-full p-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 focus:outline-none focus:border-sky-800 resize-none text-sm font-medium ${
                        errors.venueAddress ? "border-red-500" : ""
                      }`}
                    />
                    {errors.venueAddress && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.venueAddress}
                      </p>
                    )}
                  </div>

                  {/* Google Map Location Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sky-800" />
                      Google Map Venue Location <span className="text-red-500">*</span>
                    </label>
                    <GoogleLocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialPosition={
                        landmark ? { lat: landmark.lat, lng: landmark.lng } : null
                      }
                      height="380px"
                    />
                    {errors.landmark && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.landmark}
                      </p>
                    )}
                  </div>

                  {/* Dates & Times */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Start Date & Time */}
                    <div className="space-y-2 p-4 bg-sky-50/60 rounded-2xl border-2 border-slate-900">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-sky-900">
                        <Calendar className="w-4 h-4" />
                        <span>Start Schedule</span>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (errors.startDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.startDate;
                                return next;
                              });
                            }
                          }}
                          className="w-full h-10 px-3 rounded-lg border-2 border-slate-900 bg-white text-xs font-bold text-slate-800"
                        />
                        <div className="relative flex items-center">
                          <Clock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                          <select
                            value={startTime}
                            onChange={(e) => {
                              setStartTime(e.target.value);
                              if (errors.startTime) {
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.startTime;
                                  return next;
                                });
                              }
                            }}
                            className="w-full h-10 pl-9 pr-3 rounded-lg border-2 border-slate-900 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-800 cursor-pointer"
                          >
                            <option value="">Select Start Time (12h)</option>
                            {TIME_OPTIONS_12H.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(errors.startDate || errors.startTime) && (
                        <p className="text-[11px] text-red-500 font-semibold">
                          {errors.startDate || errors.startTime}
                        </p>
                      )}
                    </div>

                    {/* End Date & Time */}
                    <div className="space-y-2 p-4 bg-sky-50/60 rounded-2xl border-2 border-slate-900">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-sky-900">
                        <Calendar className="w-4 h-4" />
                        <span>End Schedule</span>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            if (errors.endDate) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.endDate;
                                return next;
                              });
                            }
                          }}
                          className="w-full h-10 px-3 rounded-lg border-2 border-slate-900 bg-white text-xs font-bold text-slate-800"
                        />
                        <div className="relative flex items-center">
                          <Clock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                          <select
                            value={endTime}
                            onChange={(e) => {
                              setEndTime(e.target.value);
                              if (errors.endTime) {
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.endTime;
                                  return next;
                                });
                              }
                            }}
                            className="w-full h-10 pl-9 pr-3 rounded-lg border-2 border-slate-900 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-800 cursor-pointer"
                          >
                            <option value="">Select End Time (12h)</option>
                            {TIME_OPTIONS_12H.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(errors.endDate || errors.endTime) && (
                        <p className="text-[11px] text-red-500 font-semibold">
                          {errors.endDate || errors.endTime}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex justify-end pt-6 border-t-2 border-slate-900">
                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="px-6 py-3.5 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Proceed to Fees & Services</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: FEES & SERVICES */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 flex-1"
                >
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-emerald-50 shadow-sm shrink-0">
                      <IndianRupee className="w-6 h-6 text-emerald-800" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">
                        Step 2: Campaign Fees & Services
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Specify entry fee type and enlist services offered
                      </p>
                    </div>
                  </div>

                  {/* Fee Selection Toggle */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                      Campaign Fee Model <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setFeeType("free");
                          setFeeAmount("");
                        }}
                        className={`p-4 rounded-2xl border-2 border-slate-900 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          feeType === "free"
                            ? "bg-emerald-500 text-white shadow-md scale-102"
                            : "bg-white text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <HeartHandshake className="w-6 h-6" />
                        <span className="text-sm font-black uppercase tracking-wider">
                          Free of Cost
                        </span>
                        <span className={`text-[10px] ${feeType === "free" ? "text-emerald-100" : "text-slate-400"}`}>
                          100% complimentary public healthcare
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeeType("paid")}
                        className={`p-4 rounded-2xl border-2 border-slate-900 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          feeType === "paid"
                            ? "bg-sky-800 text-white shadow-md scale-102"
                            : "bg-white text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <IndianRupee className="w-6 h-6" />
                        <span className="text-sm font-black uppercase tracking-wider">
                          Paid Camp
                        </span>
                        <span className={`text-[10px] ${feeType === "paid" ? "text-sky-100" : "text-slate-400"}`}>
                          Nominal fee per registered person
                        </span>
                      </button>
                    </div>

                    {/* Paid Fee Input */}
                    {feeType === "paid" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5 p-4 bg-sky-50 rounded-2xl border-2 border-slate-900 mt-3"
                      >
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                          <IndianRupee className="w-4 h-4 text-sky-800" />
                          Fee Per Person (in ₹ INR) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(e.target.value)}
                          placeholder="e.g. 150"
                          className="w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-900 text-sm font-extrabold focus:outline-none focus:border-sky-800"
                        />
                        {errors.feeAmount && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errors.feeAmount}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Services Offered - Enter Separated Text Field */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-sky-800" />
                        Services Offered <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Press Enter to add
                      </span>
                    </div>

                    {/* Input box */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentServiceInput}
                        onChange={(e) => setCurrentServiceInput(e.target.value)}
                        onKeyDown={handleAddService}
                        placeholder="Type a service and press Enter (e.g. Free Eye Screening)..."
                        className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-sky-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddService}
                        className="px-4 bg-sky-800 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                    {errors.services && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.services}
                      </p>
                    )}

                    {/* Active Service Badges */}
                    {services.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border-2 border-slate-900 rounded-2xl">
                        {services.map((svc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 border-2 border-slate-900 text-sky-950 rounded-xl text-xs font-extrabold shadow-sm"
                          >
                            <span>✓ {svc}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(idx)}
                              className="hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Suggestions */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Quick Add Suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SERVICE_SUGGESTIONS.map((sugg, i) => {
                          const isAdded = services.includes(sugg);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleAddSuggestedService(sugg)}
                              disabled={isAdded}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                                isAdded
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-900 hover:bg-sky-50 cursor-pointer"
                              }`}
                            >
                              + {sugg}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex justify-between pt-6 border-t-2 border-slate-900">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-5 py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="px-6 py-3.5 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Proceed to Needs & Capacity</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: REQUIREMENTS & CAPACITY */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 flex-1"
                >
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-purple-50 shadow-sm shrink-0">
                      <Users className="w-6 h-6 text-purple-900" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">
                        Step 3: Requirements & Capacity
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Specify volunteer needs, attendees capacity & instructions
                      </p>
                    </div>
                  </div>

                  {/* Requirements Multi-Select Dropdown */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center justify-between">
                      <span>Resource & Volunteer Requirements</span>
                      <span className="text-[10px] text-sky-800 font-bold">
                        {requirements.length} Selected
                      </span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {REQUIREMENT_OPTIONS.map((req) => {
                        const isSelected = requirements.includes(req.id);
                        const IconComponent = req.icon;

                        return (
                          <button
                            key={req.id}
                            type="button"
                            onClick={() => toggleRequirement(req.id)}
                            className={`p-4 rounded-2xl border-2 border-slate-900 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-purple-900 text-white shadow-md scale-102"
                                : "bg-white text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            <IconComponent className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-wider">
                              {req.label}
                            </span>
                            <span className="text-[9px] opacity-80">
                              {isSelected ? "✓ Requested" : "+ Click to add"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Capacity Field */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                        Expected Capacity / Person Limit <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Number of attendees
                      </span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-900 text-sm font-extrabold focus:outline-none focus:border-sky-800"
                    />
                    {errors.capacity && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.capacity}
                      </p>
                    )}
                  </div>

                  {/* Additional Instructions - Enter Separated Text Field */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-sky-800" />
                        Additional Instructions for Attendees
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        Press Enter to add
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentInstructionInput}
                        onChange={(e) => setCurrentInstructionInput(e.target.value)}
                        onKeyDown={handleAddInstruction}
                        placeholder="Type instruction and press Enter (e.g. Bring previous medical prescriptions)..."
                        className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:border-sky-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddInstruction}
                        className="px-4 bg-sky-800 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Active Instruction Badges */}
                    {additionalInstructions.length > 0 && (
                      <div className="space-y-2 p-3 bg-slate-50 border-2 border-slate-900 rounded-2xl">
                        {additionalInstructions.map((inst, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-800 shrink-0" />
                              {inst}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInstruction(idx)}
                              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex justify-between pt-6 border-t-2 border-slate-900">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-5 py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep3}
                      className="px-6 py-3.5 bg-sky-800 text-white border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Review Campaign</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: REVIEW & INCORPORATE */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 flex-1"
                >
                  <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-900">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-sky-50 shadow-sm shrink-0">
                      <FileCode className="w-6 h-6 text-sky-900" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-wide text-slate-900">
                        Step 4: Review & Incorporate
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Final review of all campaign parameters before public listing
                      </p>
                    </div>
                  </div>

                  {/* Comprehensive Review Card */}
                  <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-900 space-y-4">
                    <div className="flex items-center gap-4 pb-3 border-b border-slate-200">
                      {bannerImage && (
                        <img
                          src={bannerImage}
                          alt="Campaign"
                          className="w-16 h-16 rounded-xl object-cover aspect-square border-2 border-slate-900 shrink-0"
                        />
                      )}
                      <div>
                        <h3 className="text-base font-black text-slate-900">{campaignName}</h3>
                        <p className="text-xs text-sky-800 font-bold">{tagline}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Schedule</span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          📅 {startDate} ({startTime}) &rarr; {endDate} ({endTime})
                        </p>
                      </div>

                      <div>
                        <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Fee Structure</span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {feeType === "free" ? "🎉 Free of Cost" : `₹${feeAmount} per person`}
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Venue Address</span>
                        <p className="font-bold text-slate-800 mt-0.5">{venueAddress}</p>
                        {landmark && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            🌐 Lat: {landmark.lat.toFixed(5)}, Lng: {landmark.lng.toFixed(5)}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Capacity</span>
                        <p className="font-bold text-slate-800 mt-0.5">{capacity} Registered Attendees</p>
                      </div>
                    </div>

                    {/* Services summary */}
                    <div>
                      <span className="font-extrabold uppercase text-slate-400 text-[10px] block mb-1.5">Services Offered</span>
                      <div className="flex flex-wrap gap-1.5">
                        {services.map((svc, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-sky-100 border border-sky-300 text-sky-900 rounded-md text-[11px] font-bold">
                            ✓ {svc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Requirements summary */}
                    {requirements.length > 0 && (
                      <div>
                        <span className="font-extrabold uppercase text-slate-400 text-[10px] block mb-1.5">Volunteer Needs</span>
                        <div className="flex flex-wrap gap-1.5">
                          {requirements.map((req, i) => (
                            <span key={i} className="px-2.5 py-0.5 bg-purple-100 border border-purple-300 text-purple-900 rounded-md text-[11px] font-bold">
                              ⚡ {req} Needed
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-rose-50 border-2 border-red-500 rounded-xl text-xs flex items-center gap-2 text-rose-800 font-bold shadow-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      {errors.submit}
                    </div>
                  )}

                  {/* Submission buttons */}
                  <form onSubmit={handleFinalSubmit} className="flex justify-between items-center pt-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handlePrevStep}
                      className="px-5 py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Edit
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-4 bg-sky-800 text-white border-2 border-slate-900 rounded-2xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{submitStepText || "Creating Campaign..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Submit & Publish Campaign</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: LIVE CAMPAIGN CARD PREVIEW */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
            <div className="bg-white text-slate-800 shadow-xl rounded-3xl overflow-hidden relative border-2 border-sky-800">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-sky-800" />
                    <span className="text-[10px] font-extrabold text-sky-800 tracking-widest uppercase">
                      Live Campaign Preview
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] font-bold rounded-full border border-emerald-200">
                    Active Draft
                  </span>
                </div>

                {/* Banner Image Preview */}
                <div className="w-full aspect-square rounded-2xl bg-slate-100 border-2 border-slate-900 overflow-hidden relative flex items-center justify-center shadow-inner">
                  {bannerImage ? (
                    <img
                      src={bannerImage}
                      alt="Campaign Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2 text-slate-400">
                      <Megaphone className="w-12 h-12 mx-auto stroke-1" />
                      <p className="text-xs font-bold uppercase tracking-wider">
                        1:1 Square Banner Preview
                      </p>
                    </div>
                  )}

                  {/* Fee badge overlay */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-md">
                    {feeType === "free" ? (
                      <span className="text-emerald-700">Free</span>
                    ) : (
                      <span className="text-sky-800">₹{feeAmount || "0"} / Person</span>
                    )}
                  </div>
                </div>

                {/* Campaign Identity */}
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {campaignName || "Your Campaign Title"}
                  </h3>
                  <p className="text-xs text-sky-800 font-bold line-clamp-2">
                    {tagline || "Your inspiring campaign tagline will appear here."}
                  </p>
                </div>

                {/* Logistics */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Calendar className="w-4 h-4 text-sky-800 shrink-0" />
                    <span>{startDate || "YYYY-MM-DD"} {startTime && `at ${startTime}`}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-sky-800 shrink-0" />
                    <span className="truncate">{venueAddress || "Venue address will appear here"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Users className="w-4 h-4 text-sky-800 shrink-0" />
                    <span>Capacity: {capacity || "100"} Persons</span>
                  </div>
                </div>

                {/* Services */}
                {services.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Services</span>
                    <div className="flex flex-wrap gap-1">
                      {services.slice(0, 4).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                          ✓ {s}
                        </span>
                      ))}
                      {services.length > 4 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">
                          +{services.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
