"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaHeartbeat,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaStethoscope,
  FaArrowRight,
  FaSyncAlt,
  FaInfoCircle,
  FaNotesMedical,
  FaPills,
  FaAppleAlt,
  FaMicroscope,
  FaShieldAlt,
  FaChevronDown,
  FaChevronUp,
  FaCheck,
  FaTimes,
  FaCalendarPlus,
  FaFileMedical,
  FaAward,
  FaBookMedical,
  FaRoute,
} from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { MdOutlineMedicalServices, MdClose } from "react-icons/md";
import { FiActivity } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

interface CareTask {
  _id: string;
  title: string;
  description: string;
  category: string;
  phase:
    | "DIAGNOSIS"
    | "TREATMENT"
    | "FOLLOW_UP"
    | "REHABILITATION"
    | "WELLNESS";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidenceScore: number;
  guidelineCitation?: string;
  clinicalReasoning: string;
  triggerSource: string;
  triggerSourceUrl?: string;
  actionType: string;
  actionLink: string;
  dueDate?: string;
  status:
    | "PENDING"
    | "COMPLETED"
    | "POSTPONED"
    | "DOCTOR_APPROVED"
    | "DISMISSED";
  doctorFeedback?: {
    status: string;
    notes?: string;
    updatedByDoctor?: string;
    updatedAt?: string;
  };
  completedAt?: string;
  postponedUntil?: string;
}

interface CareJourneyData {
  _id: string;
  healthStatusSummary: {
    primaryDiagnoses: string[];
    activeRiskLevel: "CRITICAL" | "ELEVATED" | "MODERATE" | "STABLE";
    activePhase:
      | "DIAGNOSIS"
      | "TREATMENT"
      | "FOLLOW_UP"
      | "REHABILITATION"
      | "WELLNESS";
    overallScore: number;
    lastAnalyzedAt: string;
  };
  tasks: CareTask[];
  milestonesCompletedCount: number;
}

const PHASES = [
  {
    id: "ALL",
    label: "All Care Phases",
    desc: "Complete longitudinal journey",
  },
  {
    id: "DIAGNOSIS",
    label: "Phase 1: Diagnosis & Assessment",
    desc: "Labs, Imaging & Specialist Consults",
  },
  {
    id: "TREATMENT",
    label: "Phase 2: Active Treatment",
    desc: "Medications & Active Protocols",
  },
  {
    id: "FOLLOW_UP",
    label: "Phase 3: Diagnostic Follow-up",
    desc: "Interval Re-testing & Screenings",
  },
  {
    id: "REHABILITATION",
    label: "Phase 4: Rehabilitation & Rehab",
    desc: "Physiotherapy & Recovery Milestones",
  },
  {
    id: "WELLNESS",
    label: "Phase 5: Metabolic & Wellness",
    desc: "Nutrition, AYUR & Lifestyle",
  },
];

const CATEGORIES = [
  { id: "ALL_CAT", label: "All Items", icon: FaRoute },
  { id: "TODAY", label: "Today's Tasks", icon: FaCalendarAlt },
  { id: "UPCOMING", label: "Upcoming Care", icon: FaClock },
  { id: "MISSED", label: "Missed Activities", icon: FaExclamationTriangle },
  { id: "LONG_TERM", label: "Long Term Goals", icon: FaNotesMedical },
  { id: "PREVENTIVE", label: "Preventive Care", icon: FaShieldAlt },
  { id: "RECOVERY", label: "Recovery Tracking", icon: FiActivity },
  { id: "WELLNESS", label: "Wellness & Diet", icon: FaAppleAlt },
  { id: "MILESTONE", label: "Completed Milestones", icon: FaCheckCircle },
];

export default function CareCoordinatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [journey, setJourney] = useState<CareJourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [selectedPhase, setSelectedPhase] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL_CAT");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Postpone modal state
  const [postponeModalTask, setPostponeModalTask] = useState<CareTask | null>(
    null,
  );
  const [postponeDays, setPostponeDays] = useState(7);

  // Doctor feedback modal state
  const [doctorModalTask, setDoctorModalTask] = useState<CareTask | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [doctorActionType, setDoctorActionType] = useState<
    "DOCTOR_APPROVE" | "DOCTOR_MODIFY" | "DOCTOR_DISMISS"
  >("DOCTOR_APPROVE");

  const isDoctor = (session?.user as any)?.role === "doctor";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const fetchCareJourney = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/care-coordinator");
      if (!res.ok) throw new Error("Failed to load care journey");
      const data = await res.json();
      setJourney(data.careJourney);
    } catch (err: any) {
      console.error(err);
      toast.error("Could not load care coordinator roadmap");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCareJourney();
    }
  }, [status, fetchCareJourney]);

  const handleSyncTimeline = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/care-coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error("Failed to re-analyze care journey");
      }

      const data = await res.json();
      setJourney(data.careJourney);
      toast.success("AI Coordinator synthesized latest health timeline!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update care journey");
    } finally {
      setSyncing(false);
    }
  };

  const handleTaskAction = async (
    taskId: string,
    action: string,
    extraData?: any,
  ) => {
    try {
      const res = await fetch("/api/care-coordinator", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          action,
          ...extraData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Action failed");
      }

      const data = await res.json();
      setJourney(data.careJourney);
      toast.success("Care journey updated!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Task update failed");
    }
  };

  const submitPostpone = () => {
    if (!postponeModalTask) return;
    const postponedDate = new Date(
      Date.now() + postponeDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    handleTaskAction(postponeModalTask._id, "POSTPONE", { postponedDate });
    setPostponeModalTask(null);
  };

  const submitDoctorFeedback = () => {
    if (!doctorModalTask) return;
    handleTaskAction(doctorModalTask._id, doctorActionType, { doctorNotes });
    setDoctorModalTask(null);
    setDoctorNotes("");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center">
        <TetrisLoading
          size="lg"
          speed="normal"
          showLoadingText={true}
          loadingText="Synthesizing Longitudinal Health Pathway..."
        />
      </div>
    );
  }

  const tasks = journey?.tasks || [];
  const activeDiagnoses = journey?.healthStatusSummary?.primaryDiagnoses || [];
  const riskLevel = journey?.healthStatusSummary?.activeRiskLevel || "STABLE";
  const activePhase = journey?.healthStatusSummary?.activePhase || "TREATMENT";
  const overallScore = journey?.healthStatusSummary?.overallScore || 88;

  // Filter tasks by selected phase and category
  const filteredTasks = tasks.filter((t) => {
    // Phase filter
    if (selectedPhase !== "ALL" && t.phase !== selectedPhase) {
      return false;
    }
    // Category filter
    if (selectedCategory === "MILESTONE") {
      return t.status === "COMPLETED" || t.category === "MILESTONE";
    }
    if (selectedCategory === "MISSED") {
      return (
        t.category === "MISSED" ||
        (t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          t.status === "PENDING")
      );
    }
    if (selectedCategory !== "ALL_CAT") {
      return (
        t.category === selectedCategory &&
        t.status !== "COMPLETED" &&
        t.status !== "DISMISSED"
      );
    }
    return t.status !== "COMPLETED" && t.status !== "DISMISSED";
  });

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-10 pb-36 relative">
      <BackgroundPattern />

      <div className="w-full max-w-[92%] space-y-8">
        {/* EXECUTIVE COMMAND HEADER */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-2 border-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-sky-800 dark:text-sky-300">
              <FaHeartbeat className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
              Executive Care Command Center
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              AI Care{" "}
              <span className="text-sky-900 dark:text-sky-400">
                Coordinator
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide max-w-2xl">
              Proactive longitudinal healthcare pathway engine synthesizing lab
              diagnostics, radiology, prescriptions, diet plans, and hospital
              history into milestone-based action plans.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handleSyncTimeline}
              disabled={syncing}
              className="h-12 px-6 bg-sky-900 hover:bg-sky-850 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-md border-2 border-slate-900 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FaSyncAlt className={cn("w-4 h-4", syncing && "animate-spin")} />
              {syncing ? "Analyzing Timeline..." : "Sync & Synthesize Timeline"}
            </Button>
          </div>
        </div>

        {/* LONGITUDINAL HEALTH GENOME & RISK INDEX */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Care Index Score */}
          <Card className="border-2 border-slate-900 bg-white/95 dark:bg-slate-900/95 shadow-md rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border-2 border-slate-900 flex items-center justify-center text-sky-900 dark:text-sky-400 shadow-sm shrink-0">
                <FaAward className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Care Health Score
                </h3>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {overallScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / 100
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Risk Level */}
          <Card className="border-2 border-slate-900 bg-white/95 dark:bg-slate-900/95 shadow-md rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl border-2 border-slate-900 flex items-center justify-center shadow-sm shrink-0",
                  riskLevel === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                    : riskLevel === "ELEVATED"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
                )}
              >
                <FaExclamationTriangle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Risk Profile
                </h3>
                <span
                  className={cn(
                    "inline-block mt-1 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-slate-900",
                    riskLevel === "CRITICAL"
                      ? "bg-rose-100 text-rose-800"
                      : riskLevel === "ELEVATED"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800",
                  )}
                >
                  {riskLevel}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Active Care Phase */}
          <Card className="border-2 border-slate-900 bg-white/95 dark:bg-slate-900/95 shadow-md rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border-2 border-slate-900 flex items-center justify-center text-indigo-800 dark:text-indigo-300 shadow-sm shrink-0">
                <FaRoute className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Active Care Phase
                </h3>
                <span className="inline-block mt-1 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-slate-900 bg-indigo-100 text-indigo-900">
                  {activePhase}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Diagnoses */}
          <Card className="border-2 border-slate-900 bg-white/95 dark:bg-slate-900/95 shadow-md rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border-2 border-slate-900 flex items-center justify-center text-purple-800 dark:text-purple-300 shadow-sm shrink-0">
                <FaStethoscope className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Longitudinal Conditions
                </h3>
                <div className="flex flex-wrap gap-1">
                  {activeDiagnoses.length > 0 ? (
                    activeDiagnoses.slice(0, 2).map((d, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold tracking-wider uppercase px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 truncate max-w-30"
                      >
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic font-medium">
                      None recorded
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CLINICAL DECISION SUPPORT DISCLOSURE BANNER */}
        <div className="bg-sky-50 dark:bg-sky-950/40 border-2 border-slate-900 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <FaInfoCircle className="w-5 h-5 text-sky-800 dark:text-sky-300 shrink-0" />
            <p className="text-[11px] text-sky-950 dark:text-sky-200 font-semibold leading-relaxed">
              <strong>Clinical Decision Support Protocol:</strong> AI Care
              Coordinator tasks are actionable decision support tools generated
              directly from clinical evidence. All items are synchronized with
              your attending doctor for qualified oversight.
            </p>
          </div>
          {isDoctor && (
            <span className="shrink-0 bg-sky-900 text-white text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-lg border border-slate-900 shadow-xs">
              Doctor Admin Mode Active
            </span>
          )}
        </div>

        {/* VISUAL CARE PATHWAY PHASE NAVIGATION GRID */}
        <div className="bg-white/95 dark:bg-slate-900/95 border-2 border-slate-900 rounded-3xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FaRoute className="w-4 h-4 text-sky-900 dark:text-sky-400" />{" "}
              Longitudinal Pathway Phases
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Select Phase to Filter
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
            {PHASES.map((p) => {
              const isSelected = selectedPhase === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhase(p.id)}
                  className={cn(
                    "p-3 rounded-2xl border-2 text-left transition-all cursor-pointer shadow-xs active:scale-95 flex flex-col justify-between h-20",
                    isSelected
                      ? "bg-sky-900 border-slate-900 text-white shadow-md"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-400",
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider truncate">
                    {p.label}
                  </span>
                  <span
                    className={cn(
                      "text-[8.5px] leading-tight font-medium truncate",
                      isSelected ? "text-sky-200" : "text-slate-500",
                    )}
                  >
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CATEGORY FILTER TABS */}
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            const count = tasks.filter((t) => {
              if (selectedPhase !== "ALL" && t.phase !== selectedPhase)
                return false;
              if (cat.id === "MILESTONE")
                return t.status === "COMPLETED" || t.category === "MILESTONE";
              if (cat.id === "MISSED")
                return (
                  t.category === "MISSED" ||
                  (t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status === "PENDING")
                );
              if (cat.id !== "ALL_CAT")
                return (
                  t.category === cat.id &&
                  t.status !== "COMPLETED" &&
                  t.status !== "DISMISSED"
                );
              return t.status !== "COMPLETED" && t.status !== "DISMISSED";
            }).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3.5 py-2.5 rounded-xl border-2 text-[11px] uppercase font-bold tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2",
                  isSelected
                    ? "bg-sky-900 border-slate-900 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 border-slate-900 text-slate-800 dark:text-slate-200",
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-black px-1.5 py-0.2 rounded-full border border-slate-900",
                      isSelected
                        ? "bg-white text-sky-900"
                        : "bg-slate-100 text-slate-800",
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ACTIONABLE TASK ROADMAP ITEMS */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card className="border-2 border-slate-900 bg-white dark:bg-slate-900 p-12 text-center rounded-3xl shadow-sm space-y-3">
              <FaCheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                No Tasks Pending in Selected Pathway Filter
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your healthcare roadmap is fully up to date! Click "Sync &
                Synthesize Timeline" whenever new medical reports, bills, or
                prescriptions are added.
              </p>
            </Card>
          ) : (
            <motion.div layout className="space-y-4">
              <AnimatePresence>
                {filteredTasks.map((task) => {
                  const isExpanded = expandedTaskId === task._id;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={task._id}
                      className={cn(
                        "rounded-3xl border-2 border-slate-900 bg-white dark:bg-slate-900 overflow-hidden shadow-md transition-all",
                        task.priority === "CRITICAL" &&
                          "ring-2 ring-rose-500/30",
                      )}
                    >
                      <div className="p-6 space-y-4">
                        {/* Top Bar: Badges, Phase & Confidence */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {/* Priority Badge */}
                            <span
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-slate-900 shadow-2xs flex items-center gap-1.5",
                                task.priority === "CRITICAL"
                                  ? "bg-rose-50 text-rose-700"
                                  : task.priority === "HIGH"
                                    ? "bg-amber-50 text-amber-800"
                                    : task.priority === "MEDIUM"
                                      ? "bg-sky-50 text-sky-800"
                                      : "bg-slate-100 text-slate-700",
                              )}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                              {task.priority} Priority
                            </span>

                            {/* Phase Tag */}
                            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                              Phase: {task.phase}
                            </span>

                            {/* Trigger Source Pill */}
                            <Link
                              href={task.triggerSourceUrl || "/analyze-report"}
                            >
                              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold tracking-wider uppercase px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 flex items-center gap-1 transition-colors">
                                <FaFileMedical className="w-3 h-3 text-sky-700" />
                                {task.triggerSource}
                              </span>
                            </Link>
                          </div>

                          {/* AI Confidence & Guideline Citation */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                              ⚡ {task.confidenceScore}% AI Confidence
                            </span>
                            {task.guidelineCitation && (
                              <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-300">
                                📖 {task.guidelineCitation}
                              </span>
                            )}
                            {task.doctorFeedback?.status === "APPROVED" && (
                              <span className="text-[9.5px] bg-sky-50 text-sky-800 font-extrabold px-3 py-1 rounded-full border border-sky-300 flex items-center gap-1">
                                <FaUserDoctor className="w-3 h-3" /> Doctor
                                Approved
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1 text-left">
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Collapsible Clinical Reasoning */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                          <button
                            onClick={() =>
                              setExpandedTaskId(isExpanded ? null : task._id)
                            }
                            className="text-[10px] text-sky-900 dark:text-sky-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 hover:underline cursor-pointer"
                          >
                            <span>Clinical Reasoning & Guideline Evidence</span>
                            {isExpanded ? (
                              <FaChevronUp className="w-3 h-3" />
                            ) : (
                              <FaChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-semibold text-left space-y-2"
                              >
                                <p>
                                  <strong>Medical Rationale:</strong>{" "}
                                  {task.clinicalReasoning}
                                </p>
                                {task.guidelineCitation && (
                                  <p className="text-[10px] text-slate-500 font-bold">
                                    <strong>Evidence Reference:</strong>{" "}
                                    {task.guidelineCitation}
                                  </p>
                                )}
                                {task.doctorFeedback?.notes && (
                                  <p className="text-sky-800 dark:text-sky-300 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                                    <strong>
                                      Doctor Note (
                                      {task.doctorFeedback.updatedByDoctor}):
                                    </strong>{" "}
                                    {task.doctorFeedback.notes}
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Actions Row */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                          {/* Primary Action Button */}
                          <Link href={task.actionLink || "/"}>
                            <Button className="h-9 px-4 bg-sky-900 hover:bg-sky-850 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-xs border border-slate-900 flex items-center gap-2 cursor-pointer">
                              <MdOutlineMedicalServices className="w-3.5 h-3.5" />
                              Execute Action
                              <FaArrowRight className="w-2.5 h-2.5" />
                            </Button>
                          </Link>

                          {/* Task State Actions */}
                          <div className="flex items-center gap-2">
                            {task.status !== "COMPLETED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleTaskAction(task._id, "COMPLETE")
                                }
                                className="h-9 text-[10px] font-extrabold uppercase tracking-wider border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-1 cursor-pointer"
                              >
                                <FaCheck className="w-3 h-3" /> Done
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPostponeModalTask(task)}
                              className="h-9 text-[10px] font-extrabold uppercase tracking-wider border-2 border-slate-900 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <FaCalendarPlus className="w-3 h-3" /> Postpone
                            </Button>

                            {/* Doctor Feedback Action Button */}
                            {isDoctor && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setDoctorModalTask(task);
                                  setDoctorNotes(
                                    task.doctorFeedback?.notes || "",
                                  );
                                }}
                                className="h-9 text-[10px] font-extrabold uppercase tracking-wider bg-purple-900 hover:bg-purple-950 text-white rounded-xl shadow-xs border border-slate-900 flex items-center gap-1 cursor-pointer"
                              >
                                <FaUserDoctor className="w-3 h-3" /> Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* POSTPONE TASK MODAL */}
      <AnimatePresence>
        {postponeModalTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center relative"
            >
              <button
                onClick={() => setPostponeModalTask(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-2 rounded-full cursor-pointer"
              >
                <MdClose className="w-6 h-6" />
              </button>

              <div className="w-14 h-14 bg-amber-50 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-amber-800 mx-auto shadow-md">
                <FaCalendarPlus className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
                  Postpone Care Action
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {postponeModalTask.title}
                </p>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Postpone Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPostponeDays(d)}
                      className={cn(
                        "py-3 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm",
                        postponeDays === d
                          ? "bg-sky-900 border-slate-900 text-white"
                          : "bg-white border-slate-900 text-slate-800 hover:bg-slate-50",
                      )}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={submitPostpone}
                className="w-full py-3.5 bg-sky-900 hover:bg-sky-850 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md border-2 border-slate-900 cursor-pointer"
              >
                Confirm Postpone
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DOCTOR SUPERVISION REVIEW MODAL */}
      <AnimatePresence>
        {doctorModalTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border-2 border-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center relative"
            >
              <button
                onClick={() => setDoctorModalTask(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-2 rounded-full cursor-pointer"
              >
                <MdClose className="w-6 h-6" />
              </button>

              <div className="w-14 h-14 bg-purple-50 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-purple-900 mx-auto shadow-md">
                <FaUserDoctor className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
                  Doctor Clinical Review
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {doctorModalTask.title}
                </p>
              </div>

              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Select Action
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "DOCTOR_APPROVE", label: "Approve" },
                    { id: "DOCTOR_MODIFY", label: "Modify" },
                    { id: "DOCTOR_DISMISS", label: "Dismiss" },
                  ].map((act) => (
                    <button
                      key={act.id}
                      onClick={() => setDoctorActionType(act.id as any)}
                      className={cn(
                        "py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm",
                        doctorActionType === act.id
                          ? "bg-purple-900 border-slate-900 text-white"
                          : "bg-white border-slate-900 text-slate-800 hover:bg-slate-50",
                      )}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>

                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block pt-2">
                  Clinical Notes / Instructions
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter custom clinical notes or modifications for patient..."
                  className="w-full h-24 p-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-900"
                />
              </div>

              <Button
                onClick={submitDoctorFeedback}
                className="w-full py-3.5 bg-purple-900 hover:bg-purple-950 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md border-2 border-slate-900 cursor-pointer"
              >
                Submit Clinical Review
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
