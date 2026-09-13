"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FaApple,
  FaChevronLeft,
  FaWeight,
  FaUser,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaFire,
  FaAward,
  FaMagic,
  FaUtensils,
  FaLightbulb,
  FaCheckCircle,
  FaFilePdf,
  FaDownload,
} from "react-icons/fa";
import { MdLocationOn, MdClose } from "react-icons/md";
import { FiActivity } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";
import { toast } from "react-toastify";
import { exportDietChartPdf } from "@/lib/diet-pdf-generator";

// Indian regional cuisines list, fully sorted alphabetically
const INDIAN_CUISINES = [
  "Andhra Cuisine",
  "Assamese Cuisine",
  "Awadhi Cuisine",
  "Bengali Cuisine",
  "Bihari Cuisine",
  "Chettinad Cuisine",
  "Goan Cuisine",
  "Gujarati Cuisine",
  "Himachali Cuisine",
  "Hyderabadi Cuisine",
  "Kashmiri Cuisine",
  "Kathiawadi Cuisine",
  "Konkani Cuisine",
  "Kumaoni Cuisine",
  "Maharashtrian Cuisine",
  "Malabar Cuisine",
  "Manipuri Cuisine",
  "Meghalayan Cuisine",
  "Mizo Cuisine",
  "Naga Cuisine",
  "Odia Cuisine",
  "Parsi Cuisine",
  "Punjabi Cuisine",
  "Rajasthani Cuisine",
  "Saraswat Cuisine",
  "Sindhi Cuisine",
  "Tamil Nadu Cuisine",
  "Tripuri Cuisine",
  "Udupi Cuisine",
  "Uttar Pradesh Cuisine",
];

// Target Diet Goals
const DIET_GOALS = [
  {
    id: "Weight Loss",
    label: "Weight Loss",
    desc: "Reduce overall body fat while maintaining lean muscle",
  },
  {
    id: "Weight Gain",
    label: "Weight Gain",
    desc: "Gain healthy mass and weight in a structured way",
  },
  {
    id: "Weight Maintenance",
    label: "Weight Maintenance",
    desc: "Keep current body weight while improving general health",
  },
  {
    id: "General Fitness",
    label: "General Fitness",
    desc: "Build cardiovascular strength and general stamina",
  },
  {
    id: "Muscle Building",
    label: "Muscle Building",
    desc: "Increase lean muscle fiber mass and strength",
  },
  {
    id: "Disease Management",
    label: "Disease Management",
    desc: "Follow targeted eating guidelines to manage health parameters",
  },
];

export default function DietChartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Profile data fetch state
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Form parameters
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("0.0");
  const [diet, setDiet] = useState("veg");
  const [diseases, setDiseases] = useState<string[]>([]);
  const [goal, setGoal] = useState("General Fitness");
  const [cuisine, setCuisine] = useState("Standard Indian");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Allergy tags state
  const [allergyInput, setAllergyInput] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);

  // Generator action states
  const [generating, setGenerating] = useState(false);
  const [minLoadingPassed, setMinLoadingPassed] = useState(false);
  const [result, setResult] = useState<any>(null);

  // 7-day cooldown maintenance states
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownDays, setCooldownDays] = useState(7);
  const [cooldownHours, setCooldownHours] = useState(168);
  const [showCooldownModal, setShowCooldownModal] = useState(false);

  // Selected result view day tab (day1 - day7)
  const [selectedDay, setSelectedDay] = useState("day1");

  // Redirect if unauthorized
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Fetch Profile details
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        if (data) {
          setName(data.name || "");
          setGender(data.gender || "male");
          setWeight(data.weight ? String(data.weight) : "");

          if (data.height) {
            setHeightFeet(data.height.feet ? String(data.height.feet) : "");
            setHeightInches(
              data.height.inches ? String(data.height.inches) : "",
            );
          }

          setDiet(data.diet || "veg");
          setDiseases(data.diseases || []);
          setCity(data.city || "");
          setState(data.state || "");

          if (data.age?.years) {
            setAge(String(data.age.years));
          } else if (data.dob) {
            const birthDate = new Date(data.dob);
            const today = new Date();
            let ageY = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              ageY--;
            }
            setAge(String(ageY));
          }

          if (data.easyCard?.allergies) {
            setAllergies(data.easyCard.allergies);
          }

          if (data.dietChart) {
            setResult(data.dietChart);

            // Check 7-day diet maintenance period
            const chartDateStr =
              data.dietChart.updatedAt || data.dietChart.createdAt;
            if (chartDateStr) {
              const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
              const chartTime = new Date(chartDateStr).getTime();
              const elapsed = Date.now() - chartTime;

              if (elapsed < SEVEN_DAYS_MS) {
                const remainingMs = SEVEN_DAYS_MS - elapsed;
                const days = Math.max(
                  1,
                  Math.ceil(remainingMs / (1000 * 60 * 60 * 24)),
                );
                const hours = Math.max(
                  1,
                  Math.ceil(remainingMs / (1000 * 60 * 60)),
                );
                setCooldownDays(days);
                setCooldownHours(hours);
                setCooldownActive(true);
              }
            }
          }
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        toast.error("Could not fetch profile details.");
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, [status]);

  // Auto calculate BMI when weight/height changes
  useEffect(() => {
    const wKg = parseFloat(weight);
    const hFt = parseFloat(heightFeet);
    const hIn = parseFloat(heightInches) || 0;

    if (wKg > 0 && hFt > 0) {
      // Total height in inches
      const totalInches = hFt * 12 + hIn;
      // Convert to meters
      const heightMeters = totalInches * 0.0254;

      if (heightMeters > 0) {
        const calculatedBmi = wKg / (heightMeters * heightMeters);
        setBmi(calculatedBmi.toFixed(1));
      } else {
        setBmi("0.0");
      }
    } else {
      setBmi("0.0");
    }
  }, [weight, heightFeet, heightInches]);

  // Allergen input key handlers
  const addAllergy = useCallback(
    (val: string) => {
      const trimmed = val.replace(/,/g, "").trim();
      if (trimmed && !allergies.includes(trimmed)) {
        setAllergies((prev) => [...prev, trimmed]);
      }
      setAllergyInput("");
    },
    [allergies],
  );

  const handleAllergyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAllergy(allergyInput);
    }
  };

  const handleAllergyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(",")) {
      addAllergy(value);
    } else {
      setAllergyInput(value);
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies((prev) => prev.filter((_, idx) => idx !== index));
  };

  const [exportingPdf, setExportingPdf] = useState(false);

  // Export 7-Day Diet Chart to Monospace Black & White PDF
  const handleExportPdf = (customPlan?: any) => {
    const activeData = customPlan || result || profile?.dietChart;
    if (!activeData || !activeData.dietPlan) {
      toast.error("No diet plan available to export");
      return;
    }

    setExportingPdf(true);
    try {
      exportDietChartPdf({
        userProfile: {
          name: name || profile?.name || session?.user?.name || "Patient",
          email: session?.user?.email || profile?.email || "patient@medchainify.org",
          userId: profile?._id ? String(profile._id) : (session?.user as any)?.id || "VERIFIED-VAULT-DIRECT",
          age: age || profile?.age?.years || "",
          gender: gender || profile?.gender || "male",
          height: heightFeet
            ? `${heightFeet}ft ${heightInches ? `${heightInches}in` : ""}`.trim()
            : profile?.height
            ? `${profile.height.feet}ft ${profile.height.inches || 0}in`
            : "Not Specified",
          weight: weight || profile?.weight || "Not Specified",
          bmi: bmi || profile?.bmi || "0.0",
          city: city || profile?.city || "Not Specified",
          state: state || profile?.state || "Not Specified",
          diet: diet || profile?.diet || "veg",
          goal: goal || "General Fitness",
          cuisine: cuisine || "Standard Indian",
          diseases: diseases.length > 0 ? diseases : profile?.diseases || [],
          allergies: allergies.length > 0 ? allergies : profile?.easyCard?.allergies || [],
        },
        summary: activeData.summary || {},
        dietPlan: activeData.dietPlan || {},
        generatedAt: activeData.updatedAt || activeData.createdAt || new Date(),
      });
      toast.success("7-Day Diet Chart exported to formal PDF successfully!");
    } catch (error: any) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to generate PDF export. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  // Submit form trigger
  const handleGenerate = async () => {
    if (cooldownActive) {
      setShowCooldownModal(true);
      return;
    }

    if (!name.trim()) {
      toast.error("Name field cannot be empty");
      return;
    }
    if (!age || parseInt(age) <= 0) {
      toast.error("Please enter a valid age");
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }
    if (!heightFeet || parseInt(heightFeet) <= 0) {
      toast.error("Please specify your height in feet");
      return;
    }

    setGenerating(true);

    const run = async () => {
      const response = await fetch("/api/diet-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age: parseInt(age),
          gender,
          height: `${heightFeet}ft ${heightInches ? heightInches + "in" : ""}`,
          weight: parseFloat(weight),
          bmi: parseFloat(bmi),
          diet,
          diseases,
          goal,
          cuisine,
          city,
          state,
          allergies,
        }),
      });

      if (response.status === 429) {
        const errorData = await response.json();
        if (errorData.remainingDays) setCooldownDays(errorData.remainingDays);
        if (errorData.remainingHours)
          setCooldownHours(errorData.remainingHours);
        if (errorData.dietChart) setResult(errorData.dietChart);
        setCooldownActive(true);
        setShowCooldownModal(true);
        throw new Error(
          errorData.message ||
            "Please maintain your current diet plan for 7 days!",
        );
      }

      if (!response.ok) {
        throw new Error("Failed to generate diet chart");
      }

      const data = await response.json();
      setResult(data);
      setCooldownActive(true);
      setCooldownDays(7);
      setCooldownHours(168);
      return data;
    };

    toast
      .promise(run(), {
        pending: "Analyzing biological metrics & drafting nutrition grids...",
        success: "Diet Chart crafted successfully!",
        error: {
          render({ data }: any) {
            return data?.message || "Failed to customize diet plan";
          },
        },
      })
      .finally(() => setGenerating(false));
  };

  if (status === "loading" || loadingProfile) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <TetrisLoading size="lg" speed="normal" showLoadingText={false} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-start p-4 pt-12 pb-32 relative">
      <BackgroundPattern />

      <div className="w-full max-w-[90%] space-y-12">
        {/* HEADER */}
        <div className="text-center space-y-3 relative">
          <button
            onClick={() => {
              if (result) {
                if (cooldownActive) {
                  setShowCooldownModal(true);
                } else {
                  setResult(null);
                }
              } else {
                router.push("/profile");
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 text-slate-700 hover:text-slate-900 uppercase tracking-widest text-[10px] transition-all border-2 border-slate-900 rounded-xl px-4 h-10 bg-white shadow-sm font-bold active:scale-95 cursor-pointer"
          >
            <FaChevronLeft className="h-4 w-4 mr-1" />
            {result
              ? cooldownActive
                ? "Maintenance Status"
                : "Change Parameters"
              : "Dashboard"}
          </button>

          {result && (
            <button
              onClick={() => handleExportPdf()}
              disabled={exportingPdf}
              className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white uppercase tracking-widest text-[10px] transition-all border-2 border-slate-900 rounded-xl px-4 h-10 shadow-sm font-black active:scale-95 cursor-pointer disabled:opacity-70"
            >
              <FaDownload className="h-3.5 w-3.5" />
              <span>{exportingPdf ? "Generating PDF..." : "Export Formal PDF"}</span>
            </button>
          )}

          <h1 className="text-3xl md:text-5xl text-slate-900 uppercase tracking-widest font-black">
            DIET CHART <span className="text-sky-900 font-black">MAKER</span>
          </h1>
          <p className="text-slate-500 tracking-wider max-w-xl mx-auto text-sm">
            AI-driven metabolic meal matrices tailored to your local
            environment, physiology, and fitness goal
          </p>
        </div>

        {/* ── DIET PLAN RESULT PRESENTATION SCREEN ── */}
        {result ? (
          <div className="space-y-10">
            {/* Diet Metrics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-2 border-slate-900 bg-white/95 shadow-md rounded-2xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-sky-50 border-2 border-slate-900 flex items-center justify-center text-sky-900 shadow-sm shrink-0">
                    <FaFire className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Daily Calorie Target
                    </h3>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {result.summary.dailyCaloriesTarget} kcal
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-900 bg-white/95 shadow-md rounded-2xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 border-2 border-slate-900 flex items-center justify-center text-emerald-800 shadow-sm shrink-0">
                    <FaAward className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Macronutrient Ratio
                    </h3>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {result.summary.macroRatio}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-900 bg-white/95 shadow-md rounded-2xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 border-2 border-slate-900 flex items-center justify-center text-amber-800 shadow-sm shrink-0">
                    <FiActivity className="h-6 w-6 text-amber-800" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Hydration target
                    </h3>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {result.summary.hydrationGoal}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-slate-900 bg-white/95 shadow-md rounded-2xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-50 border-2 border-slate-900 flex items-center justify-center text-purple-800 shadow-sm shrink-0">
                    <FaMagic className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Dietary Profile
                    </h3>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">
                      {diet} • {goal}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nutritionist Recommendation Box */}
            <div className="bg-white border-2 border-slate-900 p-6 rounded-2xl shadow-md flex items-start gap-4">
              <div className="h-10 w-10 bg-sky-50 border-2 border-slate-900 rounded-lg flex items-center justify-center text-sky-850 shrink-0 mt-0.5">
                <FaInfoCircle className="h-5 w-5 text-sky-900" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Nutritionist Strategy Memo
                </h4>
                <p className="text-slate-700 text-sm leading-relaxed font-semibold">
                  {result.summary.personalRecommendation}
                </p>
              </div>
            </div>

            {/* DAY SELECTOR TABS */}
            <div className="flex flex-wrap gap-2.5 justify-center">
              {Object.keys(result.dietPlan).map((dayKey) => {
                const dayNum = parseInt(dayKey.replace("day", ""));
                const isSelected = selectedDay === dayKey;
                const isCheat = result.dietPlan[dayKey].isCheatDay;

                return (
                  <button
                    key={dayKey}
                    onClick={() => setSelectedDay(dayKey)}
                    className={`px-5 py-3 rounded-xl border-2 text-xs uppercase font-bold tracking-widest transition-all cursor-pointer shadow-sm active:scale-95 ${
                      isSelected
                        ? "bg-sky-900 border-slate-900 text-white shadow-md"
                        : isCheat
                          ? "bg-rose-50 hover:bg-rose-100/80 border-slate-900 text-rose-900"
                          : "bg-white hover:bg-slate-50 border-slate-900 text-slate-800"
                    }`}
                  >
                    {isCheat ? `Day ${dayNum} (Cheat Day)` : `Day ${dayNum}`}
                  </button>
                );
              })}
            </div>

            {/* MEALS GRID FOR SELECTED DAY */}
            {(() => {
              const dayMeals = result.dietPlan[selectedDay];
              const isCheat = dayMeals.isCheatDay;
              const mealSlots = ["breakfast", "lunch", "snacks", "dinner"];

              return (
                <div className="space-y-6">
                  {isCheat && (
                    <div className="bg-rose-50 border-2 border-slate-900 text-slate-950 p-4 rounded-xl flex items-center gap-3 w-fit mx-auto shadow-md">
                      <FaInfoCircle className="h-5 w-5 text-rose-700 shrink-0" />
                      <p className="text-xs uppercase font-extrabold tracking-widest">
                        Day 7 Cheat Day: Clean cheat suggestions enabled. Enjoy
                        responsibly!
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mealSlots.map((slot) => {
                      const mealInfo = dayMeals[slot];
                      if (!mealInfo) return null;

                      // Assign color accents for slots
                      const slotColors: Record<string, string> = {
                        breakfast:
                          "border-b-2 border-slate-900 bg-sky-50 text-sky-900",
                        lunch:
                          "border-b-2 border-slate-900 bg-emerald-50 text-emerald-800",
                        snacks:
                          "border-b-2 border-slate-900 bg-amber-50 text-amber-800",
                        dinner:
                          "border-b-2 border-slate-900 bg-purple-50 text-purple-800",
                      };

                      return (
                        <Card
                          key={slot}
                          className={`border-2 border-slate-900 rounded-3xl overflow-hidden bg-white shadow-md flex flex-col justify-between transition-all hover:shadow-lg ${
                            isCheat ? "ring-2 ring-rose-500/20" : ""
                          }`}
                        >
                          <div>
                            {/* Card Header Tag */}
                            <div
                              className={`px-4 py-3.5 flex items-center justify-between font-bold ${slotColors[slot]}`}
                            >
                              <span className="text-xs font-black uppercase tracking-widest">
                                {slot}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2 py-0.5 rounded border-2 border-slate-900 shadow-xs">
                                {mealInfo.calories} kcal
                              </span>
                            </div>

                            {/* Meals List */}
                            <div className="p-6 space-y-4 text-left">
                              <ul className="space-y-2">
                                {mealInfo.meals.map(
                                  (item: string, idx: number) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2.5"
                                    >
                                      <div className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center text-emerald-600 bg-emerald-50/50 shrink-0 mt-0.5">
                                        <FaCheck className="h-2.5 w-2.5" />
                                      </div>
                                      <span className="text-xs font-semibold text-slate-800 leading-normal">
                                        {item}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          </div>

                          {/* Nutrition Notes */}
                          <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic flex items-start gap-1 text-left">
                              <FaLightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              <span>{mealInfo.notes}</span>
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Back Form Trigger & Save Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (cooldownActive) {
                    setShowCooldownModal(true);
                  } else {
                    setResult(null);
                  }
                }}
                className="bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-800 shadow-md text-xs uppercase tracking-widest font-black px-6 py-4 rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                {cooldownActive
                  ? "7-Day Maintenance Active"
                  : "Modify biological filters"}
              </button>

              <button
                onClick={() => handleExportPdf()}
                disabled={exportingPdf}
                className="bg-sky-900 hover:bg-slate-900 text-white border-2 border-slate-900 shadow-md text-xs uppercase tracking-widest font-black px-6 py-4 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 disabled:opacity-70"
              >
                <FaFilePdf className="w-4 h-4 text-white shrink-0" />
                <span>{exportingPdf ? "Exporting PDF..." : "Export Formal PDF (7-Day Plan)"}</span>
              </button>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-slate-900 text-emerald-900 dark:text-emerald-300 shadow-md text-xs uppercase tracking-wider font-black px-6 py-4 rounded-xl flex items-center gap-2">
                <FaCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Auto-Saved to Profile (
                  {result?.updatedAt || result?.createdAt
                    ? new Date(
                        result.updatedAt || result.createdAt,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Active Plan"}
                  )
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ── USER PREFILL & CUSTOMIZATION FORM SCREEN ── */
          <div className="space-y-8">
            {/* COOLDOWN ACTIVE BANNER ON FORM */}
            {cooldownActive && (
              <div className="bg-amber-50 border-2 border-slate-900 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md max-w-4xl mx-auto">
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-11 h-11 bg-amber-100 border-2 border-slate-900 rounded-xl flex items-center justify-center text-amber-900 shrink-0">
                    <FaCalendarAlt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      7-Day Diet Maintenance Active
                    </h4>
                    <p className="text-[11px] text-slate-700 font-semibold leading-snug">
                      Maintain your active diet plan for 7 days before
                      generating a new chart. Next creation unlocks in{" "}
                      <strong>
                        {cooldownDays} day{cooldownDays > 1 ? "s" : ""}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCooldownModal(true)}
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white text-[10px] uppercase tracking-widest font-black rounded-xl border-2 border-slate-900 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  View Diet Plan
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left/Middle: General Forms Card */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-2 border-slate-900 shadow-md rounded-[2rem] bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-8 space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-900">
                      <div className="h-10 w-10 bg-slate-50 border-2 border-slate-900 rounded-lg flex items-center justify-center text-sky-900">
                        <FaUser className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg text-slate-900 uppercase font-black tracking-wider">
                          Physiological Parameters
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                          These parameters dictate baseline caloric
                          recommendations
                        </p>
                      </div>
                    </div>

                    {/* Profile inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* User Name */}
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          Name
                        </label>
                        <input
                          value={name}
                          disabled
                          placeholder="Your full name"
                          className="w-full h-12 bg-slate-100 border-2 border-slate-900 rounded-xl px-4 text-slate-500 font-bold cursor-not-allowed select-none focus:outline-none"
                        />
                      </div>

                      {/* Age */}
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          Age (Years)
                        </label>
                        <input
                          value={age}
                          type="number"
                          disabled
                          placeholder="Age"
                          className="w-full h-12 bg-slate-100 border-2 border-slate-900 rounded-xl px-4 text-slate-500 font-bold cursor-not-allowed select-none focus:outline-none"
                        />
                      </div>

                      {/* Gender select */}
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          Gender
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {["male", "female", "non binary"].map((g) => {
                            const isSelected = gender === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                disabled
                                className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-not-allowed shadow-sm ${
                                  isSelected
                                    ? "bg-sky-900/80 border-slate-900 text-white opacity-90"
                                    : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Height input feet & inches */}
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          Height
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={heightFeet}
                            type="number"
                            onChange={(e) => setHeightFeet(e.target.value)}
                            placeholder="Feet"
                            className="w-full h-12 bg-white border-2 border-slate-900 rounded-xl px-4 text-slate-900 focus:outline-none focus:border-sky-900 transition-all text-sm font-bold"
                          />
                          <input
                            value={heightInches}
                            type="number"
                            onChange={(e) => setHeightInches(e.target.value)}
                            placeholder="Inches"
                            className="w-full h-12 bg-white border-2 border-slate-900 rounded-xl px-4 text-slate-900 focus:outline-none focus:border-sky-900 transition-all text-sm font-bold"
                          />
                        </div>
                      </div>

                      {/* Weight (Kg) */}
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          Weight (KG)
                        </label>
                        <div className="relative">
                          <input
                            value={weight}
                            type="number"
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="Weight in kg"
                            className="w-full h-12 bg-white border-2 border-slate-900 rounded-xl pl-4 pr-10 text-slate-900 focus:outline-none focus:border-sky-900 transition-all text-sm font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-900">
                            KG
                          </span>
                        </div>
                      </div>

                      {/* Automated BMI Blocked Input Box */}
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          Calculated BMI
                        </label>
                        <div className="relative">
                          <input
                            value={bmi}
                            disabled
                            className="w-full h-12 bg-slate-100 border-2 border-slate-900 rounded-xl px-4 text-slate-550 font-black cursor-not-allowed select-none focus:outline-none"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-900">
                            INDEX
                          </span>
                        </div>

                        {/* BMI Status Classification Badge */}
                        {parseFloat(bmi) > 0 && (
                          <div className="pt-1 flex items-center">
                            {(() => {
                              const val = parseFloat(bmi);
                              if (val < 18.5) {
                                return (
                                  <span className="text-[9px] uppercase font-black tracking-wider text-amber-700 bg-amber-50 border-2 border-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                                    Low (Underweight)
                                  </span>
                                );
                              } else if (val >= 18.5 && val < 25) {
                                return (
                                  <span className="text-[9px] uppercase font-black tracking-wider text-emerald-700 bg-emerald-50 border-2 border-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                                    Normal
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-[9px] uppercase font-black tracking-wider text-rose-700 bg-rose-50 border-2 border-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                                    High (Overweight)
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Environment Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          City
                        </label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Hyderabad"
                          disabled
                          className="w-full h-12 bg-slate-100 border-2 border-slate-900 rounded-xl px-4 text-slate-900 focus:outline-none focus:border-sky-900 transition-all text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                          State
                        </label>
                        <input
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          disabled
                          placeholder="e.g. Telangana"
                          className="w-full h-12 bg-slate-100 border-2 border-slate-900 rounded-xl px-4 text-slate-900 focus:outline-none focus:border-sky-900 transition-all text-sm font-bold"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preferences and Allergens Card */}
                <Card className="border-2 border-slate-900 shadow-md rounded-[2rem] bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-8 space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-900">
                      <div className="h-10 w-10 bg-slate-50 border-2 border-slate-900 rounded-lg flex items-center justify-center text-sky-900">
                        <FaUtensils className="h-5 w-5 text-sky-900" />
                      </div>
                      <div>
                        <h2 className="text-lg text-slate-900 uppercase font-black tracking-wider">
                          Dietary Curation
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                          Define your diet filters and ingredients constraints
                        </p>
                      </div>
                    </div>

                    {/* Veg / Non-Veg Select */}
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                        Diet Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["veg", "non veg", "jain"].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDiet(d)}
                            className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-sm ${
                              diet === d
                                ? "bg-sky-900 border-slate-900 text-white"
                                : "bg-white hover:bg-slate-50 border-slate-900 text-slate-700"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comma separated Allergies tags input */}
                    <div className="space-y-3 text-left">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                        Allergens / Ingredients to Avoid{" "}
                        <span className="text-[8px] text-slate-400 lowercase">
                          (comma or enter separated)
                        </span>
                      </label>
                      <input
                        value={allergyInput}
                        onKeyDown={handleAllergyKeyDown}
                        onChange={handleAllergyChange}
                        placeholder="e.g. Peanuts, Dairy, Gluten..."
                        className="w-full h-12 bg-white border-2 border-slate-900 rounded-xl px-4 text-slate-900 focus:outline-none focus:border-sky-900 transition-all text-sm font-bold"
                      />

                      {/* Allergies Badges Preview */}
                      {allergies.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {allergies.map((allergy, index) => (
                            <div
                              key={index}
                              className="bg-rose-50 text-rose-700 border-2 border-slate-900 px-3.5 py-1.5 rounded-full text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 shadow-sm"
                            >
                              <span>{allergy}</span>
                              <button
                                type="button"
                                onClick={() => removeAllergy(index)}
                                className="text-rose-750 hover:text-rose-500 rounded-full focus:outline-none cursor-pointer"
                              >
                                <FaTimes className="h-3 w-3 shrink-0" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Goals and Indian Cuisine Curation */}
              <div className="space-y-8">
                {/* Cuisines Curation Card */}
                <Card className="border-2 border-slate-900 shadow-md rounded-[2rem] bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-slate-900">
                      <div className="h-10 w-10 bg-slate-50 border-2 border-slate-900 rounded-lg flex items-center justify-center text-sky-900">
                        <FaAward className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg text-slate-900 uppercase font-black tracking-wider">
                          Cuisine & Goal
                        </h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                          Determine the recipe base and calories target
                        </p>
                      </div>
                    </div>

                    {/* Goal Dropdown Selection */}
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                        Primary Goal
                      </label>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="w-full h-12 bg-white border-2 border-slate-900 rounded-xl px-4 text-xs font-bold outline-none shadow-sm focus:border-sky-900 transition-all cursor-pointer"
                      >
                        {DIET_GOALS.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      {/* Display descriptor of selected Goal */}
                      <div className="p-3.5 bg-slate-50 border-2 border-slate-900 rounded-xl">
                        <p className="text-[10px] text-slate-500 leading-normal font-bold">
                          {DIET_GOALS.find((g) => g.id === goal)?.desc}
                        </p>
                      </div>
                    </div>

                    {/* Cuisines of India dropdown (Alphabetical) */}
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                        Indian Cuisine Style
                      </label>
                      <select
                        value={cuisine}
                        onChange={(e) => setCuisine(e.target.value)}
                        className="w-full h-12 bg-white border-2 border-slate-900 rounded-xl px-4 text-xs font-bold outline-none shadow-sm focus:border-sky-900 transition-all cursor-pointer"
                      >
                        <option value="Standard Indian">
                          Standard Indian Cuisines
                        </option>
                        {INDIAN_CUISINES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Prefilled Diseases Alert */}
                {diseases.length > 0 && (
                  <Card className="border-2 border-slate-900 bg-amber-50 shadow-md rounded-2xl">
                    <CardContent className="p-5 space-y-2 text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <FaInfoCircle className="h-4 w-4 text-amber-900" />
                        Prefilled Diseases / Conditions
                      </h4>
                      <p className="text-[10px] text-amber-900 leading-normal font-black">
                        Your clinical conditions are retrieved from your health
                        profile. The AI model will customize recipes
                        specifically to avoid exacerbating these parameters:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {diseases.map((d, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-white text-slate-900 font-black tracking-wider uppercase px-2.5 py-0.5 rounded border-2 border-slate-900"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submit Action Grid */}
                <div className="pt-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full py-4 rounded-xl bg-sky-900 hover:bg-sky-850 text-white border-2 border-slate-900 shadow-md uppercase tracking-widest font-black text-xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {generating
                      ? "Analyzing biological metrics..."
                      : cooldownActive
                        ? "7-Day Maintenance Active"
                        : "Generate Diet Plan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7-DAY DIET MAINTENANCE COOLDOWN POPUP MODAL */}
      <AnimatePresence>
        {showCooldownModal && (
          <div className="fixed inset-0 z-2000 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowCooldownModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 p-2 rounded-full transition-colors cursor-pointer"
              >
                <MdClose className="w-6 h-6" />
              </button>

              {/* Header Icon */}
              <div className="w-16 h-16 bg-amber-50 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-amber-800 mx-auto shadow-md">
                <FaCalendarAlt className="w-8 h-8" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <span className="inline-block text-[9px] bg-amber-100 text-amber-900 font-black px-3 py-1 rounded-full uppercase tracking-widest border border-amber-300">
                  7-Day Maintenance Active
                </span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Maintain Your Diet Plan
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Please maintain your current personalized diet chart for{" "}
                  <strong>at least 7 days</strong> before creating a new one.
                  Your body needs time to adapt to this metabolic routine!
                </p>
              </div>

              {/* Countdown Card */}
              <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-2xl space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                  Next Creation Unlocks In
                </p>
                <p className="text-2xl font-black text-sky-900 font-mono">
                  {cooldownDays} {cooldownDays === 1 ? "Day" : "Days"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {(result || profile?.dietChart) && (
                  <>
                    <button
                      onClick={() => {
                        setShowCooldownModal(false);
                        if (profile?.dietChart) {
                          setResult(profile.dietChart);
                        }
                      }}
                      className="w-full py-3.5 bg-sky-900 hover:bg-sky-850 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md border-2 border-slate-900 active:scale-95 transition-all cursor-pointer"
                    >
                      View Active 7-Day Diet Plan
                    </button>

                    <button
                      onClick={() => handleExportPdf(result || profile?.dietChart)}
                      disabled={exportingPdf}
                      className="w-full py-3 bg-white hover:bg-slate-50 text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl shadow-sm border-2 border-slate-900 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      <FaFilePdf className="w-4 h-4 text-slate-900 shrink-0" />
                      <span>{exportingPdf ? "Exporting PDF..." : "Download Active Plan (PDF)"}</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowCooldownModal(false)}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[10px] rounded-xl border-2 border-slate-900 cursor-pointer shadow-xs active:scale-95 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
