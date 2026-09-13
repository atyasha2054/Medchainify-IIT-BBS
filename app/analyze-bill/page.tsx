"use client";

import React, { useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  RefreshCw,
  Activity,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Scale,
  IndianRupee,
  Building2,
  Receipt,
  Gavel,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Info,
} from "lucide-react";
import Webcam from "react-webcam";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import BackgroundPattern from "@/components/BackgroundPattern";
import HealthGauge from "@/components/HealthGauge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import TetrisLoading from "@/components/ui/tetris-loader";

export default function AuditBillPage() {
  const { data, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
  };

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    } else {
      toast.error("Please upload an image file");
    }
  }, []);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreview(imageSrc);
      const fetchImage = async () => {
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], "captured-bill.jpg", {
          type: "image/jpeg",
        });
        setFile(file);
        setShowCamera(false);
      };
      fetchImage();
    }
  }, [webcamRef]);

  const handleUpload = async () => {
    if (!file || !preview) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const run = async () => {
      const res = await fetch("/api/analyze-bill", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Forensic analysis failed");

      const data = await res.json();
      setResult(data);
      return data;
    };

    toast
      .promise(run(), {
        pending: "Auditing medical codes and tax levies...",
        success: "Forensic Audit Complete!",
        error: {
          render({ data }: any) {
            return data?.message || "Failed to analyze bill";
          },
        },
      })
      .finally(() => setLoading(false));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setIsSaved(false);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isSaved || saving) return;
    setSaving(true);

    const saveAction = async () => {
      const res = await fetch("/api/save-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save audit");
      }
      setIsSaved(true);
      return res.json();
    };

    toast
      .promise(saveAction(), {
        pending: "Encrypting & saving forensic audit to your profile...",
        success: "Forensic audit saved to your profile vault!",
        error: {
          render({ data }: any) {
            return data?.message || "Failed to save forensic audit";
          },
        },
      })
      .finally(() => setSaving(false));
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <TetrisLoading
          size="lg"
          speed="normal"
          showLoadingText={true}
          loadingText="Accessing financial vault..."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[80%] space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl text-slate-900 tracking-widest uppercase font-black">
            Bill <span className="text-sky-900">Forensics</span>
          </h1>
          <p className="text-slate-500 capitalize tracking-wider max-w-md mx-auto">
            Audit your medical bills for shady charges and legal discrepancies
          </p>
        </div>

        {!result && (
          <div className="flex items-center justify-center gap-3 bg-slate-100 p-1.5 border-2 border-slate-900 rounded-2xl w-fit mx-auto shadow-sm">
            <Button
              variant={!showCamera ? "default" : "ghost"}
              onClick={() => {
                setShowCamera(false);
                reset();
              }}
              className="px-6 uppercase tracking-widest"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            <Button
              variant={showCamera ? "default" : "ghost"}
              onClick={() => {
                setShowCamera(true);
                reset();
              }}
              className="px-6 uppercase tracking-widest"
            >
              <Camera className="h-4 w-4" />
              Capture
            </Button>
          </div>
        )}

        {!result ? (
          <Card className="border-2 border-slate-900 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              {showCamera && !preview ? (
                <div className="space-y-6">
                  <div className="relative aspect-4/3 w-full max-w-md mx-auto rounded-xl overflow-hidden border-2 border-slate-900 shadow-lg bg-black">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-white/20 pointer-events-none rounded-xl" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                      <button
                        onClick={capture}
                        className="h-16 w-16 rounded-full bg-white border-4 border-slate-900 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group"
                      >
                        <div className="h-10 w-10 rounded-full bg-slate-900 group-hover:bg-sky-900 transition-colors" />
                      </button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400 uppercase tracking-widest">
                    Position your hospital bill within the frame
                  </p>
                </div>
              ) : !preview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-sky-900/50 hover:bg-sky-50/30 transition-all cursor-pointer group"
                  onClick={() =>
                    document.getElementById("bill-upload")?.click()
                  }
                >
                  <div className="h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Receipt className="h-8 w-8 text-sky-900" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg text-slate-900 uppercase tracking-widest">
                      Click or drag & drop hospital bill
                    </p>
                    <p className="text-sm text-slate-500 tracking-wider">
                      Supports JPG, PNG (Max 5MB)
                    </p>
                  </div>
                  <input
                    id="bill-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative aspect-auto max-h-100 w-full mx-auto rounded-xl overflow-hidden border-2 border-slate-900 shadow-lg bg-slate-100 flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Bill preview"
                      className="max-h-100 object-contain p-2"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reset();
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full border-2 border-slate-900 shadow-md hover:bg-red-50 text-red-500 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full h-14 bg-sky-900 text-white rounded-xl uppercase tracking-widest border-2 border-slate-900 shadow-lg hover:shadow-xl active:translate-y-px transition-all disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {loading ? (
                      "Auditing medical codes and tax levies..."
                    ) : (
                      <>
                        <ShieldAlert className="h-5 w-5 mr-2" /> Run Forensic
                        Audit
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* AUDIT HEADER */}
            <div className="flex flex-col md:flex-row gap-8 bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />

              <div className="flex-1 space-y-8 relative z-10">
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-[10px] uppercase tracking-[0.3em]">
                    Forensic Audit Complete
                  </span>
                </div>

                <div className="space-y-6">
                  <h2 className="text-5xl text-slate-900 uppercase leading-tight tracking-widest">
                    Billing <span className="text-sky-900">Transparency</span>
                  </h2>
                  <div className="bg-white/40 p-6 rounded-2xl border border-slate-900/5 shadow-inner">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                      Forensic Assessment
                    </p>
                    <p className="text-slate-600 leading-relaxed tracking-wider text-lg italic">
                      "{result.analysis.overallAssessment}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/80 rounded-2xl border-2 border-slate-900 shadow-sm">
                    <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center border border-sky-100">
                      <Building2 className="h-4 w-4 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                        Healthcare Provider
                      </p>
                      <p className="text-sm text-slate-900 tracking-widest">
                        {result.hospitalDetails.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/80 rounded-2xl border-2 border-slate-900 shadow-sm">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <User className="h-4 w-4 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                        Patient Details
                      </p>
                      <p className="text-sm text-slate-900 tracking-widest">
                        {result.patientDetails.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center gap-6 bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl relative z-10">
                <div className="relative">
                  <HealthGauge score={result.analysis.transparencyScore} />
                  <div className="absolute -top-4 -right-4 bg-slate-900 text-white text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                    Transparency
                  </div>
                </div>
                <div className="flex flex-col w-full gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaved || saving}
                    className={`w-full h-12 border-slate-900 border-2 uppercase tracking-[0.2em] text-[11px] rounded-xl transition-all ${
                      isSaved
                        ? "bg-slate-100 text-slate-400 cursor-default"
                        : saving
                          ? "bg-emerald-700 text-white cursor-wait opacity-80"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl active:translate-y-px"
                    }`}
                  >
                    {isSaved ? (
                      "AUDIT SAVED"
                    ) : saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        SAVING AUDIT...
                      </span>
                    ) : (
                      "Save Forensic Report"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      reset();
                    }}
                    className="w-full h-12 uppercase tracking-[0.2em] text-[11px] rounded-xl border-2 border-slate-900 hover:bg-slate-50 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" /> Reset Audit
                  </Button>
                </div>
              </div>
            </div>

            {/* FORENSIC TABS */}
            <Tabs defaultValue="costs" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1.5 border-2 border-slate-900 rounded-[1.5rem] h-16">
                <TabsTrigger
                  value="costs"
                  className="rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest data-[state=active]:bg-sky-900 data-[state=active]:text-white"
                >
                  <Receipt className="h-4 w-4" /> Itemized Costs
                </TabsTrigger>
                <TabsTrigger
                  value="legal"
                  className="rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest data-[state=active]:bg-sky-900 data-[state=active]:text-white"
                >
                  <Scale className="h-4 w-4" /> Legal Remedies
                </TabsTrigger>
                <TabsTrigger
                  value="comparison"
                  className="rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-widest data-[state=active]:bg-sky-900 data-[state=active]:text-white"
                >
                  <TrendingUp className="h-4 w-4" /> Cost Benchmarks
                </TabsTrigger>
              </TabsList>

              {/* ITEMIZED COSTS */}
              <TabsContent
                value="costs"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="grid grid-cols-1 gap-4">
                  {result.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`relative bg-white/60 backdrop-blur-md border-2 rounded-2xl p-6 transition-all hover:shadow-md ${
                        item.severity === "High"
                          ? "border-red-500 bg-red-50/10"
                          : item.severity === "Medium"
                            ? "border-amber-500 bg-amber-50/10"
                            : "border-slate-900"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl text-slate-900 uppercase tracking-widest">
                              {item.description}
                            </h4>
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-[8px] uppercase tracking-[0.2em] border-2",
                                item.severity === "High"
                                  ? "bg-red-600 text-white border-red-700 shadow-sm"
                                  : item.severity === "Medium"
                                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                                    : "bg-emerald-500 text-white border-emerald-600 shadow-sm",
                              )}
                            >
                              {item.severity} Risk
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 tracking-wider font-medium italic">
                            "{item.forensicAnalysis}"
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            Amount
                          </p>
                          <p className="text-xl text-sky-900 tracking-wider">
                            ₹{item.total.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {item.isShady && (
                        <div className="mt-4 p-4 bg-white/40 rounded-xl border-2 border-slate-900/5 shadow-inner">
                          <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert
                              className={cn(
                                "h-3 w-3",
                                item.severity === "High"
                                  ? "text-red-600"
                                  : "text-amber-600",
                              )}
                            />
                            <p
                              className={cn(
                                "text-[9px] uppercase tracking-widest font-bold",
                                item.severity === "High"
                                  ? "text-red-600"
                                  : "text-amber-600",
                              )}
                            >
                              Shady Indicator
                            </p>
                          </div>
                          <p className="text-xs text-slate-700 tracking-wider leading-relaxed">
                            {item.shadyReason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* FINANCIAL SUMMARY */}
                <Card className="border-2 border-slate-900 bg-slate-900 text-white rounded-3xl overflow-hidden mt-8">
                  <CardContent className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      <div className="space-y-4">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          Net Financial Impact
                        </p>
                        <h3 className="text-5xl tracking-tighter">
                          ₹{result.financials.netAmount.toLocaleString()}
                        </h3>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs tracking-widest">
                          <CheckCircle2 className="h-4 w-4" /> ALL TAXES AUDITED
                        </div>
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-8">
                        <div className="space-y-1 border-l-2 border-slate-800 pl-6">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            Subtotal
                          </p>
                          <p className="text-xl tracking-wider">
                            ₹{result.financials.subtotal.toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1 border-l-2 border-slate-800 pl-6">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            GST & Levies
                          </p>
                          <p className="text-xl tracking-wider text-red-400">
                            +₹
                            {result.financials.taxes
                              .reduce((acc: any, t: any) => acc + t.amount, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1 border-l-2 border-slate-800 pl-6">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            Discounts Applied
                          </p>
                          <p className="text-xl tracking-wider text-emerald-400">
                            -₹{result.financials.discount.toLocaleString()}
                          </p>
                        </div>
                        <div className="space-y-1 border-l-2 border-slate-800 pl-6">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            Shady Charges Identified
                          </p>
                          <p className="text-xl tracking-wider text-amber-400">
                            {result.analysis.shadyChargesCount} Flagged
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* LEGAL TAB */}
              <TabsContent
                value="legal"
                className="space-y-6 focus-visible:ring-0"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                        <Scale className="h-6 w-6 text-amber-700" />
                      </div>
                      <h3 className="text-xl text-slate-900 uppercase tracking-widest">
                        Legislative Remedies
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {result.legalAction.legislature.map(
                        (item: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 group">
                            <BookOpen className="h-5 w-5 text-sky-900 shrink-0 mt-1 transition-transform group-hover:scale-110" />
                            <span className="text-sm text-slate-700 tracking-wider leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <div className="h-12 w-12 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100">
                        <Gavel className="h-6 w-6 text-sky-900" />
                      </div>
                      <h3 className="text-xl text-slate-900 uppercase tracking-widest">
                        Next Legal Steps
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {result.legalAction.steps.map(
                        (step: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100"
                          >
                            <ArrowRight className="h-4 w-4 text-sky-900 shrink-0 mt-1" />
                            <span className="text-sm text-slate-700 tracking-wider leading-relaxed">
                              {step}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                      <ShieldCheck className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-lg uppercase tracking-widest mb-1">
                        Policy Reference Hub
                      </h4>
                      <p className="text-slate-400 text-sm tracking-wider">
                        Based on Indian Healthcare Policies & Budgetary
                        provisions
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {result.legalAction.policyReferences.map(
                      (ref: string, i: number) => (
                        <div
                          key={i}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest"
                        >
                          {ref}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* COMPARISON TAB */}
              <TabsContent value="comparison" className="focus-visible:ring-0">
                <div className="bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-3xl p-10 space-y-8">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <div className="h-14 w-14 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100">
                      <TrendingUp className="h-8 w-8 text-sky-900" />
                    </div>
                    <div>
                      <h3 className="text-2xl text-slate-900 uppercase tracking-widest">
                        Cost Benchmarking
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                        Comparison with Indian Market Rates & CGHS Benchmarks
                      </p>
                    </div>
                  </div>
                  <p className="text-lg text-slate-700 tracking-widest leading-loose italic bg-sky-50/30 p-8 rounded-2xl border-2 border-sky-900/5">
                    "{result.analysis.costComparisonNote}"
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
