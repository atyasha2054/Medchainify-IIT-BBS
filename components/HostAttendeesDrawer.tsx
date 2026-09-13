"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  X,
  Search,
  Download,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface HostAttendeesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: any;
  registrations: any[];
  metrics: any;
}

export default function HostAttendeesDrawer({
  isOpen,
  onClose,
  campaign,
  registrations = [],
  metrics,
}: HostAttendeesDrawerProps) {
  const [activeTab, setActiveTab] = useState<"all" | "confirmed" | "waitlist" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedTxn, setCopiedTxn] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesTab = activeTab === "all" ? true : reg.status === activeTab;
    const matchesSearch =
      !searchTerm ||
      reg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCopyTxn = (txnId: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(txnId);
      setCopiedTxn(txnId);
      setTimeout(() => setCopiedTxn(null), 2000);
    }
  };

  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) return;

    const headers = [
      "Registration ID",
      "Name",
      "Email",
      "Status",
      "Waitlist Position",
      "Fee Type",
      "Fee Amount",
      "Payment Status",
      "Transaction ID",
      "Invoice Number",
      "Registered At",
    ];

    const rows = registrations.map((r) => [
      r._id,
      `"${r.name || ""}"`,
      `"${r.email || ""}"`,
      r.status,
      r.waitlistPosition || "",
      r.feeType,
      r.feeAmount || 0,
      r.paymentStatus,
      `"${r.transactionId || ""}"`,
      `"${r.invoiceNumber || ""}"`,
      `"${new Date(r.registeredAt || r.createdAt).toISOString()}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `campaign_attendees_${campaign._id.slice(-6)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b-2 border-slate-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-800 flex items-center justify-center border border-sky-400">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">
                  Campaign Attendee Roster
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  {campaign?.name} • Host Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border border-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="p-4 sm:p-6 bg-slate-50 border-b-2 border-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Target Capacity
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {metrics?.capacity || campaign?.capacity || 0}
              </p>
              <span className="text-[10px] text-slate-500 font-bold">
                {metrics?.spotsRemaining ?? 0} spots remaining
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                Confirmed Attendees
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {metrics?.confirmedCount || 0}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">
                Active pass holders
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                Waiting List
              </span>
              <p className="text-xl font-black text-amber-700 mt-1">
                {metrics?.waitlistCount || 0}
              </p>
              <span className="text-[10px] text-amber-600 font-bold">
                Queued for spots
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 block">
                {campaign.feeType === "paid" ? "NGO Wallet Revenue" : "Cancellations"}
              </span>
              <p className="text-xl font-black text-sky-900 mt-1">
                {campaign.feeType === "paid"
                  ? `₹${metrics?.totalRevenue || 0}`
                  : metrics?.cancelledCount || 0}
              </p>
              <span className="text-[10px] text-slate-500 font-bold">
                {campaign.feeType === "paid"
                  ? `${metrics?.totalPaidAttendees || 0} paid (${metrics?.cancelledPaidAttendees || 0} retained from cancels)`
                  : "Cancelled spots"}
              </span>
            </div>
          </div>

          {/* Controls: Search & Tabs */}
          <div className="p-4 bg-white border-b-2 border-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-300 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({registrations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("confirmed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "confirmed"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Confirmed ({metrics?.confirmedCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("waitlist")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "waitlist"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Waitlist ({metrics?.waitlistCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cancelled")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "cancelled"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cancelled ({metrics?.cancelledCount || 0})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, txn..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-medium focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-700 uppercase">
                  No registrations found
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {searchTerm
                    ? "No records match your search criteria."
                    : "Registrations will appear here once attendees sign up."}
                </p>
              </div>
            ) : (
              <div className="border-2 border-slate-900 rounded-2xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-800 uppercase tracking-wider">
                      <th className="p-3">Attendee</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Pass / Fee</th>
                      <th className="p-3">Transaction / Invoice</th>
                      <th className="p-3 text-right">Signed Up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRegistrations.map((reg) => (
                      <tr
                        key={reg._id}
                        className="hover:bg-slate-50 transition-colors font-medium text-slate-800"
                      >
                        {/* Attendee */}
                        <td className="p-3">
                          <div className="font-black text-slate-900">{reg.name}</div>
                          <div className="text-[11px] text-slate-500">{reg.email}</div>
                          {reg.phone && (
                            <div className="text-[10px] text-slate-400">{reg.phone}</div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          {reg.status === "confirmed" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Confirmed</span>
                            </span>
                          )}
                          {reg.status === "waitlist" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px] uppercase tracking-wider">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Waitlist #{reg.waitlistPosition}</span>
                            </span>
                          )}
                          {reg.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 border border-rose-300 font-black text-[10px] uppercase tracking-wider">
                              <XCircle className="w-3 h-3 text-rose-700" />
                              <span>Cancelled</span>
                            </span>
                          )}
                        </td>

                        {/* Pass / Fee */}
                        <td className="p-3">
                          <div className="font-black text-slate-900">
                            {reg.feeType === "free" ? "Free Entry" : `₹${reg.feeAmount}`}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            {reg.paymentStatus === "paid"
                              ? "Paid via Stripe"
                              : reg.paymentStatus === "pending"
                              ? "Payment Pending"
                              : "No Fee Required"}
                          </div>
                        </td>

                        {/* Transaction ID */}
                        <td className="p-3 font-mono text-[11px]">
                          {reg.transactionId ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="truncate max-w-30 text-slate-900 font-bold">
                                  {reg.transactionId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTxn(reg.transactionId)}
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title="Copy Transaction ID"
                                >
                                  {copiedTxn === reg.transactionId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              {reg.invoiceNumber && (
                                <div className="text-[10px] text-slate-500 font-normal">
                                  {reg.invoiceNumber}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-sans text-[11px]">
                              —
                            </span>
                          )}
                        </td>

                        {/* Signed Up */}
                        <td className="p-3 text-right text-[11px] text-slate-600">
                          {new Date(reg.registeredAt || reg.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
