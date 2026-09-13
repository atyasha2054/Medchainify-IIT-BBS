"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertCircle,
  Brain,
  ShieldCheck,
  Star,
  Mail,
  Clock,
  ChevronRight,
  TrendingUp,
  Sparkles,
  User,
  Shield,
  Loader2,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import BackgroundPattern from "@/components/BackgroundPattern";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TetrisLoading from "@/components/ui/tetris-loader";

interface MatchResult {
  sl_no: number;
  name: string;
  age: number;
  short_description: string;
  bio: string;
  specialization: string;
  experience: number;
  gender: string;
  rating: number;
  email: string;
  confidenceScore: string;
  reason: string;
  caseAlignment: {
    alignmentPercentage: number;
    alignmentDescription: string;
    matchedSpecializations: string[];
    recommendationCause: string;
  };
  matchType: "AI Selected" | "Random Selection";
  message: string;
}

const processingSteps = [
  "Initializing Diagnostic Engine...",
  "Decomposing Case Description...",
  "Querying Medical Knowledge Graph...",
  "Analyzing Specialist Alignment...",
  "Calculating Confidence Metrics...",
  "Finalizing Recommendation...",
];

export default function FindDoctorPage() {
  const { data, status } = useSession();
  const router = useRouter();
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStep((prev) =>
          prev < processingSteps.length - 1 ? prev + 1 : prev,
        );
      }, 1200);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFindDoctor = async () => {
    if (symptoms.trim().length < 30) {
      toast.warning(
        "Please provide a more detailed description (min. 30 characters).",
      );
      return;
    }

    setLoading(true);
    setResult(null);

    const findDoctorPromise = fetch("/api/find-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: symptoms }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResult(data);
      return data;
    });

    toast.promise(findDoctorPromise, {
      pending: "Analyzing medical profile...",
      success: "Specialist match found!",
      error: {
        render({ data }: { data: any }) {
          return data.message || "Failed to find specialist";
        },
      },
    });

    try {
      await findDoctorPromise;
    } catch (error) {
      // Error handled by toast.promise
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <TetrisLoading
          size="lg"
          speed="normal"
          showLoadingText={true}
          loadingText="Initializing specialist locator..."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[80%] space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
            Specialist <span className="text-sky-900">Locator</span>
          </h1>
          <p className="text-slate-500 capitalize tracking-wider max-w-md mx-auto">
            Describe your symptoms for an AI-powered doctor match
          </p>
        </div>

        {!result ? (
          <Card className="border-2 border-slate-900 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px]  text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-sky-900" /> Case
                    Description
                  </label>
                  <span
                    className={cn(
                      "text-[9px] font-mono px-2 py-0.5 rounded border-2 border-slate-900 uppercase tracking-widest",
                      symptoms.length >= 30
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-slate-500",
                    )}
                  >
                    {symptoms.length} / 30 Min
                  </span>
                </div>

                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Detail your symptoms, duration, and any relevant medical history..."
                  className="w-full h-48 bg-slate-50/50 border-2 border-slate-200 rounded-xl p-6 text-slate-800 focus:outline-none focus:border-slate-900 transition-all resize-none text-base tracking-wide"
                />

                <Button
                  onClick={handleFindDoctor}
                  disabled={loading || symptoms.trim().length < 30}
                  className="w-full h-14 bg-sky-800 text-white rounded-xl uppercase tracking-widest border-2 border-slate-900 shadow-lg hover:shadow-xl active:translate-y-px transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-3" />
                      {processingSteps[currentStep]}
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-3" />
                      Find Best Match
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* RESULTS HEADER */}
            <div className="flex flex-col md:flex-row gap-10 bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-2xl relative overflow-hidden">
              <div className="flex-1 space-y-8 relative z-10">
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-[0.3em]">
                    AI MATCHING COMPLETE
                  </span>
                </div>

                <div className="space-y-6">
                  <h2 className="text-5xl text-slate-900 uppercase tracking-widest">
                    Expert <span className="text-sky-900">Recommendation</span>
                  </h2>
                  <p className="text-slate-600 leading-relaxed tracking-wider text-lg italic bg-white/40 p-6 rounded-2xl border border-slate-900/5 shadow-inner">
                    "{result.message}"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="bg-white/80 p-4 rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-105 transition-all">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                      Confidence
                    </p>
                    <p className="text-2xl  text-slate-900">
                      {result.confidenceScore}
                    </p>
                  </div>

                  <div className="bg-white/80 p-4 rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-105 transition-all">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                      Status
                    </p>
                    <p className="text-xs  text-sky-900 uppercase tracking-widest">
                      {result.matchType}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DOCTOR PROFILE SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-8 space-y-8">
                <Card className="border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden bg-white/95">
                  <CardContent className="p-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-[10px] uppercase tracking-[0.4em] text-sky-900 ">
                          Medical Professional
                        </h3>
                        <h2 className="text-4xl text-slate-900 uppercase leading-none">
                          {result.name}
                        </h2>
                        <p className="text-slate-500 text-lg uppercase tracking-widest">
                          {result.specialization}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-amber-700 tracking-widest">
                          {result.rating}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                        <Clock className="h-4 w-4 text-slate-900" />
                        <span className="text-[10px] uppercase tracking-widest ">
                          {result.experience} Years Experience
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-[10px] uppercase tracking-widest text-slate-400 ">
                        Case Analysis
                      </h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 leading-relaxed tracking-wider bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result.reason}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden bg-white/95">
                  <CardContent className="p-10 space-y-6">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 ">
                      Clinical Biography
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-500 text-sm leading-relaxed tracking-wide">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result.bio}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-4 space-y-8">
                <Card className="border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden bg-sky-800 text-white">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-2 text-sky-200">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-[10px] uppercase tracking-widest ">
                        Diagnostic Alignment
                      </span>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none text-sky-50 leading-relaxed text-sm tracking-wide">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result.caseAlignment.alignmentDescription}
                      </ReactMarkdown>
                    </div>
                    <div className="space-y-3 pt-4">
                      <div className="flex flex-wrap gap-2">
                        {result.caseAlignment.matchedSpecializations.map(
                          (spec, i) => (
                            <span
                              key={i}
                              className="bg-white text-blue-900 font-bold px-3 py-1 rounded-lg text-[9px] uppercase tracking-widest border border-sky-700/50"
                            >
                              {spec}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setSymptoms("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full h-16 border-2 border-slate-900 rounded-[2rem] uppercase tracking-[0.2em]  hover:bg-sky-700 hover:text-white transition-all shadow-lg"
                >
                  New Analysis
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
