"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";
import OSMCampaignMap from "@/components/OSMCampaignMap";
import CampaignRegistrationModal from "@/components/CampaignRegistrationModal";
import HostAttendeesDrawer from "@/components/HostAttendeesDrawer";

// Lucide icons
import {
  ArrowLeft,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Navigation,
  Mail,
  ShieldCheck,
  Megaphone,
  HeartHandshake,
  Tag,
  Stethoscope,
  Copy,
  Check,
  FileText,
  Edit3,
  Building,
  UserCheck,
  AlertTriangle,
  XCircle,
  CreditCard,
  Receipt,
  Ticket,
} from "lucide-react";

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { data: session, status: authStatus } = useSession();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);

  // Registration & Host States
  const [regMetrics, setRegMetrics] = useState<any>(null);
  const [userRegistration, setUserRegistration] = useState<any>(null);
  const [allRegistrations, setAllRegistrations] = useState<any[]>([]);
  const [isHostFromApi, setIsHostFromApi] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isHostDrawerOpen, setIsHostDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");

  const creatorId =
    typeof campaign?.createdBy === "object"
      ? campaign?.createdBy?._id
      : campaign?.createdBy;
  const creatorEmail =
    typeof campaign?.createdBy === "object"
      ? campaign?.createdBy?.email
      : null;
  const currentUserId = (session?.user as any)?.id;
  const currentUserEmail = session?.user?.email;

  const isHost = Boolean(
    isHostFromApi ||
    (currentUserId && creatorId && currentUserId.toString() === creatorId.toString()) ||
    (currentUserEmail && creatorEmail && currentUserEmail.toLowerCase() === creatorEmail.toLowerCase())
  );

  // Fetch campaign details
  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (!res.ok) {
        throw new Error("Campaign not found");
      }
      const data = await res.json();
      setCampaign(data.campaign);
    } catch (err: any) {
      console.error("Error fetching campaign details:", err);
      setError(err.message || "Failed to load campaign");
    }
  };

  // Fetch registration status and metrics
  const fetchRegistrations = async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}/registrations`);
      if (res.ok) {
        const data = await res.json();
        setRegMetrics(data.metrics);
        setUserRegistration(data.userRegistration);
        if (data.isHost !== undefined) {
          setIsHostFromApi(data.isHost);
        }
        if (data.registrations) {
          setAllRegistrations(data.registrations);
        }
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  };

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCampaign(), fetchRegistrations()]);
      setLoading(false);
    };

    loadData();
  }, [id, authStatus]);

  // Handle Stripe Payment Redirect verification
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const paymentStatus = searchParams.get("payment_status");

    if (sessionId && paymentStatus === "success" && id) {
      const verifyStripePayment = async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`/api/campaigns/${id}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
          const data = await res.json();
          if (res.ok) {
            setActionSuccessMessage(
              `Payment confirmed! Pass #${data.invoiceNumber} generated. A black-and-white monospace invoice has been sent to your email.`,
            );
            await fetchRegistrations();
          } else {
            setActionErrorMessage(data.error || "Failed to verify payment");
          }
        } catch (err: any) {
          console.error("Error verifying payment:", err);
          setActionErrorMessage("Payment verification failed");
        } finally {
          setActionLoading(false);
          // Remove query params from address bar without reload
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      };

      verifyStripePayment();
    } else if (paymentStatus === "cancelled") {
      setActionErrorMessage("Payment was cancelled. You have not been charged.");
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, [searchParams, id]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyTxn = (text: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    }
  };

  const handleDirections = () => {
    if (!campaign?.location?.lat || !campaign?.location?.lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${campaign.location.lat},${campaign.location.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Trigger Registration
  const handleRegisterConfirm = async () => {
    if (!session || !session.user) {
      router.push(`/auth?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (isHost) {
      setActionErrorMessage("As the host organizer of this event, you cannot register as an attendee for your own campaign.");
      setIsRegModalOpen(false);
      return;
    }

    setActionLoading(true);
    setActionErrorMessage("");
    try {
      const res = await fetch(`/api/campaigns/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setIsRegModalOpen(false);

      if (data.requiresPayment && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.isWaitlist) {
        setActionSuccessMessage(
          `Target capacity reached. You have been added to Waiting List Position #${data.waitlistPosition}. You will be notified via email if a spot opens up!`,
        );
      } else {
        setActionSuccessMessage(
          "Registration confirmed successfully! A full event confirmation email has been dispatched to your email address.",
        );
      }

      await fetchRegistrations();
    } catch (err: any) {
      console.error("Error registering:", err);
      setActionErrorMessage(err.message || "Failed to complete registration");
      setIsRegModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Cancellation
  const handleCancelRegistration = async () => {
    setActionLoading(true);
    setActionErrorMessage("");
    try {
      const res = await fetch(`/api/campaigns/${id}/register`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel registration");
      }

      setIsCancelModalOpen(false);
      setActionSuccessMessage("Registration has been cancelled successfully.");
      await fetchRegistrations();
    } catch (err: any) {
      console.error("Error cancelling registration:", err);
      setActionErrorMessage(err.message || "Failed to cancel registration");
      setIsCancelModalOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
        <BackgroundPattern />
        <TetrisLoading
          size="md"
          speed="normal"
          showLoadingText={true}
          loadingText="Loading campaign details..."
        />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
        <BackgroundPattern />
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-slate-900 text-center space-y-4 shadow-xl max-w-md w-full relative z-10">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900 uppercase">
            Campaign Not Found
          </h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            The healthcare campaign you are looking for may have concluded or the URL is invalid.
          </p>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-800 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Campaigns</span>
          </Link>
        </div>
      </div>
    );
  }

  const confirmedCount = regMetrics?.confirmedCount ?? 0;
  const capacity = regMetrics?.capacity ?? campaign.capacity ?? 100;
  const spotsRemaining = regMetrics?.spotsRemaining ?? Math.max(0, capacity - confirmedCount);
  const isOverCapacity = confirmedCount >= capacity;
  const isRegistered = Boolean(userRegistration);
  const isConfirmedAttendee = userRegistration?.status === "confirmed";
  const isWaitlistAttendee = userRegistration?.status === "waitlist";

  const capacityPercentage = Math.min(100, Math.round((confirmedCount / capacity) * 100));

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-start p-4 pt-8 pb-36 relative">
      <BackgroundPattern />

      <div className="w-full max-w-6xl space-y-8 relative z-10">
        {/* Top Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Campaigns</span>
          </Link>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isHost && (
              <>
                <button
                  type="button"
                  onClick={() => setIsHostDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-800 text-white rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-all shadow-sm cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>View Registrations ({confirmedCount})</span>
                </button>

                <Link
                  href={`/campaigns/${id}/edit`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-slate-950 rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider hover:bg-amber-500 transition-all shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Campaign</span>
                </Link>
              </>
            )}

            <button
              onClick={handleShare}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>

            <Link
              href="/create-campaign"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Host Campaign</span>
            </Link>
          </div>
        </div>

        {/* Global Notification Alerts */}
        {actionSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-2xl flex items-start justify-between gap-3 text-emerald-950 text-xs font-bold shadow-md"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{actionSuccessMessage}</p>
            </div>
            <button
              onClick={() => setActionSuccessMessage("")}
              className="text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}

        {actionErrorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-rose-50 border-2 border-rose-600 rounded-2xl flex items-start justify-between gap-3 text-rose-950 text-xs font-bold shadow-md"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{actionErrorMessage}</p>
            </div>
            <button
              onClick={() => setActionErrorMessage("")}
              className="text-rose-800 hover:text-rose-950 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Hero Section: 1:1 Square Banner + Key Details */}
        <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: 1:1 Aspect Ratio Banner Image */}
          <div className="lg:col-span-5 relative w-full aspect-square bg-slate-100 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-900 overflow-hidden flex items-center justify-center">
            <img
              src={campaign.bannerImage}
              alt={campaign.name}
              className="w-full h-full object-cover"
            />

            {/* Fee Badge Overlay */}
            <div className="absolute top-4 left-4">
              <span
                className={`px-3.5 py-1.5 backdrop-blur-md border-2 border-slate-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg ${
                  campaign.feeType === "free"
                    ? "bg-emerald-500 text-white"
                    : "bg-sky-800 text-white"
                }`}
              >
                {campaign.feeType === "free"
                  ? "🎉 Free Entry"
                  : `₹${campaign.feeAmount} Per Person`}
              </span>
            </div>
          </div>

          {/* Right Column: Title, Tagline, Host Info, Quick Highlights */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Verified Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Healthcare Camp
                </span>
                <span className="px-3 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {campaign.location?.city || "Local Drive"}
                </span>
                {isHost && (
                  <span className="px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    ★ You are the Host
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight leading-snug">
                  {campaign.name}
                </h1>
                <p className="text-sm sm:text-base text-slate-700 font-semibold leading-relaxed border-l-4 border-sky-800 pl-3">
                  {campaign.tagline}
                </p>
              </div>
            </div>

            {/* Host Organizer NGO Info Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                  {campaign.ngo?.logo ? (
                    <img
                      src={campaign.ngo.logo}
                      alt={campaign.ngo.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building className="w-6 h-6 text-sky-800" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <span>Hosted By Registered NGO</span>
                    {isHost && <span className="text-amber-700 font-bold">(Your NGO)</span>}
                  </p>
                  <p className="text-sm font-black text-slate-900 truncate">
                    {campaign.ngo?.name || "Healthcare NGO / Trust"}
                  </p>
                  <p className="text-xs text-slate-600 font-bold truncate">
                    {campaign.ngo?.tagline ||
                      (campaign.ngo?.city
                        ? `${campaign.ngo.city}, ${campaign.ngo.state || ""}`
                        : "Community Healthcare Foundation")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isHost ? (
                  <button
                    type="button"
                    onClick={() => setIsHostDrawerOpen(true)}
                    className="px-3.5 py-2 bg-sky-800 text-white rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider hover:bg-slate-900 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Roster</span>
                  </button>
                ) : (
                  campaign.createdBy?.email && (
                    <a
                      href={`mailto:${campaign.createdBy.email}?subject=Inquiry about ${encodeURIComponent(campaign.name)}`}
                      className="px-4 py-2 bg-white text-slate-900 rounded-xl border-2 border-slate-900 text-xs font-black uppercase tracking-wider hover:bg-sky-800 hover:text-white transition-all shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Contact NGO</span>
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-3 rounded-xl border-2 border-slate-900 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  Date
                </span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">
                  {campaign.startDate}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border-2 border-slate-900 shadow-sm">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  Time Slot
                </span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">
                  {campaign.startTime} - {campaign.endTime}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border-2 border-slate-900 shadow-sm col-span-2 sm:col-span-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  Target Capacity
                </span>
                <span className="text-xs font-black text-slate-900 block mt-0.5">
                  {campaign.capacity} Attendees
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* REGISTRATION & ADMISSION CONTROL PANEL */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-900 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-sky-800" />
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  Event Registration & Pass Desk
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {isRegistered
                  ? "You have an active registration for this healthcare event."
                  : isOverCapacity
                  ? "Target capacity reached. Priority waitlist is currently accepting applicants."
                  : "Seats are currently available. Register to receive your official entry pass."}
              </p>
            </div>

            {/* Capacity Counter Meter */}
            <div className="bg-slate-50 p-3 rounded-2xl border-2 border-slate-900 shrink-0 min-w-55">
              <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-1.5">
                <span>Seats Filled</span>
                <span>
                  {confirmedCount} / {capacity}
                </span>
              </div>
              {/* Solid colored Progress Bar */}
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-400">
                <div
                  className={`h-full transition-all duration-500 ${
                    capacityPercentage >= 100
                      ? "bg-rose-600"
                      : capacityPercentage >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${capacityPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-1">
                <span>{spotsRemaining} spots remaining</span>
                {regMetrics?.waitlistCount > 0 && (
                  <span className="text-amber-700">
                    {regMetrics.waitlistCount} in waitlist
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE REGISTRATION STATUS BANNER */}
          {isRegistered ? (
            <div className="space-y-4">
              {isConfirmedAttendee && (
                <div className="p-6 bg-emerald-50 rounded-2xl border-2 border-emerald-600 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 border border-emerald-800">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                          ✓ Confirmed Admission
                        </span>
                        <h3 className="text-base font-black text-emerald-950 uppercase">
                          You are registered to attend this campaign
                        </h3>
                        <p className="text-xs text-emerald-900 font-medium">
                          Attendee Name: <strong>{userRegistration.name}</strong> ({userRegistration.email})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        disabled={actionLoading}
                        className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl border-2 border-rose-600 text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel Registration</span>
                      </button>
                    </div>
                  </div>

                  {/* Transaction / Invoice Details if Paid */}
                  {userRegistration.paymentStatus === "paid" && (
                    <div className="p-4 bg-white rounded-xl border border-emerald-300 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Transaction ID
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 truncate">
                            {userRegistration.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTxn(userRegistration.transactionId)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Copy Transaction ID"
                          >
                            {copiedTxn ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Invoice Number
                        </span>
                        <span className="font-mono font-bold text-slate-900 block mt-0.5">
                          {userRegistration.invoiceNumber || "MED-INV-OFFICIAL"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                          Amount Paid
                        </span>
                        <span className="font-bold text-emerald-700 block mt-0.5">
                          ₹{userRegistration.feeAmount} (Stripe Verified)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isWaitlistAttendee && (
                <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-600 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 border border-amber-800">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="px-2.5 py-0.5 bg-amber-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                          Waiting List Active
                        </span>
                        <h3 className="text-base font-black text-amber-950 uppercase">
                          You are at Position #{userRegistration.waitlistPosition} on the Waiting List
                        </h3>
                        <p className="text-xs text-amber-900 font-medium leading-relaxed">
                          Because target capacity was reached when you registered, your spot is queued.
                          If a confirmed registrant cancels, you will automatically be promoted to confirmed and notified via email!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl border-2 border-rose-600 text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Leave Waitlist</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isHost ? (
            /* HOST ORGANIZER ADMINISTRATIVE PANEL - CANNOT REGISTER FOR OWN EVENT */
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 border-2 border-amber-600 text-amber-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                    <span>Host Organizer</span>
                  </span>
                  <span className="px-3 py-1 bg-sky-800 text-white rounded-lg border-2 border-slate-900 font-black text-xs uppercase tracking-wider">
                    Event Administration
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 uppercase">
                  You are Hosting this Healthcare Campaign
                </h3>
                <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
                  As the host organizer, you cannot register as an attendee for your own event. You have administrative access to manage attendee registrations, review transaction receipts, export CSV rosters, and update campaign details.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsHostDrawerOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-sky-800 hover:bg-slate-900 text-white rounded-2xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Attendees ({confirmedCount})</span>
                </button>

                <Link
                  href={`/campaigns/${id}/edit`}
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-2xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Event</span>
                </Link>
              </div>
            </div>
          ) : authStatus !== "authenticated" || !session ? (
            /* UNAUTHENTICATED VISITOR - STRICT LOGIN REQUIRED BANNER */
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-amber-100 border-2 border-amber-600 text-amber-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                    <span>Sign In Required</span>
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg border-2 border-slate-900 font-black text-xs uppercase tracking-wider ${
                      campaign.feeType === "free"
                        ? "bg-emerald-500 text-white"
                        : "bg-sky-800 text-white"
                    }`}
                  >
                    {campaign.feeType === "free"
                      ? "Free Pass"
                      : `Pass Fee: ₹${campaign.feeAmount}`}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 uppercase">
                  Authentication Required to Register
                </h3>
                <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
                  You must be authenticated with your MedChainify account to register for this event, receive your official entry pass, and access attendee updates. Unauthenticated or guest registrations are not permitted.
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <Link
                  href={`/auth?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : `/campaigns/${id}`)}`}
                  className="w-full md:w-auto px-8 py-4 bg-sky-800 hover:bg-slate-900 text-white rounded-2xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In to Register</span>
                </Link>
              </div>
            </div>
          ) : (
            /* AUTHENTICATED UNREGISTERED USER - REGISTRATION ACTION CTA */
            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-lg border-2 border-slate-900 font-black text-xs uppercase tracking-wider ${
                      campaign.feeType === "free"
                        ? "bg-emerald-500 text-white"
                        : "bg-sky-800 text-white"
                    }`}
                  >
                    {campaign.feeType === "free"
                      ? "Free Registration Pass"
                      : `Pass Fee: ₹${campaign.feeAmount}`}
                  </span>
                  {isOverCapacity && (
                    <span className="px-2.5 py-1 bg-amber-200 border border-amber-400 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      Overcapacity • Waitlist Queue
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-slate-900 uppercase">
                  {isOverCapacity
                    ? "Join the Priority Waiting List"
                    : "Register to attend this healthcare campaign"}
                </h3>
                <p className="text-xs text-slate-600 font-medium max-w-xl">
                  {isOverCapacity
                    ? "Get queued on the priority roster. As soon as any attendee cancels, you will be automatically admitted and notified."
                    : campaign.feeType === "free"
                    ? "Clicking register will confirm your booking and send full campaign details and instructions directly to your email."
                    : "Pay securely via Stripe. A black-and-white monospace receipt & invoice will be sent to your email. (Note: Paid registration fees are strictly non-refundable upon cancellation)."}
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(true)}
                  disabled={actionLoading}
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest text-white shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                    isOverCapacity
                      ? "bg-amber-600 hover:bg-amber-700"
                      : campaign.feeType === "paid"
                      ? "bg-sky-800 hover:bg-slate-900"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isOverCapacity ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Join Waiting List</span>
                    </>
                  ) : campaign.feeType === "paid" ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Register & Pay ₹{campaign.feeAmount}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Register For Event</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Main Column: Description, Services, Requirements, Instructions */}
          <div className="lg:col-span-7 space-y-8">
            {/* Campaign Mission & Description */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-900 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-wider text-sm border-b-2 border-slate-900 pb-3">
                <FileText className="w-4 h-4 text-sky-800" />
                <span>About This Campaign</span>
              </div>

              <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                {campaign.description}
              </p>
            </div>

            {/* Services Offered */}
            {campaign.services && campaign.services.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-900 shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-wider text-sm border-b-2 border-slate-900 pb-3">
                  <Stethoscope className="w-4 h-4 text-sky-800" />
                  <span>Medical Services & Facilities Offered</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {campaign.services.map((svc: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-sky-50 rounded-xl border-2 border-sky-800/40 flex items-center gap-2.5 text-xs font-black text-slate-900"
                    >
                      <CheckCircle2 className="w-4 h-4 text-sky-800 shrink-0" />
                      <span>{svc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seeking Assistance / Requirements */}
            {campaign.requirements && campaign.requirements.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-900 shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-wider text-sm border-b-2 border-slate-900 pb-3">
                  <HeartHandshake className="w-4 h-4 text-purple-800" />
                  <span>Seeking Community Support & Volunteers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campaign.requirements.map((req: string, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-900/30 space-y-1"
                    >
                      <div className="flex items-center gap-2 text-xs font-black text-purple-950 uppercase tracking-wider">
                        <span>⚡</span>
                        <span>{req}</span>
                      </div>
                      <p className="text-[11px] text-purple-900 font-medium">
                        {req === "Doctor" && "Medical practitioners and specialists for consultations"}
                        {req === "Volunteer" && "Field assistants for queue handling & patient registration"}
                        {req === "Fund" && "Sponsorships and contributions for medicines and tests"}
                        {req === "Venue" && "Space logistics, tents, or clean indoor facilities"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Guidelines & Instructions */}
            {campaign.additionalInstructions && campaign.additionalInstructions.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-900 shadow-lg space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-wider text-sm border-b-2 border-slate-900 pb-3">
                  <Tag className="w-4 h-4 text-slate-800" />
                  <span>Important Instructions For Attendees</span>
                </div>

                <div className="space-y-2">
                  {campaign.additionalInstructions.map((inst: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs font-bold text-slate-800"
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{inst}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Location & Map, Timings, Directions */}
          <div className="lg:col-span-5 space-y-8">
            {/* Location & Interactive Map Card */}
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-wider text-sm">
                  <MapPin className="w-4 h-4 text-sky-800" />
                  <span>Venue & Location</span>
                </div>

                {campaign.location?.city && (
                  <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {campaign.location.city}
                  </span>
                )}
              </div>

              {/* Address Details */}
              <div className="space-y-1 text-xs">
                <p className="font-black text-slate-900 leading-relaxed">
                  {campaign.location?.address}
                </p>
                {(campaign.location?.state || campaign.location?.pincode) && (
                  <p className="text-slate-500 font-bold text-[11px]">
                    {[campaign.location.state, campaign.location.pincode ? `PIN: ${campaign.location.pincode}` : null]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
              </div>

              {/* Embedded OpenStreetMap Canvas */}
              <div className="h-68 w-full rounded-2xl overflow-hidden border-2 border-slate-900 shadow-sm relative">
                <OSMCampaignMap
                  lat={campaign.location?.lat || 28.6139}
                  lng={campaign.location?.lng || 77.209}
                  campaignTitle={campaign.name}
                  address={campaign.location?.address}
                  height="100%"
                />
              </div>

              {/* Get Directions CTA */}
              <button
                type="button"
                onClick={handleDirections}
                className="w-full py-3.5 bg-sky-800 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions & Navigate</span>
              </button>
            </div>

            {/* Campaign Schedule Overview */}
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-900 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-wider text-sm border-b-2 border-slate-900 pb-3">
                <Calendar className="w-4 h-4 text-sky-800" />
                <span>Full Schedule</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Campaign Start
                    </span>
                    <span className="font-black text-slate-900 block">{campaign.startDate}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-black text-slate-800 text-[11px]">
                    {campaign.startTime}
                  </span>
                </div>

                <div className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Campaign Concludes
                    </span>
                    <span className="font-black text-slate-900 block">{campaign.endDate}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-black text-slate-800 text-[11px]">
                    {campaign.endTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Confirmation Modal */}
      <CampaignRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        onConfirm={handleRegisterConfirm}
        campaign={campaign}
        loading={actionLoading}
        isOverCapacity={isOverCapacity}
        isHost={isHost}
      />

      {/* Cancel Registration Confirmation Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl max-w-md w-full p-6 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Cancel Registration
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Confirm your cancellation
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  Are you sure you want to cancel your registration for{" "}
                  <strong>{campaign.name}</strong>? Your spot will be released, and if there is anyone on the waiting list, they will be promoted automatically.
                </p>

                {userRegistration?.paymentStatus === "paid" && (
                  <div className="p-3 bg-rose-50 rounded-xl border-2 border-rose-500 text-xs text-rose-950 font-bold leading-relaxed space-y-1">
                    <p className="uppercase font-black text-[11px] text-rose-800">
                      ⚠️ Strict Non-Refund Policy Notice
                    </p>
                    <p className="text-[11px] text-rose-900 font-medium">
                      You paid <strong>₹{userRegistration.feeAmount}</strong> for this registration pass. If you cancel your registration, <strong>no refund will be issued</strong> under any circumstances.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-white text-slate-900 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Keep Pass
                </button>
                <button
                  type="button"
                  onClick={handleCancelRegistration}
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  {actionLoading ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Host Attendee Management Drawer */}
      {isHost && (
        <HostAttendeesDrawer
          isOpen={isHostDrawerOpen}
          onClose={() => setIsHostDrawerOpen(false)}
          campaign={campaign}
          registrations={allRegistrations}
          metrics={regMetrics}
        />
      )}
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
          <BackgroundPattern />
          <TetrisLoading
            size="md"
            speed="normal"
            showLoadingText={true}
            loadingText="Loading campaign details..."
          />
        </div>
      }
    >
      <CampaignDetailContent />
    </Suspense>
  );
}
