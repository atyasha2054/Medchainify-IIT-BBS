"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  FileText,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Activity,
  Calendar,
  ShieldAlert,
  Scale,
  Building2,
  Receipt,
  Gavel,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Info,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import BackgroundPattern from "@/components/BackgroundPattern";
import HealthGauge from "@/components/HealthGauge";
import { toast } from "react-toastify";
import TetrisLoading from "@/components/ui/tetris-loader";
import { cn } from "@/lib/utils";

export default function BillDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/bills/${params.id}`);
        if (!res.ok) throw new Error("Forensic record not found");
        const data = await res.json();
        setBill(data);
      } catch (err: any) {
        toast.error(err.message);
        router.push("/profile");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBill();
    }
  }, [params.id, router]);

  if (loading || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 relative">
        <BackgroundPattern />
        <div className="relative z-10">
          <TetrisLoading
            size="lg"
            speed="normal"
            showLoadingText={true}
            loadingText="Loading bill audit details..."
          />
        </div>
      </div>
    );
  }

  if (!bill) return null;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[80%] space-y-8">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 uppercase tracking-widest text-xs transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Audit ID
            </p>
            <p className="text-[10px] text-slate-900 tracking-wider font-mono uppercase">
              {bill._id}
            </p>
          </div>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* AUDIT HEADER */}
          <div className="flex flex-col md:flex-row gap-8 bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />

            <div className="flex-1 space-y-8 relative z-10">
              <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-[10px] uppercase tracking-[0.3em]">
                  Historical Forensic Audit
                </span>
              </div>

              <div className="space-y-6">
                <h2 className="text-5xl text-slate-900 uppercase leading-tight tracking-wide">
                  Bill <span className="text-sky-900">Audit</span>
                </h2>
                <div className="bg-white/40 p-6 rounded-2xl border border-slate-900/5 shadow-inner">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                    Forensic Assessment
                  </p>
                  <p className="text-slate-600 leading-relaxed tracking-wider text-lg italic">
                    "{bill.analysis.overallAssessment}"
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
                      {bill.hospitalDetails.name}
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
                      {bill.patientDetails.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center gap-6 bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border-2 border-slate-900 shadow-xl relative z-10">
              <div className="relative">
                <HealthGauge score={bill.analysis.transparencyScore} />
                <div className="absolute -top-4 -right-4 bg-slate-900 text-white text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                  Transparency
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                  Generated On
                </p>
                <p className="text-xs text-slate-900 uppercase tracking-widest">
                  {new Date(bill.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

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
                {bill.items.map((item: any, idx: number) => (
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

              <Card className="border-2 border-slate-900 bg-slate-900 text-white rounded-3xl overflow-hidden mt-8">
                <CardContent className="p-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-4">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Net Financial Impact
                      </p>
                      <h3 className="text-5xl tracking-tighter">
                        ₹{bill.financials.netAmount.toLocaleString()}
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
                          ₹{bill.financials.subtotal.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1 border-l-2 border-slate-800 pl-6">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          GST & Levies
                        </p>
                        <p className="text-xl tracking-wider text-red-400">
                          +₹
                          {bill.financials.taxes
                            .reduce((acc: any, t: any) => acc + t.amount, 0)
                            .toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1 border-l-2 border-slate-800 pl-6">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          Discounts Applied
                        </p>
                        <p className="text-xl tracking-wider text-emerald-400">
                          -₹{bill.financials.discount.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1 border-l-2 border-slate-800 pl-6">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          Shady Charges Identified
                        </p>
                        <p className="text-xl tracking-wider text-amber-400">
                          {bill.analysis.shadyChargesCount} Flagged
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
                    {bill.legalAction.legislature.map(
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
                    {bill.legalAction.steps.map((step: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100"
                      >
                        <ArrowRight className="h-4 w-4 text-sky-900 shrink-0 mt-1" />
                        <span className="text-sm text-slate-700 tracking-wider leading-relaxed">
                          {step}
                        </span>
                      </li>
                    ))}
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
                      Based on Indian Healthcare Policies & Budgetary provisions
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {bill.legalAction.policyReferences.map(
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
                  "{bill.analysis.costComparisonNote}"
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
