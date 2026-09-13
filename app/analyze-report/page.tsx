"use client";

import React, { useState, useCallback } from "react";
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
  Zap,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity as ActivityIcon,
} from "lucide-react";
import Webcam from "react-webcam";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "react-toastify";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import BackgroundPattern from "@/components/BackgroundPattern";
import HealthGauge from "@/components/HealthGauge";
import TetrisLoading from "@/components/ui/tetris-loader";

export default function AnalyzeReportPage() {
  const { data, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);

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
        const file = new File([blob], "captured-report.jpg", {
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

    const run = async () => {
      const res = await fetch("/api/analyze-lab-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: preview,
          mimeType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      setResult(data);
      return data;
    };

    toast
      .promise(run(), {
        pending: "AI Diagnostic Engine analyzing parameters...",
        success: "Report analysis complete!",
        error: {
          render({ data }: any) {
            return data?.message || "Failed to analyze report";
          },
        },
      })
      .finally(() => setLoading(false));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "high":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-100";
      case "critical":
        return "text-red-600 bg-red-50 border-red-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isSaved || saving) return;
    setSaving(true);

    const saveAction = async () => {
      const res = await fetch("/api/save-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save report");
      }
      setIsSaved(true);
      return res.json();
    };

    toast
      .promise(saveAction(), {
        pending: "Encrypting & saving lab report to your profile...",
        success: "Lab report saved to your profile vault!",
        error: {
          render({ data }: any) {
            return data?.message || "Failed to save lab report";
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
          loadingText="Accessing diagnostic vault..."
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
            Lab Report <span className="text-sky-900">Analyzer</span>
          </h1>
          <p className="text-slate-500 capitalize tracking-wider max-w-md mx-auto">
            Upload your reports for an instant medical breakdown
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
                    Position your report within the frame
                  </p>
                </div>
              ) : !preview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-sky-900/50 hover:bg-sky-50/30 transition-all cursor-pointer group"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <div className="h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-sky-900" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg text-slate-900 uppercase tracking-widest">
                      Click or drag & drop report
                    </p>
                    <p className="text-sm text-slate-500 tracking-wider">
                      Supports JPG, PNG (Max 5MB)
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative aspect-4/3 w-full max-w-md mx-auto rounded-xl overflow-hidden border-2 border-slate-900 shadow-lg bg-slate-100 flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Report preview"
                      className="h-full w-full object-contain p-2"
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
                      "AI Diagnostic Engine analyzing parameters..."
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" /> Run AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* RESULTS HEADER */}
            <div className="flex flex-col md:flex-row gap-8 bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />

              <div className="flex-1 space-y-8 relative z-10">
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-[10px] uppercase tracking-[0.3em]">
                    Clinical Analysis Complete
                  </span>
                </div>

                <div className="space-y-6">
                  <h2 className="text-5xl text-slate-900 uppercase leading-tight tracking-widest">
                    Diagnostic <span className="text-sky-900">Summary</span>
                  </h2>
                  <p className="text-slate-600 leading-relaxed tracking-wider text-lg italic bg-white/40 p-6 rounded-2xl border border-slate-900/5 shadow-inner">
                    "{result.overallSummary}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/80 rounded-2xl border-2 border-slate-900 shadow-sm">
                    <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center border border-sky-100">
                      <User className="h-4 w-4 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                        Patient Name
                      </p>
                      <p className="text-sm text-slate-900 tracking-widest">
                        {result.patientDetails.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-3 bg-white/80 rounded-2xl border-2 border-slate-900 shadow-sm">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <Calendar className="h-4 w-4 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                        Analysis Date
                      </p>
                      <p className="text-sm text-slate-900 tracking-widest">
                        {result.patientDetails.date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center justify-center gap-6 bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl relative z-10">
                <div className="relative">
                  <HealthGauge score={result.healthScore} />
                  <div className="absolute -top-4 -right-4 bg-slate-900 text-white text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                    Live Index
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
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        RECORD SAVED
                      </span>
                    ) : saving ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        SAVING TO PROFILE...
                      </span>
                    ) : (
                      "Save to Profile"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      reset();
                      setIsSaved(false);
                    }}
                    className="w-full h-12 uppercase tracking-[0.2em] text-[11px] rounded-xl border-2 border-slate-900 hover:bg-slate-50 transition-all"
                  >
                    <RefreshCw className="h-4 w-4" /> Reset Analysis
                  </Button>
                </div>
              </div>
            </div>

            {/* TEST MARKERS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.markers.map((marker: any, i: number) => (
                <Card
                  key={i}
                  className="border-2 border-slate-900 shadow-md rounded-2xl overflow-hidden hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all group"
                >
                  <div
                    className={`h-1.5 w-full ${getStatusColor(marker.status).split(" ")[1]}`}
                  />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          Test Parameter
                        </p>
                        <h3 className="text-md text-slate-900 truncate leading-tight uppercase tracking-wider">
                          {marker.name}
                        </h3>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-md border text-sm uppercase tracking-widest ${getStatusColor(marker.status)}`}
                      >
                        {marker.status}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-2xl text-slate-900 tracking-tighter">
                        {marker.value}
                      </span>
                      <span className="text-sm text-slate-400 uppercase tracking-widest">
                        {marker.unit}
                      </span>
                      <span className="ml-auto text-sm text-slate-600 uppercase tracking-wider">
                        Ref: {marker.referenceRange}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Zap className="h-3.5 w-3.5 text-sky-900 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-600 leading-normal tracking-wide">
                          {marker.interpretation}
                        </p>
                      </div>
                      <div className="flex items-start gap-2 pt-2 border-t border-slate-50">
                        <ActivityIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-700 leading-normal tracking-wide italic">
                          {marker.advice}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* RECOMMENDATIONS */}
            <div className="bg-sky-900 text-white p-8 rounded-3xl border-2 border-slate-900 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ActivityIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-widest">
                  Health Recommendations
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.recommendations.map((rec: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 group hover:bg-white/20 transition-all"
                  >
                    <p className="text-sm tracking-wider leading-relaxed">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
