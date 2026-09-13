"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  X,
  CreditCard,
  CheckCircle2,
  Users,
} from "lucide-react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface CampaignRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  campaign: any;
  loading: boolean;
  isOverCapacity?: boolean;
  isHost?: boolean;
}

export default function CampaignRegistrationModal({
  isOpen,
  onClose,
  onConfirm,
  campaign,
  loading,
  isOverCapacity = false,
  isHost = false,
}: CampaignRegistrationModalProps) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!isOpen || !campaign) return null;

  if (isHost) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Host Organizer Notice
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Registration Not Permitted
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              You are the host organizer of this event. Hosts cannot register as attendees for their own campaigns.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  if (!session || !session.user) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  Authentication Required
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Please sign in to register
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              You must be signed in with your MedChainify account to register for this event. Guest registrations are not allowed.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 bg-white text-slate-900 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/auth?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`);
                }}
                className="w-1/2 py-2.5 bg-sky-800 hover:bg-slate-900 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const isPaid = campaign.feeType === "paid" && campaign.feeAmount > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl max-w-3xl w-full overflow-hidden relative my-auto"
        >
          {/* Header - Compact */}
          <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b-2 border-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-800 flex items-center justify-center border border-sky-400">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  Confirm Event Registration
                </h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Review pass details and finalize your registration
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body - Wide 2-Column Grid Layout */}
          <div className="p-5">
            {/* Overcapacity / Waitlist Notice */}
            {isOverCapacity && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl border-2 border-amber-600 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <p className="text-xs text-amber-950 font-bold leading-tight">
                  <strong>Target Capacity Reached:</strong> You are registering for the <strong>Priority Waiting List</strong>. You will be automatically admitted if a spot opens.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Left Column: Event Particulars (7 cols) */}
              <div className="md:col-span-7 space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-900 space-y-2.5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Campaign Particulars
                    </span>
                    <h4 className="text-sm font-black text-slate-900 uppercase leading-snug">
                      {campaign.name}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-0.5">
                      {campaign.tagline}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold bg-white p-2 rounded-lg border border-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-sky-800 shrink-0" />
                      <span className="truncate">{campaign.startDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-800 font-bold bg-white p-2 rounded-lg border border-slate-200">
                      <Clock className="w-3.5 h-3.5 text-sky-800 shrink-0" />
                      <span className="truncate">{campaign.startTime} - {campaign.endTime}</span>
                    </div>

                    <div className="col-span-2 flex items-start gap-1.5 text-slate-800 font-bold bg-white p-2 rounded-lg border border-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-sky-800 shrink-0 mt-0.5" />
                      <span className="truncate">{campaign.location?.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Fee, Policy & Confirmation (5 cols) */}
              <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
                <div className="p-4 rounded-2xl border-2 border-slate-900 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                      Pass Type
                    </span>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-lg border-2 border-slate-900 ${
                        isPaid ? "bg-sky-800 text-white" : "bg-emerald-500 text-white"
                      }`}
                    >
                      {isPaid ? `₹${campaign.feeAmount}` : "Free Pass"}
                    </span>
                  </div>

                  {isPaid && !isOverCapacity ? (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-sky-800 shrink-0" />
                        <span>Secured via Stripe with B&W invoice.</span>
                      </div>
                      <div className="p-2 bg-rose-50 rounded-xl border border-rose-300 text-[10px] text-rose-950 font-bold leading-tight">
                        ⚠️ <strong>Non-Refundable:</strong> If you cancel after payment, no refund will be issued.
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Complimentary community healthcare pass.</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs font-black text-slate-900">
                    Confirm your registration?
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {isPaid ? "Invoice will be emailed on payment." : "Pass details will be emailed directly."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions - Compact Row */}
          <div className="px-5 py-3.5 bg-slate-50 border-t-2 border-slate-900 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2.5 px-5 bg-white text-slate-900 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`py-2.5 px-6 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                isPaid && !isOverCapacity
                  ? "bg-sky-800 hover:bg-sky-900"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isPaid && !isOverCapacity
                      ? `Yes, Pay ₹${campaign.feeAmount}`
                      : isOverCapacity
                      ? "Yes, Join Waitlist"
                      : "Yes, Confirm Registration"}
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
