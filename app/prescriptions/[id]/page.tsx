"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  FileText,
  User,
  Stethoscope,
  Pill,
  TestTube,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingCart,
  Activity,
  Calendar,
  HeartPulse,
  Clock,
  Truck,
  Star,
  Loader2,
  ChevronLeft,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import BackgroundPattern from "@/components/BackgroundPattern";
import { toast } from "react-toastify";
import TetrisLoading from "@/components/ui/tetris-loader";

export default function PrescriptionDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await fetch(`/api/prescriptions/${params.id}`);
        if (!res.ok) throw new Error("Prescription not found");
        const data = await res.json();
        setPrescription(data);
      } catch (err: any) {
        toast.error(err.message);
        router.push("/profile");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPrescription();
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
            loadingText="Loading prescription details..."
          />
        </div>
      </div>
    );
  }

  if (!prescription) return null;

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
              Reference ID
            </p>
            <p className="text-[10px] text-slate-900 tracking-wider font-mono uppercase">
              {prescription._id}
            </p>
          </div>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Summary Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-8 rounded-3xl border-2 border-slate-900 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sky-900">
                <FileText className="h-5 w-5" />
                <span className="text-xs uppercase tracking-[0.2em]">
                  Diagnostic Record
                </span>
              </div>
              <h2 className="text-3xl text-slate-900 uppercase tracking-widest">
                Medical Prescription
              </h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Generated On
              </p>
              <div className="flex items-center gap-2 text-slate-900">
                <Calendar className="h-4 w-4 text-sky-900" />
                <span className="text-sm tracking-wider uppercase">
                  {new Date(prescription.createdAt).toLocaleDateString(
                    undefined,
                    { day: "numeric", month: "long", year: "numeric" },
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PATIENT DETAILS */}
            <Card className="border-2 border-slate-900 shadow-md rounded-2xl overflow-hidden bg-white/60 backdrop-blur-md">
              <div className="bg-slate-900 px-4 py-2 flex items-center gap-2">
                <User className="h-4 w-4 text-white" />
                <span className="text-[10px] text-white uppercase tracking-widest">
                  Patient Information
                </span>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Full Name
                    </p>
                    <p className="text-sm text-slate-900 tracking-wider">
                      {prescription.patientDetails.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Age / Gender
                    </p>
                    <p className="text-sm text-slate-900 tracking-wider">
                      {prescription.patientDetails.age} /{" "}
                      {prescription.patientDetails.gender}
                    </p>
                  </div>
                  {prescription.patientDetails.other !== "Not specified" && (
                    <div className="col-span-2 space-y-1 pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        Other Notes
                      </p>
                      <p className="text-sm text-slate-900 italic tracking-wide">
                        {prescription.patientDetails.other}
                      </p>
                    </div>
                  )}
                  {((prescription.patientDetails.temperature &&
                    prescription.patientDetails.temperature !==
                      "Not specified") ||
                    (prescription.patientDetails.bloodPressure &&
                      prescription.patientDetails.bloodPressure !==
                        "Not specified")) && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                      {prescription.patientDetails.temperature &&
                        prescription.patientDetails.temperature !==
                          "Not specified" && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                              Temperature
                            </p>
                            <p className="text-sm text-slate-900 tracking-wider">
                              {prescription.patientDetails.temperature}
                            </p>
                          </div>
                        )}
                      {prescription.patientDetails.bloodPressure &&
                        prescription.patientDetails.bloodPressure !==
                          "Not specified" && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                              Blood Pressure
                            </p>
                            <p className="text-sm text-slate-900 tracking-wider">
                              {prescription.patientDetails.bloodPressure}
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DOCTOR DETAILS */}
            <Card className="border-2 border-slate-900 shadow-md rounded-2xl overflow-hidden bg-white/60 backdrop-blur-md">
              <div className="bg-sky-900 px-4 py-2 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-white" />
                <span className="text-[10px] text-white uppercase tracking-widest">
                  Doctor Information
                </span>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Practitioner
                    </p>
                    <p className="text-sm text-slate-900 tracking-wider">
                      {prescription.doctorDetails.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Specialization
                    </p>
                    <p className="text-sm text-slate-900 tracking-wider">
                      {prescription.doctorDetails.specialization}
                    </p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Facility
                    </p>
                    <p className="text-sm text-slate-900 truncate tracking-wider">
                      {prescription.doctorDetails.hospital}
                    </p>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Contact
                    </p>
                    <p className="text-sm text-slate-900 tracking-wider">
                      {prescription.doctorDetails.contact}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="diagnosis" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1.5 border-2 border-slate-900 rounded-2xl h-14">
              <TabsTrigger
                value="diagnosis"
                className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest"
              >
                <Activity className="h-4 w-4" />
                Diagnosis
              </TabsTrigger>
              <TabsTrigger
                value="medicines"
                className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest"
              >
                <Pill className="h-4 w-4" />
                Medicines
              </TabsTrigger>
              <TabsTrigger
                value="tests"
                className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-xl flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest"
              >
                <TestTube className="h-4 w-4" />
                Tests
              </TabsTrigger>
            </TabsList>

            {/* DIAGNOSIS TAB */}
            <TabsContent
              value="diagnosis"
              className="space-y-4 focus-visible:ring-0"
            >
              <Card className="border-2 border-slate-900 shadow-md rounded-2xl overflow-hidden bg-white/60 backdrop-blur-md">
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity className="h-3 w-3 text-sky-900" /> Diagnosis
                      </p>
                      <p className="text-lg text-slate-900 bg-slate-50/50 p-6 rounded-2xl border-2 border-slate-900/5 leading-relaxed tracking-wider italic">
                        {prescription.diagnosis !== "Not specified"
                          ? prescription.diagnosis
                          : "No specific diagnosis detected"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-sky-50/50 border-2 border-sky-900/10 rounded-2xl p-5">
                        <p className="text-[10px] text-sky-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Next Visit
                        </p>
                        <p className="text-sm text-slate-900 tracking-wider">
                          {prescription.nextVisit !== "Not specified"
                            ? prescription.nextVisit
                            : "No follow-up mentioned"}
                        </p>
                      </div>
                      <div className="bg-emerald-50/50 border-2 border-emerald-900/10 rounded-2xl p-5">
                        <p className="text-[10px] text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <HeartPulse className="h-3 w-3" /> Special Care
                        </p>
                        <p className="text-sm text-slate-900 tracking-wider">
                          {prescription.specialCare !== "Not specified"
                            ? prescription.specialCare
                            : "Standard care recommended"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* MEDICINES TAB */}
            <TabsContent
              value="medicines"
              className="space-y-4 focus-visible:ring-0"
            >
              {prescription.medicines.map((med: any, index: number) => (
                <MedicineCard key={index} medicine={med} />
              ))}
            </TabsContent>

            {/* TESTS TAB */}
            <TabsContent
              value="tests"
              className="space-y-4 focus-visible:ring-0"
            >
              <div className="grid grid-cols-1 gap-4">
                {prescription.labTests &&
                prescription.labTests.length > 0 &&
                prescription.labTests[0].name !== "Not specified" ? (
                  prescription.labTests.map((test: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm transition-all group"
                    >
                      <div className="h-12 w-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                        <TestTube className="h-6 w-6 text-sky-900" />
                      </div>
                      <div>
                        <p className="text-lg text-slate-900 uppercase tracking-widest">
                          {test.name}
                        </p>
                        <p className="text-sm text-slate-500 tracking-wide leading-relaxed">
                          {test.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 uppercase tracking-widest text-[10px]">
                      No lab tests mentioned
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function MedicineCard({ medicine }: { medicine: any }) {
  return (
    <Card className="border-2 border-slate-900 shadow-md rounded-2xl overflow-hidden bg-white/60 backdrop-blur-md">
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b-2 border-slate-100 pb-4">
          <div className="space-y-2">
            <h3 className="text-xl text-slate-900 uppercase tracking-widest">
              {medicine.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-sky-50 text-sky-900 rounded-md border border-sky-900/10 font-bold">
                <Info className="h-3 w-3" />
                <span className="text-[9px] uppercase tracking-widest">
                  {medicine.mealRelation}
                </span>
              </div>
              {medicine.mealTime && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-900 rounded-md border border-amber-900/20 font-bold">
                  <span className="text-[9px] uppercase tracking-widest">
                    {medicine.mealTime}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded-md">
                <Clock className="h-3 w-3" />
                <span className="text-[9px] uppercase tracking-widest">
                  {medicine.frequency}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200 rounded-xl px-3.5 py-2.5 max-w-full sm:max-w-xs md:max-w-sm text-left">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1 font-bold">
              Use Case / Indication
            </p>
            <p className="text-xs text-slate-900 leading-snug tracking-wide font-medium">
              {medicine.useCase || "Prescribed by doctor"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-2 font-bold">
                Composition
              </p>
              <p className="text-xs text-slate-600 bg-slate-50/30 p-3 rounded-xl border border-slate-100 italic tracking-wide">
                {medicine.composition || "Not specified"}
              </p>
            </div>

            {((medicine.sideEffects &&
              medicine.sideEffects !== "Not specified" &&
              medicine.sideEffects !== "None reported") ||
              (medicine.precautions &&
                medicine.precautions !== "Not specified" &&
                medicine.precautions !== "Take as directed")) && (
              <div className="grid grid-cols-2 gap-4">
                {medicine.sideEffects &&
                  medicine.sideEffects !== "Not specified" &&
                  medicine.sideEffects !== "None reported" && (
                    <div>
                      <p className="text-[9px] text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Side Effects
                      </p>
                      <p className="text-[11px] text-slate-600 leading-snug tracking-wide">
                        {medicine.sideEffects}
                      </p>
                    </div>
                  )}
                {medicine.precautions &&
                  medicine.precautions !== "Not specified" &&
                  medicine.precautions !== "Take as directed" && (
                    <div>
                      <p className="text-[9px] text-sky-900 uppercase tracking-widest mb-1.5">
                        Precautions
                      </p>
                      <p className="text-[11px] text-slate-600 leading-snug tracking-wide">
                        {medicine.precautions}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2 md:pt-0">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart className="h-3 w-3 text-sky-900" /> Buying Options
            </p>
            <BuyingLinks medicineName={medicine.name} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function BuyingLinks({ medicineName }: { medicineName: string }) {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      const cacheKey = `med_links_${medicineName.toLowerCase().trim()}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          setLinks(JSON.parse(cached));
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      try {
        const res = await fetch(
          `/api/medicine-links?query=${encodeURIComponent(medicineName)}`,
        );
        const data = await res.json();
        setLinks(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to fetch medicine links", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, [medicineName]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-16 w-full bg-slate-100/50 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="text-[10px] text-slate-400 italic tracking-widest uppercase">
        No purchasing options found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {links.map((link, i) => (
        <div
          key={i}
          className="group flex items-center gap-3 p-3 border-2 border-slate-900/5 rounded-2xl hover:border-sky-900/10 hover:bg-white/80 transition-all bg-white/40 shadow-sm"
        >
          {/* PRODUCT THUMBNAIL */}
          <div className="h-12 w-12 rounded-xl bg-white overflow-hidden shrink-0 border border-slate-100 shadow-xs">
            {link.thumbnail ? (
              <img
                src={link.thumbnail}
                alt={link.title}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <ShoppingCart className="h-full w-full p-3 text-slate-200" />
            )}
          </div>

          {/* INFO SECTION */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {link.source_icon && (
                <img
                  src={link.source_icon}
                  alt={link.source}
                  className="h-3 w-3 object-contain"
                />
              )}
              <a
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-slate-900 truncate hover:text-sky-900 uppercase tracking-widest"
              >
                {link.source}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-sm text-sky-900 tracking-wider">
                {link.price}
              </p>
              {link.rating && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                  <Star className="h-2.5 w-2.5 fill-amber-600" />
                  {link.rating}
                </div>
              )}
              <div className="flex items-center gap-1 text-[9px] text-slate-400 truncate max-w-20 uppercase tracking-wider">
                <Truck className="h-2.5 w-2.5" />
                {link.delivery}
              </div>
            </div>
          </div>

          {/* ACTION */}
          <a
            href={link.link}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 bg-sky-900 text-white rounded-xl flex items-center justify-center text-[10px] uppercase tracking-widest border-2 border-slate-900 hover:bg-sky-800 transition-all shadow-sm active:translate-y-px"
          >
            Buy
          </a>
        </div>
      ))}
    </div>
  );
}
