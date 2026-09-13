"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BackgroundPattern from "@/components/BackgroundPattern";
import { FcGoogle } from "react-icons/fc";
import TetrisLoading from "@/components/ui/tetris-loader";
import { motion } from "framer-motion";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (status !== "authenticated") return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && countdown === 0) {
      router.push("/profile");
    }
  }, [countdown, status, router]);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      await signIn("google", { callbackUrl: "/profile" });
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <TetrisLoading
          size="lg"
          speed="normal"
          showLoadingText={true}
          loadingText="Authenticating session..."
        />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex min-h-[85vh] items-center justify-center p-4">
        <BackgroundPattern />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 180 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-slate-900 dark:border-slate-800 shadow-2xl rounded-[2.5rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden text-center">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b-2 border-slate-900 dark:border-slate-800 py-6 px-8 flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                Session Authenticated
              </span>
            </div>

            <CardContent className="p-8 space-y-6">
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {session?.user?.name || "Authenticated User"}
                </h3>
                {session?.user?.email && (
                  <p className="text-xs text-slate-500 font-mono font-medium truncate">
                    {session.user.email}
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-900 dark:border-slate-700 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Redirecting to Profile in
                </p>
                <div className="text-3xl font-black text-sky-900 dark:text-sky-400 font-mono">
                  {countdown}s
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-900/10">
                  <div
                    className="h-full bg-sky-900 dark:bg-sky-400 transition-all duration-1000 ease-linear"
                    style={{ width: `${(countdown / 10) * 100}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="group w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs bg-sky-900 hover:bg-sky-850 text-white border-2 border-slate-900 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Go to Profile
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <BackgroundPattern />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 180 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-slate-900 dark:border-slate-800 shadow-2xl rounded-[2.5rem] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden p-8 sm:p-10 space-y-8 text-center">
          {/* LOGO & HEADING */}
          <div className="space-y-3 flex flex-col items-center">
            <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/70 border-2 border-slate-900 dark:border-slate-700 rounded-3xl flex items-center justify-center text-sky-900 dark:text-sky-400 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Med<span className="text-sky-900 dark:text-sky-400">Chain</span>Ify
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1">
                Unified Healthcare Authentication & Clinical Vault
              </p>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="space-y-4 pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
              className="w-full h-13 flex items-center justify-center gap-3 rounded-2xl px-6 font-black uppercase tracking-wider text-xs sm:text-sm bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-900 dark:border-slate-700 shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
            >
              <FcGoogle className="text-2xl shrink-0 group-hover:scale-110 transition-transform" />
              <span>
                {loadingGoogle ? "Connecting..." : "Continue with Google"}
              </span>
            </button>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
              By continuing, you agree to our{" "}
              <a
                href="/terms-of-service"
                className="text-sky-900 dark:text-sky-400 underline font-bold hover:text-sky-700"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="/privacy-policy"
                className="text-sky-900 dark:text-sky-400 underline font-bold hover:text-sky-700"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
