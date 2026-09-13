"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";
import BackgroundPattern from "@/components/BackgroundPattern";
import EasyCardView from "@/components/EasyCardView";
import TetrisLoading from "@/components/ui/tetris-loader";
import {
  ShieldCheck,
  RefreshCw,
  Share2,
  Loader2,
  ClipboardCopy,
  Activity,
  Heart,
} from "lucide-react";

export default function EasyCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Counts of patient items for info section
  const [counts, setCounts] = useState({
    reports: 0,
    prescriptions: 0,
    bills: 0,
    ayush: 0,
  });

  // Fetch count metadata and current easy-card status
  const fetchCardAndMetadata = async () => {
    try {
      // 1. Fetch easy card & profile
      const res = await fetch("/api/easy-card");
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);

        if (data.user?._id) {
          setShareUrl(
            `${window.location.origin}/easy-card/shared/${data.user._id}`,
          );
        }
      }

      // 2. Fetch reports, prescriptions, bills, ayush to display exact counts in scan step
      const [repRes, presRes, billsRes, ayushRes] = await Promise.all([
        fetch("/api/reports").catch(() => null),
        fetch("/api/prescriptions").catch(() => null),
        fetch("/api/bills").catch(() => null),
        fetch("/api/ayush-consult/history").catch(() => null),
      ]);

      const reportsData = repRes && repRes.ok ? await repRes.json() : [];
      const presData = presRes && presRes.ok ? await presRes.json() : [];
      const billsData = billsRes && billsRes.ok ? await billsRes.json() : [];
      const ayushData = ayushRes && ayushRes.ok ? await ayushRes.json() : [];

      setCounts({
        reports: Array.isArray(reportsData) ? reportsData.length : 0,
        prescriptions: Array.isArray(presData) ? presData.length : 0,
        bills: Array.isArray(billsData) ? billsData.length : 0,
        ayush: Array.isArray(ayushData) ? ayushData.length : 0,
      });
    } catch (err) {
      console.error("Failed to load easy card or metadata:", err);
      toast.error("Failed to sync clinical profile metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      fetchCardAndMetadata();
    }
  }, [status, router]);

  // Perform the card generation (calling API directly with a promise toast)
  const handleGenerateCard = async () => {
    if (generating) return;
    setGenerating(true);

    const generatePromise = async () => {
      const res = await fetch("/api/easy-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to scan records and generate card",
        );
      }

      const data = await res.json();
      setUserData(data.user);
      if (data.user?._id) {
        setShareUrl(
          `${window.location.origin}/easy-card/shared/${data.user._id}`,
        );
      }
      return data;
    };

    toast.promise(generatePromise(), {
      pending: "Scanning medical records & compiling health index...",
      success: {
        render() {
          setGenerating(false);
          return "Easy Card successfully generated!";
        },
      },
      error: {
        render({ data }: any) {
          setGenerating(false);
          return data?.message || "Failed to generate Easy Card";
        },
      },
    });
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Easy Card share link copied to clipboard!");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 relative">
        <BackgroundPattern />
        <div className="relative z-10">
          <TetrisLoading
            size="lg"
            speed="normal"
            showLoadingText={true}
            loadingText="Loading health identity profile..."
          />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const hasCard = userData?.easyCard && userData.easyCard.generatedAt;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center p-4">
      <BackgroundPattern />

      <div className="w-full max-w-[1000px] flex flex-col items-center gap-8 py-6">
        {/* Header block */}
        <div className="text-center space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-900 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Decentralized Medical Passport
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
            Easy Health Identity (Easy Card)
          </h1>
          <p className="text-sm text-slate-500">
            Your Easy Card consolidates profile metrics, chronic diagnoses,
            allergen lists, and clinical history into a single interactive smart
            card. Scan the QR code or share the URL to grant emergency access to
            healthcare providers.
          </p>
        </div>

        {hasCard ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-start">
            {/* Left Column: Interactive 3D Flip Card */}
            <div className="md:col-span-6 flex flex-col items-center gap-6">
              <div className="relative">
                {generating && (
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs rounded-3xl z-30 flex items-center justify-center border-2 border-slate-900 shadow-xl">
                    <div className="bg-white/95 text-slate-900 border-2 border-slate-900 px-4 py-2.5 rounded-full font-bold text-xs flex items-center gap-2.5 shadow-md">
                      <Loader2 className="h-4 w-4 animate-spin text-sky-900" />
                      Scanning Records...
                    </div>
                  </div>
                )}
                <EasyCardView user={userData} shareUrl={shareUrl} />
              </div>
            </div>

            {/* Right Column: Actions and detailed metrics view */}
            <div className="md:col-span-6 space-y-6">
              {/* Actions Panel */}
              <Card className="border-2 border-slate-900 shadow-md rounded-2xl bg-white/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Identity Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <button
                    onClick={handleCopyLink}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Share2 className="h-5 w-5" />
                    Copy Share Easy Card Link
                  </button>

                  <button
                    onClick={handleGenerateCard}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl px-5 py-3.5 font-bold bg-white text-slate-900 hover:bg-slate-50 border-2 border-slate-900 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                        Scanning Vault...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Scan History & Regenerate Card
                      </>
                    )}
                  </button>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-3">
                    <ClipboardCopy className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="text-left space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Shareable Card Link
                      </p>
                      <p className="text-xs text-slate-600 font-mono break-all line-clamp-1 select-all">
                        {shareUrl}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features list */}
              <Card className="border-2 border-slate-900 shadow-md rounded-2xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4 text-left">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                    Smart Identity Features
                  </h4>

                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0 text-sky-900">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        Calculated Health Index
                      </h5>
                      <p className="text-xs text-slate-500">
                        Gemini analyzes the severity of your registered
                        diseases, prescriptions, and lab test results to compile
                        a 1-100 overall score.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-900">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">
                        Emergency Access
                      </h5>
                      <p className="text-xs text-slate-500">
                        By sharing this card, first responders can immediately
                        fetch your blood type, chronic conditions, and active
                        allergens in seconds.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* EMPTY / INTRO STATE */
          <Card className="w-full max-w-[650px] border-2 border-slate-900 shadow-xl rounded-3xl bg-white/95 backdrop-blur-sm overflow-hidden p-8 text-center flex flex-col items-center gap-6">
            {/* Mock card placeholder */}
            <div className="w-full max-w-[340px] aspect-[1.586/1] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <ShieldCheck className="h-10 w-10 text-slate-300 animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">
                No Identity Card Generated Yet
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                Generate Your MedChainify Easy Card
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Our intelligence engine scans your complete patient record
                (profile traits, lab biomarkers, prescription details, and
                payment histories) to generate an all-in-one clinical passport.
              </p>
            </div>

            <button
              onClick={handleGenerateCard}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-extrabold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  Scanning Health Vault...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin-reverse" />
                  Scan & Generate Easy Card
                </>
              )}
            </button>

            <div className="border-t border-slate-100 w-full pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-500">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900">
                  {counts.reports}
                </span>
                <p className="text-[9px] uppercase tracking-widest font-bold">
                  Lab Reports
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900">
                  {counts.prescriptions}
                </span>
                <p className="text-[9px] uppercase tracking-widest font-bold">
                  Prescriptions
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900">
                  {counts.bills}
                </span>
                <p className="text-[9px] uppercase tracking-widest font-bold">
                  Billing Logs
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900">
                  {counts.ayush}
                </span>
                <p className="text-[9px] uppercase tracking-widest font-bold">
                  AYUSH Consults
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
