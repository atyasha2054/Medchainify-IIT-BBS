"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";

// Lucide icons
import {
  Megaphone,
  Search,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  Users,
  Stethoscope,
  Building,
  DollarSign,
  Plus,
  Filter,
  ArrowRight,
  HeartHandshake,
  CheckCircle2,
  Tag,
  Edit3,
} from "lucide-react";

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFee, setSelectedFee] = useState<string>("all");
  const [selectedRequirement, setSelectedRequirement] = useState<string>("all");

  // Fetch campaigns
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedFee !== "all") params.append("feeType", selectedFee);
      if (selectedRequirement !== "all") params.append("requirement", selectedRequirement);

      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [selectedFee, selectedRequirement]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCampaigns();
  };

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-start p-4 pt-12 pb-36 relative">
      <BackgroundPattern />

      <div className="w-full max-w-7xl space-y-10 relative z-10">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b-2 border-slate-900">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider">
              <Megaphone className="w-3.5 h-3.5" />
              Public Health Initiatives & Drives
            </div>
            <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
              Healthcare <span className="text-sky-800">Campaigns</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 font-semibold uppercase tracking-wider">
              Discover medical camps, wellness drives, and outreach programs in your community
            </p>
          </div>

          <Link
            href="/create-campaign"
            className="px-6 py-4 bg-sky-800 text-white rounded-2xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Host A Campaign</span>
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-3xl border-2 border-slate-900 shadow-lg space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by campaign name, service (e.g. eye checkup), or city..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-slate-900 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-800"
              />
            </div>
            <button
              type="submit"
              className="px-6 h-12 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-sky-800 transition-all cursor-pointer shadow-md"
            >
              Search
            </button>
          </form>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
            {/* Fee Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold uppercase text-slate-400 text-[10px] tracking-wider">
                Fee Type:
              </span>
              {[
                { id: "all", label: "All Types" },
                { id: "free", label: "🎉 Free" },
                { id: "paid", label: "💳 Paid" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFee(f.id)}
                  className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer ${
                    selectedFee === f.id
                      ? "bg-sky-800 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Requirement Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold uppercase text-slate-400 text-[10px] tracking-wider">
                Seeking Help:
              </span>
              {[
                { id: "all", label: "All Needs" },
                { id: "Doctor", label: "🩺 Doctors" },
                { id: "Volunteer", label: "🤝 Volunteers" },
                { id: "Fund", label: "💰 Funds" },
                { id: "Venue", label: "🏢 Venue" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRequirement(r.id)}
                  className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition-all cursor-pointer ${
                    selectedRequirement === r.id
                      ? "bg-purple-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <TetrisLoading size="md" speed="normal" showLoadingText={true} loadingText="Loading campaigns..." />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border-2 border-slate-900 text-center space-y-4 shadow-md max-w-xl mx-auto">
            <Megaphone className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-black text-slate-900 uppercase">No Campaigns Found</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
              No matching healthcare drives found for your current search or filters.
            </p>
            <Link
              href="/create-campaign"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-800 text-white rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Campaign</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((camp) => (
              <motion.div
                key={camp._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border-2 border-slate-900 shadow-lg overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all group"
              >
                <div>
                  {/* Banner Image Container with 1:1 Aspect Ratio */}
                  <div className="relative w-full aspect-square bg-slate-100 border-b-2 border-slate-900 overflow-hidden">
                    <img
                      src={camp.bannerImage}
                      alt={camp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Overlay Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm border-2 border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-md">
                        {camp.location?.city || "Active Camp"}
                      </span>

                      <span
                        className={`px-3 py-1 backdrop-blur-sm border-2 border-slate-900 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md ${
                          camp.feeType === "free"
                            ? "bg-emerald-500 text-white"
                            : "bg-sky-800 text-white"
                        }`}
                      >
                        {camp.feeType === "free" ? "Free" : `₹${camp.feeAmount}`}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-4">
                    {/* Host NGO Info */}
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                        {camp.ngo?.logo ? (
                          <img
                            src={camp.ngo.logo}
                            alt={camp.ngo.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building className="w-4 h-4 text-sky-800" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {camp.ngo?.name || "Healthcare NGO / Trust"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">
                          {camp.ngo?.city
                            ? `${camp.ngo.city}${camp.ngo.state ? `, ${camp.ngo.state}` : ""}`
                            : "Registered NGO"}
                        </p>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-1 group-hover:text-sky-800 transition-colors">
                        {camp.name}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {camp.tagline}
                      </p>
                    </div>

                    {/* Dates & Location */}
                    <div className="space-y-1.5 text-xs text-slate-600 font-bold">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-sky-800 shrink-0" />
                        <span>{camp.startDate} &bull; {camp.startTime}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-sky-800 shrink-0" />
                        <span className="truncate">{camp.location?.address}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-sky-800 shrink-0" />
                        <span>Capacity: {camp.capacity} Persons</span>
                      </div>
                    </div>

                    {/* Services Chips */}
                    {camp.services && camp.services.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {camp.services.slice(0, 3).map((svc: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-sky-50 border border-sky-200 text-sky-900 rounded-md text-[10px] font-extrabold"
                          >
                            ✓ {svc}
                          </span>
                        ))}
                        {camp.services.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">
                            +{camp.services.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Requirements Chips */}
                    {camp.requirements && camp.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {camp.requirements.map((req: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-md text-[10px] font-extrabold"
                          >
                            ⚡ {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="p-6 pt-0 flex gap-2">
                  <Link
                    href={`/campaigns/${camp._id}`}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sky-800 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>View Campaign</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {session?.user &&
                    (camp.createdBy?._id === session.user.id ||
                      camp.createdBy === session.user.id ||
                      camp.createdBy?.email === session.user.email) && (
                      <Link
                        href={`/campaigns/${camp._id}/edit`}
                        className="px-3.5 py-3 bg-amber-400 text-slate-950 border-2 border-slate-900 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-amber-500 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        title="Edit Campaign"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
