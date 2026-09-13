"use client";
import { useRouter } from "next/navigation";
import React from "react";

export default function Home() {
  const router = useRouter();
  const redirectToAuth = () => {
    router.push("/auth");
  };
  return (
    <div className="relative h-screen">
      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <h1 className="mb-8 text-4xl font-bold tracking-wider sm:text-6xl lg:text-[8rem] text-slate-900">
            Med<span className="text-sky-900">Chain</span>Ify
          </h1>
          <div className="flex flex-wrap justify-center gap-8">
            <button
              onClick={redirectToAuth}
              className="rounded-lg px-6 py-3 text-lg sm:text-2xl tracking-wide bg-sky-800 text-white hover:bg-sky-900 border-2 border-slate-900 hover:shadow-md ease-in-out transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
