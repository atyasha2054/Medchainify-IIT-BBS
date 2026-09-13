"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MdOutlineHome, MdCampaign } from "react-icons/md";
import { TbPrescription } from "react-icons/tb";
import { LuMicroscope } from "react-icons/lu";
import { TbReceiptRupee } from "react-icons/tb"; // ₹ rupee — India-specific!
import { TbPill } from "react-icons/tb";
import { MdOutlineLocalHospital } from "react-icons/md";
import { FaUserDoctor, FaHandHoldingHeart } from "react-icons/fa6";
import { FaHeartbeat } from "react-icons/fa";
import { LuStethoscope } from "react-icons/lu";
import { TbWritingSign } from "react-icons/tb";
import { GiSprout } from "react-icons/gi"; // Ayurveda/herbal
import { MdOutlineBadge } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { MdPersonAddAlt1 } from "react-icons/md";
import { LuLogOut, LuApple } from "react-icons/lu";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DockNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [hasNgo, setHasNgo] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/ngo")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.ngo) {
            setHasNgo(true);
          }
        })
        .catch((err) => console.error("Error checking NGO in DockNav:", err));
    }
  }, [status]);

  const navItems = [
    {
      name: "Home",
      icon: MdOutlineHome,
      href: "/",
      show: true,
    },
    {
      name: "Prescription Analyzer",
      icon: TbPrescription, // Actual Rx prescription pad icon
      href: "/analyze-prescription",
      show: status === "authenticated",
    },
    {
      name: "Lab Report Analyzer",
      icon: LuMicroscope, // Microscope = lab testing
      href: "/analyze-report",
      show: status === "authenticated",
    },
    {
      name: "Bill Analyzer",
      icon: TbReceiptRupee, // Receipt with ₹ — India telemedicine context
      href: "/analyze-bill",
      show: status === "authenticated",
    },
    {
      name: "Medicines",
      icon: TbPill,
      href: "/medicines",
      show: status === "authenticated",
    },
    {
      name: "Nearby Care",
      icon: MdOutlineLocalHospital, // Red cross hospital mark
      href: "/nearby-hospitals",
      show: status === "authenticated",
    },
    {
      name: "Doctors",
      icon: FaUserDoctor, // Doctor silhouette with coat
      href: "/doctors",
      show: status === "authenticated",
    },
    {
      name: "Find Doctor",
      icon: LuStethoscope, // Clean Lucide stethoscope
      href: "/find-doctor",
      show: status === "authenticated",
    },
    {
      name: "Write Prescription",
      icon: TbWritingSign, // Writing with a medical pen
      href: "/write-prescription",
      show:
        status === "authenticated" && (session?.user as any)?.role === "doctor",
    },
    {
      name: "Ayush Consult",
      icon: GiSprout, // Game-icons sprout — Ayurveda/natural medicine
      href: "/ayush-consult",
      show: status === "authenticated",
    },
    {
      name: "Care Coordinator",
      icon: FaHeartbeat,
      href: "/care-coordinator",
      show: status === "authenticated",
    },
    {
      name: "Diet Chart",
      icon: LuApple,
      href: "/diet-chart",
      show: status === "authenticated",
    },
    {
      name: "Campaigns",
      icon: MdCampaign,
      href: "/campaigns",
      show: true,
    },
    {
      name: hasNgo ? "NGO Dashboard" : "Create NGO",
      icon: FaHandHoldingHeart, // Charity and giving icon for NGO
      href: hasNgo ? "/ngo-dashboard" : "/create-ngo",
      show: status === "authenticated",
    },
    {
      name: "Easy Card",
      icon: MdOutlineBadge, // Health ID badge / health card
      href: "/easy-card",
      show: status === "authenticated",
    },
    {
      name: "Profile",
      icon: CgProfile, // Clean circular profile
      href: "/profile",
      show: status === "authenticated",
    },
    {
      name: "Sign Up",
      icon: MdPersonAddAlt1, // Person with + sign = creating account
      href: "/auth",
      show: status === "unauthenticated",
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border-2 border-slate-900 shadow-xl dark:bg-black/80 dark:border-slate-100">
        {navItems.map((item) => {
          if (!item.show) return null;
          const isActive = pathname === item.href;

          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <DockItem item={item} isActive={isActive} isButton={false} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {status === "authenticated" && (
          <>
            <div className="w-1 rounded-md h-6 bg-blue-800 dark:bg-white mx-2" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => signOut()}>
                  <DockItem
                    item={{ name: "Logout", icon: LuLogOut }}
                    isActive={false}
                    isButton
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}

function DockItem({
  item,
  isActive,
  isButton = false,
}: {
  item: any;
  isActive: boolean;
  isButton?: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div
        whileHover={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "p-3 rounded-full transition-colors",
          isActive
            ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          isButton &&
            "text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
        )}
      >
        <Icon size={24} />
      </motion.div>
      {isActive && (
        <motion.div
          layoutId="activeDot"
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-sky-900 dark:bg-sky-400"
        />
      )}
    </div>
  );
}
