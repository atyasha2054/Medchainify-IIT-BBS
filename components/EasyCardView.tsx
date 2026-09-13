"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Activity,
  Calendar,
  VenusAndMars,
  Droplet,
  Heart,
  PhoneCall,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";

interface EasyCardViewProps {
  user: any;
  shareUrl: string;
}

export default function EasyCardView({ user, shareUrl }: EasyCardViewProps) {
  const [flipped, setFlipped] = useState(false);
  const easyCard = user?.easyCard || {};

  // Formatted Profile info
  const name = user?.name || "Patient Name";
  const patientId = user?.idNumber || "000000";
  const gender = user?.gender || "Male";
  const weight = user?.weight ? `${user.weight} kg` : "N/A";
  const height = user?.height?.feet
    ? `${user.height.feet}'${user.height.inches || 0}"`
    : "N/A";
  const diet = user?.diet || "Not Set";
  const diseases =
    user?.diseases && user.diseases.length > 0
      ? user.diseases
      : ["None Registered"];

  const ageText = user?.age
    ? `${user.age.years}y ${user.age.months}m ${user.age.days}d`
    : "Not Calculated";

  const bloodGroup = user?.bloodGroup || easyCard.bloodGroup || "O-Positive";
  const allergies =
    easyCard.allergies && easyCard.allergies.length > 0
      ? easyCard.allergies
      : ["None Identified"];
  const chronicConditions =
    easyCard.chronicConditions && easyCard.chronicConditions.length > 0
      ? easyCard.chronicConditions
      : diseases;
  const emergencyContact =
    easyCard.emergencyContact || "Emergency Services (112)";
  const healthStatusSummary =
    easyCard.healthStatusSummary ||
    "No clinical history scanned yet. Click Scan below to generate your Easy Card summary.";
  const healthIndexScore = easyCard.healthIndexScore || 80;
  const primaryCarePhysician =
    easyCard.primaryCarePhysician || "None Designated";

  // QR Code URL using public QR Server
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=0f172a&data=${encodeURIComponent(shareUrl)}`;

  // Barcode mock using stylized divs
  const renderBarcode = () => {
    const bars = [2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 4, 1, 3];
    return (
      <div className="flex items-end h-6 gap-[1.5px] opacity-40">
        {bars.map((w, idx) => (
          <div
            key={idx}
            className="bg-white h-full"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 3D Flip Card Container */}
      <div
        className="w-full max-w-[460px] aspect-[1.586/1] cursor-pointer perspective-1000 group relative"
        style={{ perspective: "1500px" }}
        onClick={() => setFlipped(!flipped)}
      >
        {/* Flipped Hint Badge */}
        <div className="absolute -top-3 -right-3 z-20 bg-slate-900 text-white border-2 border-slate-900 text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md animate-bounce group-hover:scale-105 transition-transform">
          Click to Flip
        </div>

        <div
          className="relative w-full h-full duration-700 transform-style-3d shadow-2xl rounded-3xl"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition:
              "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          {/* ────── FRONT SIDE ────── */}
          <div
            className="absolute inset-0 w-full h-full rounded-3xl p-6 border-2 border-slate-950 bg-linear-to-br from-slate-900 via-sky-950 to-slate-900 text-white flex flex-col justify-between overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Gloss Highlight Overlay */}
            <div className="absolute -inset-y-12 -inset-x-24 bg-linear-to-r from-transparent via-white/5 to-transparent rotate-45 pointer-events-none" />

            {/* Top row */}
            <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
                    MedChainify
                  </h4>
                  <p className="text-[7px] uppercase tracking-widest text-slate-400">
                    Easy Health Identity
                  </p>
                </div>
              </div>

              {/* Health Score Gauge */}
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl shadow-inner">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="13"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="2.5"
                      fill="transparent"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="13"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 13}`}
                      strokeDashoffset={`${2 * Math.PI * 13 * (1 - healthIndexScore / 100)}`}
                    />
                  </svg>
                  <span className="absolute text-[8px] font-bold font-mono">
                    {healthIndexScore}
                  </span>
                </div>
                <div className="text-[7px] uppercase tracking-widest text-slate-300 font-bold">
                  Health Index
                </div>
              </div>
            </div>

            {/* Middle Row (Chip / Contactless & Profile Metrics) */}
            <div className="grid grid-cols-5 gap-4 items-center z-10 my-1">
              <div className="col-span-1 flex flex-col gap-2">
                {/* Gold Chip */}
                <div className="w-9 h-7 rounded-md bg-linear-to-r from-yellow-300 via-amber-400 to-yellow-300 border border-amber-600/30 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 border border-amber-500/40 rounded flex flex-wrap p-1">
                    <div className="w-1/2 h-1/2 border-r border-b border-amber-800/10" />
                    <div className="w-1/2 h-1/2 border-b border-amber-800/10" />
                    <div className="w-1/2 h-1/2 border-r border-amber-800/10" />
                  </div>
                </div>

                {/* Contactless Wave */}
                <svg
                  className="h-4 w-4 text-slate-400 ml-1.5 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              {/* Patient Core Details */}
              <div className="col-span-4 pl-2 border-l border-white/10 space-y-1 text-left">
                <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">
                  Patient Name
                </p>
                <h3 className="text-base font-extrabold uppercase tracking-wide text-white truncate max-w-[280px]">
                  {name}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1.5 text-[8px] uppercase tracking-widest text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5 text-sky-400" />
                    {ageText}
                  </span>
                  <span className="flex items-center gap-1">
                    <VenusAndMars className="h-2.5 w-2.5 text-sky-400" />
                    {gender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplet className="h-2.5 w-2.5 text-sky-400" />
                    {bloodGroup}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-end border-t border-white/10 pt-3 z-10">
              <div className="text-left space-y-1">
                <div className="flex items-center gap-3 text-[7px] uppercase tracking-widest text-slate-400">
                  <span>
                    Hgt: <strong className="text-white">{height}</strong>
                  </span>
                  <span>
                    Wgt: <strong className="text-white">{weight}</strong>
                  </span>
                  <span>
                    Diet: <strong className="text-white">{diet}</strong>
                  </span>
                </div>
                <div className="text-[9px] font-mono tracking-widest text-sky-400 font-bold">
                  ID: #{patientId}
                </div>
              </div>

              {/* Barcode graphic */}
              <div className="flex flex-col items-end gap-1">
                {renderBarcode()}
                <span className="text-[6px] uppercase tracking-widest text-slate-500 font-mono">
                  Secured by MedChainify
                </span>
              </div>
            </div>
          </div>

          {/* ────── BACK SIDE ────── */}
          <div
            className="absolute inset-0 w-full h-full rounded-3xl p-6 border-2 border-slate-950 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col justify-between overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Top Row back */}
            <div className="flex justify-between items-start border-b border-white/5 pb-2">
              <div className="text-left">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                  Clinical Data & Emergency Summary
                </h4>
                <p className="text-[6px] uppercase tracking-widest text-slate-400">
                  Scanned Medical Records Index
                </p>
              </div>
              <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                <Heart className="h-3 w-3 text-rose-500 fill-rose-500 animate-pulse" />
                <span className="text-[6px] font-bold tracking-widest text-rose-400">
                  EMERGENCY ACTIVE
                </span>
              </div>
            </div>

            {/* Middle Row back */}
            <div className="grid grid-cols-3 gap-4 my-2 text-left flex-1 items-center">
              {/* Data Lists */}
              <div className="col-span-2 space-y-2">
                <div>
                  <h5 className="text-[7px] uppercase tracking-widest text-sky-400 font-bold mb-1 flex items-center gap-1">
                    <Activity className="h-2.5 w-2.5" /> Chronic Conditions &
                    Diseases
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {chronicConditions.map((cond: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[7px] uppercase font-bold tracking-wide"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-[7px] uppercase tracking-widest text-rose-400 font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" /> Identified
                    Allergies
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {allergies.map((allergy: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[7px] uppercase font-bold tracking-wide"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-[7px] uppercase tracking-widest text-emerald-400 font-bold mb-0.5 flex items-center gap-1">
                    <Stethoscope className="h-2.5 w-2.5" /> Primary Care
                    Physician
                  </h5>
                  <p className="text-[9px] text-white font-medium pl-3">
                    {primaryCarePhysician}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="col-span-1 flex flex-col items-center justify-center bg-white p-2.5 rounded-xl border border-slate-950 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="Easy Card QR Code"
                  className="w-[72px] h-[72px] object-contain"
                />
                <span className="text-[5px] text-slate-500 uppercase tracking-widest mt-1 font-bold">
                  Scan to Verify
                </span>
              </div>
            </div>

            {/* Bottom Row back */}
            <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[7px] text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-1 text-left">
                <PhoneCall className="h-2.5 w-2.5 text-sky-400" />
                <span>
                  Contact:{" "}
                  <strong className="text-white">{emergencyContact}</strong>
                </span>
              </div>
              <div className="text-right italic text-slate-500 font-bold">
                Security Hash: #{patientId.split("").reverse().join("")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Overview Summary Panel - Concise format: only relevant point */}
      <div className="w-full max-w-[460px] bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-3xl p-5 shadow-xl text-left">
        <h4 className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-slate-400 mb-1">
          Easy Card Assessment
        </h4>
        <p className="text-xs text-slate-700 leading-relaxed italic">
          "{healthStatusSummary}"
        </p>
      </div>
    </div>
  );
}
