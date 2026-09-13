"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HealthGaugeProps {
  score: number;
  size?: number;
}

export default function HealthGauge({ score, size = 240 }: HealthGaugeProps) {
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScore(score);
    }, 500);
    return () => clearTimeout(timer);
  }, [score]);

  // Needle rotation calculation (0-100 score mapped to -90 to 90 degrees)
  const rotation = (currentScore / 100) * 180 - 90;

  return (
    <div
      className="relative flex flex-col items-center justify-end overflow-hidden"
      style={{ width: size, height: size / 1.5 }}
    >
      {/* GAUGE BACKGROUND (SEMI-CIRCLE) */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute top-0"
      >
        {/* RED SEGMENT */}
        <path
          d={`M ${size * 0.1} ${size * 0.6} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.3} ${size * 0.25}`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* AMBER SEGMENT */}
        <path
          d={`M ${size * 0.35} ${size * 0.22} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.65} ${size * 0.22}`}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* GREEN SEGMENT */}
        <path
          d={`M ${size * 0.7} ${size * 0.25} A ${size * 0.4} ${size * 0.4} 0 0 1 ${size * 0.9} ${size * 0.6}`}
          fill="none"
          stroke="#10b981"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>

      {/* NEEDLE */}
      <motion.div
        className="absolute bottom-0 origin-bottom flex flex-col items-center"
        style={{ height: size * 0.45 }}
        initial={{ rotate: -90 }}
        animate={{ rotate: rotation }}
        transition={{ duration: 3, ease: "easeOut" }}
      >
        <div className="w-1.5 h-full bg-slate-900 rounded-full relative"></div>
      </motion.div>

      {/* CENTER CAP */}
      <div className="absolute bottom-0 w-10 h-10 bg-slate-900 rounded-full border-4 border-white shadow-xl flex items-center justify-center z-10 translate-y-1/2">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>

      {/* SCORE TEXT */}
      <div className="absolute bottom-4 flex flex-col items-center">
        <motion.span
          className="text-3xl font-black text-slate-900"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {Math.round(currentScore)}
        </motion.span>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Health Score
        </span>
      </div>
    </div>
  );
}
