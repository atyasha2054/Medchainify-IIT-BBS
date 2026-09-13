"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MdOutlineMedication,
  MdOutlineScience,
  MdKeyboardArrowDown,
  MdSearch,
  MdClose,
} from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";
import { FiPackage } from "react-icons/fi";
import BackgroundPattern from "@/components/BackgroundPattern";
import { motion, AnimatePresence } from "framer-motion";
import TetrisLoading from "@/components/ui/tetris-loader";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Medicine {
  _id: string;
  name: string;
  "price(₹)": string;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  short_composition1: string;
  short_composition2?: string;
  Is_discontinued?: string;
  sub_category?: string;
}

export default function MedicinesPage() {
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const lastRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((p) => p + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const fetchMedicines = async (
    letter: string,
    pageNum: number,
    reset: boolean,
    query = "",
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        letter,
        page: String(pageNum),
        limit: "30",
        ...(query ? { search: query } : {}),
      });
      const res = await fetch(`/api/medicines?${params}`);
      const data = await res.json();
      setMedicines((prev) =>
        reset ? data.medicines : [...prev, ...data.medicines],
      );
      setHasMore(data.pagination.page < data.pagination.totalPages);
      setTotalRecords(data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce: update searchQuery 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // When searchQuery changes, fetch with search override
  useEffect(() => {
    setPage(1);
    fetchMedicines(selectedLetter, 1, true, searchQuery);
  }, [searchQuery, selectedLetter]);

  useEffect(() => {
    if (page > 1) fetchMedicines(selectedLetter, page, false, searchQuery);
  }, [page]);

  const handleSelect = (letter: string) => {
    setSelectedLetter(letter);
    setSearchInput("");
    setDropdownOpen(false);
  };

  const clearSearch = () => {
    setSearchInput("");
    searchRef.current?.focus();
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32">
      <BackgroundPattern />

      <div className="w-full max-w-[90%] space-y-12 relative z-10">
        {/* ── HEADER ── */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
            <span className="text-sky-900">Pharma</span> Directory
          </h1>
          <p className="text-slate-500 tracking-wider max-w-2xl mx-auto text-lg text-center font-normal">
            <span className="text-sky-900 font-semibold">
              {totalRecords.toLocaleString()}
            </span>{" "}
          </p>
        </div>

        {/* ── CONTROLS ROW ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* ALPHABET DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-4 px-6 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-slate-900 rounded-2xl shadow-xl text-slate-900 font-semibold tracking-widest uppercase text-sm hover:bg-slate-50 transition-all"
            >
              <span className="text-[10px] text-slate-400 tracking-[0.35em] font-semibold uppercase">
                Index
              </span>
              <span className="text-2xl font-semibold text-sky-900 leading-none">
                {selectedLetter}
              </span>
              <MdKeyboardArrowDown
                className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 z-50 bg-white/98 backdrop-blur-md border-2 border-slate-900 rounded-2xl shadow-2xl overflow-hidden"
                  style={{ minWidth: "22rem" }}
                >
                  <div className="p-3 grid grid-cols-6 gap-1">
                    {ALPHABET.map((letter) => (
                      <button
                        key={letter}
                        onClick={() => handleSelect(letter)}
                        className={`h-10 w-full rounded-xl text-sm font-semibold tracking-widest uppercase transition-all ${
                          selectedLetter === letter
                            ? "bg-slate-900 text-white shadow-md"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTOR INFO PILL */}
          <div className="flex items-center gap-6 px-7 py-3 bg-white/90 backdrop-blur-sm border-2 border-slate-900 rounded-full shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold text-slate-400">
                {searchQuery ? "Results" : "Sector"}
              </span>
              <span className="text-xl font-semibold text-sky-900">
                {searchQuery ? "Search" : selectedLetter}
              </span>
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold text-slate-400">
                Entries
              </span>
              <span className="text-xl font-semibold text-sky-900">
                {totalRecords.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── SEARCH BOX ── */}
        <div className="relative">
          <div className="flex items-center gap-3 px-5 py-4 bg-white/95 backdrop-blur-sm border-2 border-slate-900 rounded-2xl shadow-xl focus-within:border-sky-900 transition-colors">
            <MdSearch className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search any medicine by name…"
              className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-300 font-normal tracking-wider text-sm focus:outline-none"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <MdClose className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-[10px] uppercase tracking-[0.35em] font-semibold text-slate-400 px-1">
              Showing results for &ldquo;
              <span className="text-sky-900">{searchQuery}</span>&rdquo; across
              all sectors
            </p>
          )}
        </div>

        {/* ── CATALOGUE GRID ── */}
        <div>
          {/* Initial loading state */}
          {loading && medicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 w-full">
              <TetrisLoading
                size="lg"
                speed="normal"
                showLoadingText={true}
                loadingText={`Loading Sector ${selectedLetter}...`}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {medicines.map((med, idx) => {
                    const isLast = idx === medicines.length - 1;
                    return (
                      <motion.div
                        key={med._id}
                        ref={isLast ? lastRef : null}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: (idx % 9) * 0.04 }}
                        className="relative overflow-hidden"
                      >
                        {/* DISCONTINUED RIBBON — only when Is_discontinued === 'TRUE' */}
                        {med.Is_discontinued === "TRUE" && (
                          <div className="absolute top-4 -right-8 z-10 rotate-45 bg-red-500 text-white text-md uppercase w-32 text-center py-1 shadow-lg">
                            SALE
                          </div>
                        )}

                        <div className="h-full bg-white/95 backdrop-blur-sm border-2 border-sky-500 hover:border-green-600 rounded-2xl shadow-sm transition-colors duration-200 overflow-hidden flex flex-col">
                          {/* CARD BODY */}
                          <div className="p-6 flex flex-col gap-5 grow">
                            {/* TYPE */}
                            <div className="flex items-center">
                              <span className="text-[9px] uppercase tracking-[0.3em] font-semibold text-sky-900 bg-sky-50 border border-slate-200 px-3 py-1 rounded-full">
                                {med.type || "Allopathy"}
                              </span>
                            </div>

                            {/* NAME */}
                            <h3 className="text-base font-semibold text-slate-900 leading-snug uppercase tracking-wide">
                              {med.name}
                            </h3>

                            {/* MANUFACTURER */}
                            <div className="flex items-center gap-2">
                              <MdOutlineScience className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest leading-none truncate">
                                {med.manufacturer_name}
                              </p>
                            </div>

                            {/* COMPOSITION */}
                            <div className="space-y-2.5">
                              <p className="text-[9px] uppercase tracking-[0.35em] font-semibold text-slate-400">
                                Composition
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2.5">
                                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-900 shrink-0" />
                                  <p className="text-[11px] text-slate-600 tracking-wide leading-relaxed">
                                    {med.short_composition1}
                                  </p>
                                </div>
                                {med.short_composition2 &&
                                  med.short_composition2.trim() && (
                                    <div className="flex items-start gap-2.5">
                                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                                      <p className="text-[11px] text-slate-500 tracking-wide leading-relaxed">
                                        {med.short_composition2}
                                      </p>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>

                          {/* CARD FOOTER */}
                          <div className="border-t-2 border-slate-50 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                            {/* Pack size */}
                            <div className="flex items-center gap-2">
                              <FiPackage className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest leading-none">
                                {med.pack_size_label}
                              </p>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-[9px] uppercase tracking-[0.3em] font-semibold text-slate-400 leading-none mb-1">
                                MRP
                              </p>
                              <p className="text-xl font-semibold text-slate-900 tracking-widest leading-none">
                                ₹{med["price(₹)"] || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* INFINITE SCROLL TRIGGER / LOADER */}
              <div className="flex justify-center py-16">
                {loading ? (
                  <div className="flex flex-col items-center justify-center">
                    <TetrisLoading
                      size="sm"
                      speed="normal"
                      showLoadingText={true}
                      loadingText="Synchronizing Index..."
                    />
                  </div>
                ) : !hasMore && medicines.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="h-px w-16 bg-slate-200" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-300">
                      End of Sector {selectedLetter}
                    </p>
                    <div className="h-px w-16 bg-slate-200" />
                  </div>
                ) : null}
              </div>
            </>
          )}

          {/* EMPTY STATE */}
          {!loading && medicines.length === 0 && (
            <div className="text-center py-36 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-slate-900 border-dashed">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <MdOutlineMedication className="h-9 w-9 text-slate-200" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 uppercase tracking-[0.3em] mb-2">
                No Records in Sector {selectedLetter}
              </h3>
              <p className="text-slate-400 text-xs font-normal tracking-widest">
                Select a different index from the dropdown
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
