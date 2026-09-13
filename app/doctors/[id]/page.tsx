"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  User,
  Stethoscope,
  Star,
  Clock,
  Activity,
  CheckCircle2,
  Brain,
  ShieldCheck,
  ChevronLeft,
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

interface Doctor {
  sl_no: number;
  name: string;
  age: number;
  short_description: string;
  bio: string;
  specialization: string;
  experience: number;
  gender: string;
  rating: number;
}

export default function DoctorProfilePage() {
  const { data, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`/api/doctors/${id}`);
        if (!res.ok) throw new Error("Doctor not found");
        const data = await res.json();
        setDoctor(data);
      } catch (err: any) {
        toast.error(err.message);
        router.push("/doctors");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDoctor();
  }, [id, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <TetrisLoading
          size="lg"
          speed="normal"
          showLoadingText={true}
          loadingText="Accessing specialist registry..."
        />
      </div>
    );
  }
  if (!doctor) return null;

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[80%] space-y-8">
        {/* BACK NAVIGATION */}
        <Button
          variant="ghost"
          onClick={() => router.push("/doctors")}
          className="group text-slate-500 hover:text-slate-900 uppercase tracking-[0.2em] text-[10px] font-black"
        >
          <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Directory
        </Button>

        {/* PROFILE HEADER - FORMAL STYLE */}
        <div className="bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] border-2 border-slate-900 shadow-2xl relative overflow-hidden">
          <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-[0.3em]">
                Verified Medical Specialist
              </span>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] text-sky-900 ">
                    Medical Professional
                  </h3>
                  <h2 className="text-5xl text-slate-900 uppercase tracking-widest">
                    {doctor.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="text-slate-500 text-lg uppercase tracking-widest">
                      {doctor.specialization}
                    </p>
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-amber-700 tracking-widest">
                        {doctor.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed tracking-wider text-lg italic bg-white/40 p-6 rounded-2xl border border-slate-900/5 shadow-inner">
                "{doctor.short_description}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div className="bg-white/80 p-6 rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-105 transition-all">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                  Experience
                </p>
                <p className="text-2xl text-slate-900">
                  {doctor.experience} Years
                </p>
              </div>
              <div className="bg-white/80 p-6 rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-105 transition-all">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                  Status
                </p>
                <p className="text-2xl text-emerald-600">Active</p>
              </div>
              <div className="bg-white/80 p-6 rounded-2xl border-2 border-slate-900 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-105 transition-all">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">
                  Gender
                </p>
                <p className="text-2xl text-slate-900 capitalize">
                  {doctor.gender}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CLINICAL DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <Card className="border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden bg-white/95 h-full">
              <CardContent className=" space-y-8">
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 leading-relaxed tracking-wider bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {doctor.bio}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-4 space-y-8">
            <Card className="border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden bg-sky-800 text-white">
              <CardContent className="p-10 space-y-6 text-center">
                <p className="text-md uppercase tracking-widest text-sky-300 mb-2">
                  Primary Specialization
                </p>
                <span className="bg-white text-sky-900 font-bold px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest border border-sky-200">
                  {doctor.specialization}
                </span>
              </CardContent>
            </Card>

            {/* <Button
              onClick={() => router.push("/find-doctor")}
              className="w-full h-16 bg-sky-800 text-white border-2 border-slate-900 rounded-[2rem] uppercase tracking-[0.2em] hover:bg-sky-900 transition-all shadow-lg group"
            >
              Consult Now
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
