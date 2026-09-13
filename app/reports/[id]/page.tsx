"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Activity,
  Zap,
  ChevronRight,
  Activity as ActivityIcon,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BackgroundPattern from "@/components/BackgroundPattern";
import HealthGauge from "@/components/HealthGauge";
import TetrisLoading from "@/components/ui/tetris-loader";

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        if (!res.ok) throw new Error("Report not found");
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error(err);
        router.push("/profile");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchReport();
  }, [params.id]);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 relative">
        <BackgroundPattern />
        <div className="relative z-10">
          <TetrisLoading
            size="lg"
            speed="normal"
            showLoadingText={true}
            loadingText="Loading report details..."
          />
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/profile")}
            className="group gap-2 hover:bg-white border-2 border-transparent hover:border-slate-900 transition-all rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Profile
          </Button>
          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-900 uppercase">
              Lab Report <span className="text-sky-900">Details</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Viewed on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* RESULTS HEADER */}
          <div className="flex flex-col md:flex-row gap-6 bg-white/80 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-900 shadow-xl relative overflow-hidden">
            <div className="flex-1 space-y-6 relative z-10">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Saved Health Record
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl text-slate-900 uppercase leading-tight tracking-widest">
                  Report <span className="text-sky-900">Summary</span>
                </h2>
                <p className="text-slate-600 leading-relaxed tracking-wider">
                  {report.overallSummary}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Patient
                  </p>
                  <p className="text-sm text-slate-900 tracking-wider">
                    {report.patientDetails.name}
                  </p>
                </div>
                <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    Report Date
                  </p>
                  <p className="text-sm text-slate-900 tracking-wider">
                    {report.patientDetails.date}
                  </p>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 rounded-2xl border-2 border-slate-900">
              <HealthGauge score={report.healthScore} />
            </div>
          </div>

          {/* TEST MARKERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.markers.map((marker: any, i: number) => (
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
              <h3 className="text-xl tracking-widest uppercase">
                Health Recommendations
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.recommendations.map((rec: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 group hover:bg-white/20 transition-all"
                >
                  <p className="text-sm tracking-widest leading-relaxed">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
