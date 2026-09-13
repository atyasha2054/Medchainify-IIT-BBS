"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Stethoscope,
  Filter,
  Star,
  Clock,
  ChevronRight,
  Activity,
  ArrowUpDown,
  Building2,
  Hospital,
  Fingerprint,
  Medal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import BackgroundPattern from "@/components/BackgroundPattern";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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

export default function DoctorsDirectoryPage() {
  const { data, status } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState<"name" | "specialization">("name");
  const [sortBy, setSortBy] = useState<"name" | "experience" | "rating">(
    "name",
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/doctors?search=${search}&searchBy=${searchBy}&sortBy=${sortBy}`,
      );
      if (!res.ok) throw new Error("Failed to fetch doctors");
      const data = await res.json();
      setDoctors(data.doctors);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDoctors();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, searchBy, sortBy]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <TetrisLoading
          size="lg"
          speed="normal"
          showLoadingText={true}
          loadingText="Accessing directory vault..."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[90%] space-y-12">
        {/* HEADER */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
            Our <span className="text-sky-800">Specialists</span>
          </h1>
          <p className="text-slate-500 capitalize tracking-wider max-w-2xl mx-auto text-lg">
            Browse through our verified network of medical professionals
          </p>
        </div>

        {/* SEARCH HUD */}
        <Card className="border-2 border-slate-900 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-sky-800 transition-colors" />
                <input
                  type="text"
                  placeholder={
                    searchBy === "name"
                      ? "Search by doctor name..."
                      : "Search by department/specialization..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-16 bg-slate-50/50 border-2 border-slate-200 rounded-[1.5rem] pl-16 pr-6 text-slate-800 focus:outline-none focus:border-slate-900 transition-all text-lg tracking-wide placeholder:text-slate-300"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-100 p-2 border-2 border-slate-900 rounded-[1.5rem]">
                <button
                  onClick={() => setSearchBy("name")}
                  className={cn(
                    "px-6 py-3 rounded-xl uppercase tracking-widest text-xs font-bold transition-all",
                    searchBy === "name"
                      ? "bg-sky-800 text-white shadow-lg border-2 border-slate-900"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  By Name
                </button>
                <button
                  onClick={() => setSearchBy("specialization")}
                  className={cn(
                    "px-6 py-3 rounded-xl uppercase tracking-widest text-xs font-bold transition-all",
                    searchBy === "specialization"
                      ? "bg-sky-800 text-white shadow-lg border-2 border-slate-900"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  By Dept.
                </button>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-[1.5rem] ml-auto">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-3">
                  Sort:
                </span>
                <button
                  onClick={() => setSortBy("name")}
                  className={cn(
                    "px-4 py-2 rounded-xl uppercase tracking-widest text-[9px] font-bold transition-all flex items-center gap-2",
                    sortBy === "name"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-900"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Name
                </button>
                <button
                  onClick={() => setSortBy("experience")}
                  className={cn(
                    "px-4 py-2 rounded-xl uppercase tracking-widest text-[9px] font-bold transition-all flex items-center gap-2",
                    sortBy === "experience"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-900"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  <Medal className="h-3 w-3" />
                  Exp
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  className={cn(
                    "px-4 py-2 rounded-xl uppercase tracking-widest text-[9px] font-bold transition-all flex items-center gap-2",
                    sortBy === "rating"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-900"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  <Star className="h-3 w-3" />
                  Rating
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESULTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <Card
                  key={`skeleton-${i}`}
                  className="border-2 border-slate-100 rounded-[2.5rem] bg-white animate-pulse h-80"
                />
              ))
            ) : doctors.length > 0 ? (
              doctors.map((doctor) => (
                <motion.div
                  key={doctor.sl_no}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <Card className="border-2 border-slate-900 shadow-xl rounded-[2.5rem] overflow-hidden bg-white/95 group hover:shadow-2xl transition-all h-full flex flex-col">
                    <CardContent className="p-8 flex-1 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-2xl text-slate-900 uppercase tracking-normal font-bold truncate">
                            {doctor.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sky-800 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100 w-fit">
                            <Stethoscope className="h-3.5 w-3.5" />
                            <span className="text-[10px] uppercase tracking-widest font-black">
                              {doctor.specialization}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-amber-700">
                            {doctor.rating}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed tracking-wide italic">
                        "{doctor.short_description}"
                      </p>

                      <div className="flex items-center gap-4 pt-4 border-t border-slate-50 text-xs uppercase tracking-wider font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {doctor.experience}Y EXP
                        </div>
                        <div className="flex items-center gap-1.5 capitalize">
                          <Fingerprint className="h-3.5 w-3.5" />
                          {doctor.gender}
                        </div>
                      </div>
                    </CardContent>
                    <div className="px-8 pb-8">
                      <Button
                        onClick={() => router.push(`/doctors/${doctor.sl_no}`)}
                        className="w-full h-12 bg-white text-slate-900 border-2 border-slate-900 rounded-[1.2rem] uppercase tracking-widest text-xs font-black hover:bg-slate-900 hover:text-white transition-all group/btn"
                      >
                        View Profile
                        <ChevronRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto border-2 border-slate-200">
                  <Activity className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl text-slate-900 uppercase tracking-widest">
                  No Doctors Found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  onClick={() => {
                    setSearch("");
                    setSearchBy("name");
                  }}
                  variant="ghost"
                  className="text-sky-800 underline uppercase tracking-widest text-xs"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
