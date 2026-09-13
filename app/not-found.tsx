"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4">
      <div className="max-w-3xl text-center flex flex-col items-center justify-center">
        <h1 className="mb-4 text-4xl font-bold tracking-wider sm:text-6xl lg:text-[7rem] text-slate-900">
          404
        </h1>
        <p className="mb-8 text-lg sm:text-xl text-slate-500 font-semibold tracking-wide uppercase">
          The page you are looking for does not exist.
        </p>
        <button
          onClick={handleGoHome}
          className="rounded-lg px-6 py-3 text-lg sm:text-2xl tracking-wide bg-sky-800 text-white hover:bg-sky-900 border-2 border-slate-900 hover:shadow-md ease-in-out transition-all cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
