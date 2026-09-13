"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  Plus,
  X,
  Stethoscope,
  Building,
  DollarSign,
  Tag,
  Info,
  Lock,
  Bot,
  ShieldCheck,
} from "lucide-react";

// Dynamic import for GoogleLocationPicker
const GoogleLocationPicker = dynamic(
  () => import("@/components/GoogleLocationPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-slate-900">
        <TetrisLoading
          size="sm"
          speed="normal"
          showLoadingText={true}
          loadingText="Loading Map..."
        />
      </div>
    ),
  },
);

const REQUIREMENT_OPTIONS = [
  { id: "Doctor", label: "Doctor", icon: Stethoscope },
  { id: "Volunteer", label: "Volunteer", icon: Users },
  { id: "Fund", label: "Fund", icon: DollarSign },
  { id: "Venue", label: "Venue", icon: Building },
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

const NAME_REGEX = /^[a-zA-Z0-9\s]+$/;
const DESC_REGEX = /^[a-zA-Z0-9\s.,!?'"()\-–—\n\r]+$/;

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Non-editable fields (Display only)
  const [bannerImage, setBannerImage] = useState("");
  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [feeAmount, setFeeAmount] = useState<number>(0);
  const [ngo, setNgo] = useState<any>(null);

  // Editable fields
  const [campaignName, setCampaignName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");

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

  const [services, setServices] = useState<string[]>([]);
  const [currentServiceInput, setCurrentServiceInput] = useState("");

  const [requirements, setRequirements] = useState<string[]>([]);
  const [additionalInstructions, setAdditionalInstructions] = useState<string[]>([]);
  const [currentInstructionInput, setCurrentInstructionInput] = useState("");
  const [capacity, setCapacity] = useState<string>("100");

  // AI states
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Fetch campaign & verify host
  useEffect(() => {
    if (!id) return;
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/auth");
      return;
    }

    const fetchCampaign = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/campaigns/${id}`);
        if (!res.ok) {
          throw new Error("Campaign not found");
        }
        const data = await res.json();
        const c = data.campaign;

        // Check if logged in user is the host/creator
        const creatorId = typeof c.createdBy === "object" ? c.createdBy?._id : c.createdBy;
        const creatorEmail = typeof c.createdBy === "object" ? c.createdBy?.email : null;
        const currentUserId = session?.user?.id;
        const currentUserEmail = session?.user?.email;

        const isOwner =
          (currentUserId && creatorId === currentUserId) ||
          (currentUserEmail && creatorEmail === currentUserEmail);

        if (!isOwner) {
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }

        // Set state
        setBannerImage(c.bannerImage || "");
        setFeeType(c.feeType || "free");
        setFeeAmount(c.feeAmount || 0);
        setNgo(c.ngo || null);

        setCampaignName(c.name || "");
        setTagline(c.tagline || "");
        setDescription(c.description || "");
        setVenueAddress(c.location?.address || "");
        if (c.location?.lat && c.location?.lng) {
          setLandmark({
            lat: c.location.lat,
            lng: c.location.lng,
            addressDetails: c.location.addressDetails,
          });
        }
        setStartDate(c.startDate || "");
        setStartTime(c.startTime || "");
        setEndDate(c.endDate || "");
        setEndTime(c.endTime || "");
        setServices(c.services || []);
        setRequirements(c.requirements || []);
        setAdditionalInstructions(c.additionalInstructions || []);
        setCapacity(String(c.capacity || 100));
      } catch (err: any) {
        console.error("Error fetching campaign for edit:", err);
        toast.error(err.message || "Failed to load campaign.");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, session, status, router]);

  // AI Tagline Generator
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
      if (!res.ok) throw new Error(data.error || "Failed to generate tagline");

      if (data.tagline) {
        setTagline(data.tagline.slice(0, 100));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.tagline;
          return next;
        });
        toast.success("Vision tagline generated with Gemini AI!");
      }
    } catch (err: any) {
      console.error("AI Tagline generation error:", err);
      toast.error(err.message || "Failed to generate tagline");
    } finally {
      setIsGeneratingTagline(false);
    }
  };

  // AI Description Generator
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
      if (!res.ok) throw new Error(data.error || "Failed to generate description");

      if (data.description) {
        setDescription(data.description.slice(0, 750));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.description;
          return next;
        });
        toast.success("Clear description generated with Gemini AI!");
      }
    } catch (err: any) {
      console.error("AI Description generation error:", err);
      toast.error(err.message || "Failed to generate description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Service Tag handlers
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
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSuggestedService = (serviceText: string) => {
    if (services.includes(serviceText)) return;
    setServices((prev) => [...prev, serviceText]);
  };

  // Instruction handlers
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
  const toggleRequirement = (reqId: string) => {
    setRequirements((prev) =>
      prev.includes(reqId) ? prev.filter((r) => r !== reqId) : [...prev, reqId],
    );
  };

  // Map Location Select Handler
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

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    const nameTrimmed = campaignName.trim();
    if (!nameTrimmed) {
      errs.campaignName = "Campaign name is required.";
    } else if (nameTrimmed.length < 3 || nameTrimmed.length > 100) {
      errs.campaignName = "Campaign name must be between 3 and 100 characters.";
    } else if (!NAME_REGEX.test(nameTrimmed)) {
      errs.campaignName = "No special characters allowed in campaign name.";
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
      errs.description = "No special characters allowed in description.";
    }

    if (!venueAddress.trim()) {
      errs.venueAddress = "Venue address is required.";
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

    if (services.length === 0) {
      errs.services = "Please list at least 1 medical service offered.";
    }

    const cap = Number(capacity);
    if (!cap || cap < 1) {
      errs.capacity = "Target capacity must be at least 1 person.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fix highlighted errors before saving.");
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const payload = {
        name: nameTrimmed,
        tagline: taglineTrimmed,
        description: descTrimmed,
        location: {
          address: venueAddress.trim(),
          state: landmark?.addressDetails?.state || "",
          city: landmark?.addressDetails?.city || "",
          pincode: landmark?.addressDetails?.pincode || "",
          lat: landmark?.lat || 28.6139,
          lng: landmark?.lng || 77.209,
          addressDetails: landmark?.addressDetails || null,
        },
        startDate,
        startTime,
        endDate,
        endTime,
        services,
        requirements,
        additionalInstructions,
        capacity: Number(capacity),
      };

      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update campaign.");
      }

      toast.success("Campaign updated successfully!");
      router.push(`/campaigns/${id}`);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to update campaign.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
        <BackgroundPattern />
        <TetrisLoading
          size="md"
          speed="normal"
          showLoadingText={true}
          loadingText="Loading Campaign Editor..."
        />
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
        <BackgroundPattern />
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-900 text-center space-y-4 shadow-xl max-w-md w-full relative z-10">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900 uppercase">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Only the registered host and creator of this campaign is authorized to edit its details.
          </p>
          <Link
            href={`/campaigns/${id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-800 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Campaign Details</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-10 pb-36 relative">
      <BackgroundPattern />

      <div className="w-full max-w-5xl space-y-8 relative z-10">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-slate-900">
          <div className="space-y-1">
            <Link
              href={`/campaigns/${id}`}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Campaign</span>
            </Link>
            <h1 className="text-2xl sm:text-4xl text-slate-900 uppercase tracking-widest font-black flex items-center gap-3">
              <span>Edit</span> <span className="text-sky-800">Campaign</span>
            </h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Update event details, schedule, venue location, and requirements
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/campaigns/${id}`}
              className="px-4 py-2.5 bg-white text-slate-900 rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-all shadow-sm"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* LOCKED PARAMETERS CALLOUT CARD */}
        <div className="bg-slate-50 border-2 border-slate-900 rounded-3xl p-6 shadow-md grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Banner Preview (Locked) */}
          <div className="sm:col-span-4 flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-2xl border-2 border-slate-900 overflow-hidden shrink-0 shadow-sm bg-white">
              <img
                src={bannerImage}
                alt="Campaign Cover"
                className="w-full h-full object-cover aspect-square"
              />
              <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white drop-shadow" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-md">
                <Lock className="w-3 h-3" /> Fixed
              </span>
              <p className="text-xs font-black text-slate-900 uppercase">
                Cover Image
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Cover artwork cannot be modified after registration.
              </p>
            </div>
          </div>

          {/* Fee Model (Locked) */}
          <div className="sm:col-span-4 flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center shrink-0 text-slate-800 shadow-sm">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-md">
                <Lock className="w-3 h-3" /> Fixed
              </span>
              <p className="text-xs font-black text-slate-900 uppercase">
                {feeType === "free" ? "Free of Cost" : `₹${feeAmount} / Person`}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Entry fee model is locked to preserve attendee commitments.
              </p>
            </div>
          </div>

          {/* Host NGO Info */}
          <div className="sm:col-span-4 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-6 pt-4 sm:pt-0">
            <div className="w-10 h-10 rounded-full bg-sky-100 border-2 border-slate-900 flex items-center justify-center shrink-0 text-sky-900 overflow-hidden">
              {ngo?.logo ? (
                <img src={ngo.logo} alt={ngo.name} className="w-full h-full object-cover" />
              ) : (
                <Building className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-400">
                Registered Host NGO
              </p>
              <p className="text-xs font-black text-slate-900 truncate">
                {ngo?.name || "Healthcare NGO / Trust"}
              </p>
              <p className="text-[10px] text-slate-500 font-bold truncate">
                {ngo?.city ? `${ngo.city}${ngo.state ? `, ${ngo.state}` : ""}` : (ngo?.tagline || "Verified Organization")}
              </p>
            </div>
          </div>
        </div>

        {/* EDITABLE FORM */}
        <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-900 shadow-xl rounded-[2.5rem] p-6 sm:p-10 space-y-8">
          {/* SECTION 1: IDENTITY & TEXTS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border-2 border-slate-900 flex items-center justify-center text-sky-900 shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  1. Campaign Identity & Vision
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Update event title, tagline and detailed mission statement
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
                  Max 100 characters
                </span>
              </div>
              <input
                type="text"
                maxLength={100}
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
                  Campaign Tagline (Vision Line) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAITagline}
                    disabled={isGeneratingTagline}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 border-2 border-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-50"
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

            {/* Campaign Description */}
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
                rows={4}
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
          </div>

          {/* SECTION 2: LOCATION & MAP */}
          <div className="space-y-6 pt-4 border-t-2 border-slate-900">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border-2 border-slate-900 flex items-center justify-center text-sky-900 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  2. Venue Location & Map Pin
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Update venue address or pinpoint new coordinates on the interactive map
                </p>
              </div>
            </div>

            {/* Venue Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                Full Venue Address <span className="text-red-500">*</span>
              </label>
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

            {/* Map Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-800" />
                Update Map Pin Coordinates
              </label>
              <GoogleLocationPicker
                onLocationSelect={handleLocationSelect}
                initialPosition={
                  landmark ? { lat: landmark.lat, lng: landmark.lng } : null
                }
                height="340px"
              />
            </div>
          </div>

          {/* SECTION 3: SCHEDULE */}
          <div className="space-y-6 pt-4 border-t-2 border-slate-900">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border-2 border-slate-900 flex items-center justify-center text-sky-900 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  3. Campaign Schedule (12-Hour AM/PM)
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Update campaign start and end dates and time intervals
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Schedule */}
              <div className="space-y-2 p-4 bg-sky-50/60 rounded-2xl border-2 border-slate-900">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-sky-900">
                  <Calendar className="w-4 h-4" />
                  <span>Start Schedule</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-slate-900 bg-white text-xs font-bold text-slate-800"
                  />
                  <div className="relative flex items-center">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
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
              </div>

              {/* End Schedule */}
              <div className="space-y-2 p-4 bg-sky-50/60 rounded-2xl border-2 border-slate-900">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-sky-900">
                  <Calendar className="w-4 h-4" />
                  <span>End Schedule</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border-2 border-slate-900 bg-white text-xs font-bold text-slate-800"
                  />
                  <div className="relative flex items-center">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
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
              </div>
            </div>
            {errors.endDate && (
              <p className="text-xs text-red-500 font-semibold">{errors.endDate}</p>
            )}
          </div>

          {/* SECTION 4: SERVICES & REQUIREMENTS */}
          <div className="space-y-6 pt-4 border-t-2 border-slate-900">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border-2 border-slate-900 flex items-center justify-center text-emerald-900 shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  4. Services, Volunteer Needs & Capacity
                </h2>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  Update offered facilities, volunteer assistance needs, and attendee capacity
                </p>
              </div>
            </div>

            {/* Services Offered */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                  Services Offered <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Press Enter to add
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentServiceInput}
                  onChange={(e) => setCurrentServiceInput(e.target.value)}
                  onKeyDown={handleAddService}
                  placeholder="Type a service and press Enter..."
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

              {/* Service Badges */}
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

              {/* Quick suggestions */}
              <div className="space-y-1.5 pt-1">
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

            {/* Volunteer Requirements */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                Resource & Volunteer Requirements
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
                        {isSelected ? "✓ Requested" : "+ Add Need"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                Target Capacity / Person Limit <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-900 bg-white text-slate-900 text-sm font-extrabold focus:outline-none focus:border-sky-800"
              />
            </div>

            {/* Additional Instructions */}
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
                  placeholder="Type instruction and press Enter..."
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
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t-2 border-slate-900">
            <Link
              href={`/campaigns/${id}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-slate-900 border-2 border-slate-900 rounded-xl uppercase tracking-widest text-xs font-black hover:bg-slate-100 transition-all text-center"
            >
              Discard Changes
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-8 py-4 bg-sky-800 text-white border-2 border-slate-900 rounded-2xl uppercase tracking-widest text-xs font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Campaign Updates</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
