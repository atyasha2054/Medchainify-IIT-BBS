"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import Image from "next/image";
import BackgroundPattern from "@/components/BackgroundPattern";
import TetrisLoading from "@/components/ui/tetris-loader";
import SignOutButton from "@/components/SignOutButton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TbPencil as Pencil,
  TbDeviceFloppy as Save,
  TbX as X,
  TbMap as MapIcon,
  TbBuilding as Building2,
  TbMapPin as MapPin,
  TbUser as User,
  TbGenderMale as VenusAndMars,
  TbMapPin as MapPinned,
  TbMail as Mail,
  TbActivity as Activity,
  TbUserCircle as UserCircle,
  TbBriefcase as Briefcase,
  TbFileReport as FileBarChart,
  TbChevronRight as ChevronRight,
  TbCalendar as Calendar,
  TbPill as Pill,
  TbLoader2 as Loader2,
  TbPlant as Flower2,
  TbStethoscope as Stethoscope,
  TbDroplet as Droplet,
  TbTrash as Trash,
} from "react-icons/tb";
import { BiLoaderAlt } from "react-icons/bi";
import {
  FaApple,
  FaFire,
  FaAward,
  FaMagic,
  FaCheck,
  FaInfoCircle,
  FaLightbulb,
} from "react-icons/fa";
import { indianStatesAndCities } from "@/lib/states";
import { validatePincode } from "@/lib/pincode-validator";
import { cn } from "@/lib/utils";
import CompleteProfileSheet from "@/components/CompleteProfileSheet";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    state: "",
    city: "",
    pincode: "",
    weight: "",
    height: { feet: "", inches: "" },
    diet: "",
    bloodGroup: "",
    diseases: [] as string[],
    mobile: "",
    specialization: "",
    dob: "",
  });

  const availableStates = Object.keys(indianStatesAndCities).sort();
  const availableCities = formData.state
    ? (indianStatesAndCities[formData.state] || []).sort()
    : [];

  const [userData, setUserData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [ayushConsultations, setAyushConsultations] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [loadingBills, setLoadingBills] = useState(true);
  const [loadingAyush, setLoadingAyush] = useState(true);
  const [selectedDietDay, setSelectedDietDay] = useState("day1");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmType, setDeleteConfirmType] = useState<
    "report" | "prescription" | "bill" | null
  >(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchReports();
      fetchPrescriptions();
      fetchBills();
      fetchUserData();
      fetchAyushConsultations();
    }
  }, [status]);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      setPrescriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await fetch("/api/bills");
      const data = await res.json();
      setBills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBills(false);
    }
  };

  const fetchAyushConsultations = async () => {
    try {
      const res = await fetch("/api/ayush-consult/history");
      if (res.ok) {
        const data = await res.json();
        setAyushConsultations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAyush(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          gender: data.gender || "",
          state: data.state || "",
          city: data.city || "",
          pincode: data.pincode || "",
          weight: data.weight || "",
          height: {
            feet: data.height?.feet || "",
            inches: data.height?.inches || "",
          },
          diet: data.diet || "",
          bloodGroup: data.bloodGroup || "",
          diseases: data.diseases || [],
          mobile: data.mobile ? String(data.mobile) : "",
          specialization: data.specialization || "",
          dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
        });
        setUserData(data);
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  const handleDeleteReport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmType("report");
    setDeleteConfirmId(id);
    setDeleteConfirmInput("");
    setDeleteConfirmOpen(true);
  };

  const handleDeletePrescription = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmType("prescription");
    setDeleteConfirmId(id);
    setDeleteConfirmInput("");
    setDeleteConfirmOpen(true);
  };

  const handleDeleteBill = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmType("bill");
    setDeleteConfirmId(id);
    setDeleteConfirmInput("");
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (deleteConfirmInput !== "YES" || !deleteConfirmType || !deleteConfirmId)
      return;

    try {
      const endpointMap = {
        report: `/api/reports/${deleteConfirmId}`,
        prescription: `/api/prescriptions/${deleteConfirmId}`,
        bill: `/api/bills/${deleteConfirmId}`,
      };

      const res = await fetch(endpointMap[deleteConfirmType], {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(
          data.message ||
            `${deleteConfirmType.charAt(0).toUpperCase() + deleteConfirmType.slice(1)} deleted successfully`,
        );
        if (deleteConfirmType === "report") {
          setReports((prev) => prev.filter((r) => r._id !== deleteConfirmId));
        } else if (deleteConfirmType === "prescription") {
          setPrescriptions((prev) =>
            prev.filter((p) => p._id !== deleteConfirmId),
          );
        } else if (deleteConfirmType === "bill") {
          setBills((prev) => prev.filter((b) => b._id !== deleteConfirmId));
        }
      } else {
        toast.error(
          data.error || data.message || `Failed to delete ${deleteConfirmType}`,
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete ${deleteConfirmType}`);
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteConfirmType(null);
      setDeleteConfirmId(null);
      setDeleteConfirmInput("");
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
      fetchReports();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 relative">
        <BackgroundPattern />
        <div className="relative z-10">
          <TetrisLoading
            size="lg"
            speed="normal"
            showLoadingText={true}
            loadingText="Loading profile vault..."
          />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (formData.state && formData.city && formData.pincode) {
      const validation = validatePincode(
        formData.state,
        formData.city,
        formData.pincode,
      );
      if (!validation.isValid) {
        toast.error(validation.message || "Invalid Pincode");
        return;
      }
    }

    setLoading(true);
    const run = async () => {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: formData.gender,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
          weight: formData.weight,
          height: formData.height,
          diet: formData.diet,
          bloodGroup: formData.bloodGroup,
          diseases: formData.diseases,
          dob: formData.dob,
          ...(userData?.role === "doctor" && {
            specialization: formData.specialization,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      await update();
      await fetchUserData();
      setIsEditing(false);
      return data;
    };

    toast
      .promise(run(), {
        pending: "Updating profile data...",
        success: "Profile updated successfully!",
        error: {
          render({ data }: any) {
            return data?.message || "Failed to update profile";
          },
        },
      })
      .finally(() => setLoading(false));
  };

  const handleCancel = () => {
    setFormData({
      name: session.user.name || "",
      gender: (session.user as any).gender || "",
      state: userData?.state || "",
      city: userData?.city || "",
      pincode: userData?.pincode || "",
      weight: userData?.weight || "",
      height: {
        feet: userData?.height?.feet || "",
        inches: userData?.height?.inches || "",
      },
      diet: userData?.diet || "",
      bloodGroup: userData?.bloodGroup || "",
      diseases: userData?.diseases || [],
      mobile: userData?.mobile ? String(userData.mobile) : "",
      specialization: userData?.specialization || "",
      dob: userData?.dob
        ? new Date(userData.dob).toISOString().split("T")[0]
        : "",
    });
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center p-4">
      <BackgroundPattern />
      <Card className="w-full max-w-[80%] border-2 border-slate-900 shadow-md rounded-xl bg-white/95 backdrop-blur-sm overflow-hidden">
        <CardHeader className="text-center relative border-b-2 border-slate-900 pb-6 bg-slate-50/50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-xl ring-2 ring-slate-900 shrink-0">
              {session.user.image || (session.user as any).avatar ? (
                <Image
                  src={
                    session.user.image ||
                    (session.user as any).avatar ||
                    "https://robohash.org/placeholder"
                  }
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-sky-900 flex items-center justify-center text-white  text-3xl">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl  text-slate-900 flex items-center justify-center gap-2">
                {session.user.name}
                {userData?.idNumber && (
                  <span className="text-xs bg-sky-900 text-white px-2.5 py-0.5 rounded-full border border-slate-900">
                    ID: #{userData.idNumber}
                  </span>
                )}
              </CardTitle>
              <p className="text-slate-500 font-medium text-sm">
                {session.user.email}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 px-6">
          {isEditing ? (
            <div className="space-y-6 pb-4">
              {/* FIXED INFO (Read Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2 opacity-70">
                  <Label
                    htmlFor="name"
                    className="text-slate-500 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Full Name (Permanent)
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    disabled
                    className="border-2 border-slate-200 bg-slate-50 font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2 opacity-70">
                  <Label
                    htmlFor="email"
                    className="text-slate-500 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={session.user.email || ""}
                    disabled
                    className="border-2 border-slate-200 bg-slate-50 font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2 opacity-70">
                  <Label
                    htmlFor="mobileReadOnly"
                    className="text-slate-500 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Mobile Number
                  </Label>
                  <Input
                    id="mobileReadOnly"
                    value={formData.mobile || "Not Set"}
                    disabled
                    className="border-2 border-slate-200 bg-slate-50 font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* EDITABLE BASIC INFO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="gender"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Gender
                  </Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non binary">Non Binary</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="weight"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        weight: e.target.value,
                      }))
                    }
                    className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bloodGroup"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Blood Group
                  </Label>
                  <select
                    id="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bloodGroup: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="diet"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Diet
                  </Label>
                  <select
                    id="diet"
                    value={formData.diet}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, diet: e.target.value }))
                    }
                    className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900"
                  >
                    <option value="">Select</option>
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              {/* DOCTOR SPECIALIZATION EDITABLE FIELD */}
              {userData?.role === "doctor" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="specialization"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        specialization: e.target.value,
                      }))
                    }
                    className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900"
                    placeholder="e.g. Cardiology"
                    required
                  />
                </div>
              )}

              {/* DATE OF BIRTH EDITABLE FIELD */}
              <div className="space-y-2">
                <Label
                  htmlFor="dob"
                  className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                >
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dob: e.target.value }))
                  }
                  className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900"
                />
              </div>

              {/* HEIGHT */}
              <div className="space-y-2">
                <Label className="text-slate-900 font-bold text-[10px] uppercase tracking-widest">
                  Height
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Feet"
                      value={formData.height.feet}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          height: { ...prev.height, feet: e.target.value },
                        }))
                      }
                      className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900"
                    />
                    <span className="text-sm font-bold text-slate-500">ft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Inches"
                      value={formData.height.inches}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          height: { ...prev.height, inches: e.target.value },
                        }))
                      }
                      className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900"
                    />
                    <span className="text-sm font-bold text-slate-500">in</span>
                  </div>
                </div>
              </div>

              {/* LOCATION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="state"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    State
                  </Label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        state: newState,
                        city: "",
                        pincode: "",
                      }));
                    }}
                    className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900"
                  >
                    <option value="">Select State</option>
                    {availableStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="city"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    City
                  </Label>
                  <select
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        city: e.target.value,
                        pincode: "",
                      }))
                    }
                    disabled={!formData.state}
                    className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Select City</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="pincode"
                    className="text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                  >
                    Pincode
                  </Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pincode: e.target.value,
                      }))
                    }
                    maxLength={6}
                    disabled={!formData.city}
                    className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* DISEASES */}
              <div className="space-y-3">
                <Label className="text-slate-900 font-bold text-[10px] uppercase tracking-widest">
                  Common Diseases
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    "Diabetic",
                    "Thyroid",
                    "High Blood Pressure",
                    "Low Blood Pressure",
                  ].map((disease) => (
                    <label
                      key={disease}
                      className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all cursor-pointer ${
                        formData.diseases.includes(disease)
                          ? "border-sky-900 bg-sky-50 shadow-sm"
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="w-3 h-3 rounded border-slate-300 text-sky-900 focus:ring-sky-900 cursor-pointer"
                        checked={formData.diseases.includes(disease)}
                        onChange={() => {
                          let newDiseases = formData.diseases.includes(disease)
                            ? formData.diseases.filter((d) => d !== disease)
                            : [...formData.diseases, disease];
                          if (!formData.diseases.includes(disease)) {
                            if (disease === "High Blood Pressure") {
                              newDiseases = newDiseases.filter(
                                (d) => d !== "Low Blood Pressure",
                              );
                            } else if (disease === "Low Blood Pressure") {
                              newDiseases = newDiseases.filter(
                                (d) => d !== "High Blood Pressure",
                              );
                            }
                          }
                          setFormData((prev) => ({
                            ...prev,
                            diseases: newDiseases,
                          }));
                        }}
                      />
                      <span className="text-[10px] text-slate-700 uppercase">
                        {disease}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-900 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-8 mb-8 bg-slate-100 p-1 border-2 border-slate-900 rounded-xl h-12">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Info
                </TabsTrigger>
                <TabsTrigger
                  value="health"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Health
                </TabsTrigger>
                <TabsTrigger
                  value="ayurvedic"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Ayurvedic
                </TabsTrigger>
                <TabsTrigger
                  value="diet"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Diet
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Reports
                </TabsTrigger>
                <TabsTrigger
                  value="prescriptions"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Medication
                </TabsTrigger>
                <TabsTrigger
                  value="bills"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Bills
                </TabsTrigger>
                <TabsTrigger
                  value="location"
                  className="data-[state=active]:bg-sky-900 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest"
                >
                  Place
                </TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent
                value="overview"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <User className="h-5 w-5 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Name
                      </p>
                      <p className="text-base  text-slate-900">
                        {session.user.name}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <Mail className="h-5 w-5 text-sky-900" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Email
                      </p>
                      <p className="text-base  text-slate-900 truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <Briefcase className="h-5 w-5 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Role
                      </p>
                      <p className="text-base  text-slate-900 capitalize">
                        {(session.user as any).role || "Not Set"}
                      </p>
                    </div>
                  </div>

                  {userData?.role === "doctor" && userData?.specialization && (
                    <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                        <Stethoscope className="h-5 w-5 text-sky-900" />
                      </div>
                      <div>
                        <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                          Specialization
                        </p>
                        <p className="text-base  text-slate-900 capitalize">
                          {userData.specialization}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <VenusAndMars className="h-5 w-5 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Gender
                      </p>
                      <p className="text-base  text-slate-900 capitalize">
                        {userData?.gender || "Not Set"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <Droplet className="h-5 w-5 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Blood Group
                      </p>
                      <p className="text-base  text-slate-900 uppercase">
                        {userData?.bloodGroup || "Not Set"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <Calendar className="h-5 w-5 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Date of Birth
                      </p>
                      <p className="text-base  text-slate-900">
                        {userData?.dob
                          ? new Date(userData.dob).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Not Set"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <Activity className="h-5 w-5 text-sky-900" />
                    </div>
                    <div>
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Age
                      </p>
                      <p className="text-base  text-slate-900">
                        {userData?.age
                          ? `${userData.age.years}y ${userData.age.months}m ${userData.age.days}d`
                          : "Not Calculated"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <svg
                        className="h-5 w-5 text-sky-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                        Mobile Number
                      </p>
                      <p className="text-base  text-slate-900">
                        {userData?.mobile || "Not Set"}
                      </p>
                    </div>
                  </div>

                  {userData?.idNumber && (
                    <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-4 hover:bg-white transition-all shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0 border-2 border-slate-900">
                        <svg
                          className="h-5 w-5 text-sky-900"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 1 4 3H5c0-2 2.667-3 4-3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px]  text-slate-500 uppercase tracking-widest">
                          Patient ID
                        </p>
                        <p className="text-base text-sky-900">
                          {userData.idNumber}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* AYURVEDIC TAB */}
              <TabsContent
                value="ayurvedic"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="space-y-3 max-h-125 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingAyush ? (
                    <div className="flex items-center justify-center py-10">
                      <TetrisLoading
                        size="sm"
                        speed="normal"
                        showLoadingText={true}
                        loadingText="Loading consultations..."
                      />
                    </div>
                  ) : ayushConsultations.length > 0 ? (
                    ayushConsultations.map((consult: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() =>
                          router.push(`/ayush-consult/history/${consult._id}`)
                        }
                        className="bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:bg-white transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-sky-50 shadow-sm">
                              <Flower2 className="h-6 w-6 text-sky-900" />
                            </div>
                            <div>
                              <h4 className="text-sm text-slate-900 uppercase tracking-widest font-bold">
                                Consultation #{ayushConsultations.length - idx}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                  {consult.savedAt
                                    ? new Date(
                                        consult.savedAt,
                                      ).toLocaleDateString(undefined, {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Recently Saved"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50/50 border border-slate-900/5 rounded-xl p-4 space-y-3">
                          <div>
                            <p className="text-[8px] uppercase tracking-widest text-sky-900 font-bold mb-1">
                              Diagnosis & Guidance
                            </p>
                            <p className="text-xs text-slate-700 leading-relaxed italic font-serif">
                              {consult.ayurvedicAnalysis}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                            <div>
                              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                Primary Medicine
                              </p>
                              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                                {consult.measures?.medicine?.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                                Key Asana
                              </p>
                              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                                {consult.yogaAsana?.[0]?.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <Flower2 className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        No Vedic consultations saved
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* HEALTH TAB */}
              <TabsContent
                value="health"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Weight
                    </p>
                    <p className="text-lg sm:text-xl text-sky-900">
                      {userData?.weight ? `${userData.weight} kg` : "N/A"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Height
                    </p>
                    <p className="text-lg sm:text-xl text-sky-900">
                      {userData?.height?.feet
                        ? `${userData.height.feet}'${userData.height.inches || 0}"`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Diet
                    </p>
                    <p className="text-sm sm:text-base text-sky-900 capitalize truncate w-full">
                      {userData?.diet || "Not Set"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:bg-white transition-all shadow-sm">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4">
                    Common Diseases
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {userData?.diseases && userData.diseases.length > 0 ? (
                      userData.diseases.map((d: string) => (
                        <span
                          key={d}
                          className="px-3 py-1.5 bg-sky-100 text-sky-900 text-xs rounded-full border-2 border-sky-900/20 shadow-sm"
                        >
                          {d}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-400 font-medium italic">
                        No diseases recorded
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* REPORTS TAB */}
              <TabsContent
                value="reports"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-10">
                      <TetrisLoading
                        size="sm"
                        speed="normal"
                        showLoadingText={true}
                        loadingText="Loading reports..."
                      />
                    </div>
                  ) : reports.length > 0 ? (
                    reports.map((report) => (
                      <div
                        key={report._id}
                        onClick={() => router.push(`/reports/${report._id}`)}
                        className="relative bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/80 hover:shadow-sm transition-all cursor-pointer group overflow-hidden"
                      >
                        {/* Header: Score & Date */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "h-12 w-12 rounded-xl flex flex-col items-center justify-center border-2 border-slate-900 shadow-sm transition-colors",
                                report.healthScore >= 80
                                  ? "bg-emerald-500/10 border-emerald-500"
                                  : report.healthScore >= 60
                                    ? "bg-amber-500/10 border-amber-500"
                                    : "bg-red-500/10 border-red-500",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-sm tracking-widest",
                                  report.healthScore >= 80
                                    ? "text-emerald-700"
                                    : report.healthScore >= 60
                                      ? "text-amber-700"
                                      : "text-red-700",
                                )}
                              >
                                {report.healthScore}
                              </span>
                              <span
                                className={cn(
                                  "text-[7px] uppercase tracking-widest",
                                  report.healthScore >= 80
                                    ? "text-emerald-700/70"
                                    : report.healthScore >= 60
                                      ? "text-amber-700/70"
                                      : "text-red-700/70",
                                )}
                              >
                                Index
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm text-slate-900 uppercase tracking-widest">
                                {report.patientDetails.name || "Lab Analysis"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                  {new Date(
                                    report.createdAt,
                                  ).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleDeleteReport(e, report._id)}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                              title="Delete report"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>

                        {/* Summary Body */}
                        <div className="bg-slate-50/50 border border-slate-900/5 rounded-xl p-3">
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed tracking-wider italic">
                            "{report.overallSummary}"
                          </p>
                        </div>

                        {/* Footer Highlights */}
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-sky-50 border border-sky-900/10 rounded text-[9px] text-sky-900 uppercase tracking-widest">
                            Analysis Record
                          </div>
                          <div className="px-2 py-1 bg-slate-900 text-white rounded text-[9px] uppercase tracking-widest">
                            Diagnostic
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <FileBarChart className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        No reports saved yet
                      </p>
                      <button
                        onClick={() => router.push("/analyze-report")}
                        className="text-sky-900 text-[10px] font-black uppercase mt-2 hover:underline"
                      >
                        Analyze your first report
                      </button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* PRESCRIPTIONS TAB */}
              <TabsContent
                value="prescriptions"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingPrescriptions ? (
                    <div className="flex items-center justify-center py-10">
                      <TetrisLoading
                        size="sm"
                        speed="normal"
                        showLoadingText={true}
                        loadingText="Loading prescriptions..."
                      />
                    </div>
                  ) : prescriptions.length > 0 ? (
                    prescriptions.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => router.push(`/prescriptions/${p._id}`)}
                        className="relative bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/80 hover:shadow-sm transition-all cursor-pointer group overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl flex items-center justify-center border-2 border-slate-900 bg-sky-50 shadow-sm">
                              <Pill className="h-6 w-6 text-sky-900" />
                            </div>
                            <div>
                              <h4 className="text-sm text-slate-900 uppercase tracking-widest">
                                {p.patientDetails.name || "Prescription"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                  {new Date(p.createdAt).toLocaleDateString(
                                    undefined,
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) =>
                                handleDeletePrescription(e, p._id)
                              }
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                              title="Delete prescription"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>

                        <div className="bg-slate-50/50 border border-slate-900/5 rounded-xl p-3">
                          <p className="text-[11px] text-slate-600 line-clamp-1 leading-relaxed tracking-wider italic">
                            {p.diagnosis || "Medical consultation record"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-sky-50 border border-sky-900/10 rounded text-[9px] text-sky-900 uppercase tracking-widest">
                            {p.doctorDetails.specialization ||
                              "General Medicine"}
                          </div>
                          <div className="px-2 py-1 bg-slate-900 text-white rounded text-[9px] uppercase tracking-widest">
                            Prescription
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 uppercase tracking-widest text-[10px]">
                        No saved prescriptions found
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* BILLS TAB */}
              <TabsContent
                value="bills"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="space-y-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
                  {loadingBills ? (
                    <div className="flex items-center justify-center py-10">
                      <TetrisLoading
                        size="sm"
                        speed="normal"
                        showLoadingText={true}
                        loadingText="Loading bills..."
                      />
                    </div>
                  ) : bills.length > 0 ? (
                    bills.map((bill) => (
                      <div
                        key={bill._id}
                        onClick={() => router.push(`/bills/${bill._id}`)}
                        className="relative bg-white/60 backdrop-blur-md border-2 border-slate-900 rounded-2xl p-5 flex flex-col gap-4 hover:bg-white/80 hover:shadow-sm transition-all cursor-pointer group overflow-hidden"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "h-12 w-12 rounded-xl flex flex-col items-center justify-center border-2 border-slate-900 shadow-sm transition-colors",
                                bill.analysis.transparencyScore >= 80
                                  ? "bg-emerald-500/10 border-emerald-500"
                                  : bill.analysis.transparencyScore >= 60
                                    ? "bg-amber-500/10 border-amber-500"
                                    : "bg-red-500/10 border-red-500",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-sm tracking-widest",
                                  bill.analysis.transparencyScore >= 80
                                    ? "text-emerald-700"
                                    : bill.analysis.transparencyScore >= 60
                                      ? "text-amber-700"
                                      : "text-red-700",
                                )}
                              >
                                {bill.analysis.transparencyScore}
                              </span>
                              <span
                                className={cn(
                                  "text-[7px] uppercase tracking-widest",
                                  bill.analysis.transparencyScore >= 80
                                    ? "text-emerald-700/70"
                                    : bill.analysis.transparencyScore >= 60
                                      ? "text-amber-700/70"
                                      : "text-red-700/70",
                                )}
                              >
                                Index
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm text-slate-900 uppercase tracking-widest">
                                {bill.hospitalDetails.name || "Hospital Bill"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                                  {new Date(bill.createdAt).toLocaleDateString(
                                    undefined,
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleDeleteBill(e, bill._id)}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                              title="Delete bill"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>

                        <div className="bg-slate-50/50 border border-slate-900/5 rounded-xl p-3">
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed tracking-wider italic">
                            "{bill.analysis.overallAssessment}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {bill.analysis.shadyChargesCount > 0 && (
                            <div className="px-2 py-1 bg-red-50 border border-red-900/10 rounded text-[9px] text-red-600 uppercase tracking-widest">
                              {bill.analysis.shadyChargesCount} Shady Charges
                            </div>
                          )}
                          <div className="px-2 py-1 bg-slate-900 text-white rounded text-[9px] uppercase tracking-widest">
                            Forensic Audit
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 uppercase tracking-widest text-[10px]">
                        No forensic audits found
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* DIET TAB */}
              <TabsContent
                value="diet"
                className="space-y-6 focus-visible:ring-0"
              >
                {userData?.dietChart ? (
                  <div className="space-y-6">
                    {/* Diet Metrics Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="border-2 border-slate-900 bg-white shadow-md rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-sky-55/50 border-2 border-slate-900 flex items-center justify-center text-sky-900 shadow-sm shrink-0">
                            <FaFire className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Calorie Target
                            </h3>
                            <p className="text-base font-black text-slate-900 mt-0.5">
                              {userData.dietChart.summary.dailyCaloriesTarget}{" "}
                              kcal
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-slate-900 bg-white shadow-md rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-55/50 border-2 border-slate-900 flex items-center justify-center text-emerald-800 shadow-sm shrink-0">
                            <FaAward className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Macro Ratio
                            </h3>
                            <p className="text-xs font-black text-slate-900 mt-0.5">
                              {userData.dietChart.summary.macroRatio}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-slate-900 bg-white shadow-md rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-55/50 border-2 border-slate-900 flex items-center justify-center text-amber-800 shadow-sm shrink-0">
                            <Activity className="h-5 w-5 text-amber-800" />
                          </div>
                          <div>
                            <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Hydration Goal
                            </h3>
                            <p className="text-xs font-black text-slate-900 mt-0.5">
                              {userData.dietChart.summary.hydrationGoal}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-slate-900 bg-white shadow-md rounded-2xl">
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-purple-55/50 border-2 border-slate-900 flex items-center justify-center text-purple-800 shadow-sm shrink-0">
                            <FaMagic className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Plan Generated On
                            </h3>
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-0.5 truncate">
                              {userData.dietChart.updatedAt ||
                              userData.dietChart.createdAt
                                ? new Date(
                                    userData.dietChart.updatedAt ||
                                      userData.dietChart.createdAt,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "Active Plan"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Strategy recommendation memo */}
                    <div className="bg-white border-2 border-slate-900 p-4 rounded-2xl shadow-md flex items-start gap-3 text-left">
                      <div className="h-9 w-9 bg-sky-50 border-2 border-slate-900 rounded-lg flex items-center justify-center text-sky-850 shrink-0 mt-0.5">
                        <FaInfoCircle className="h-4 w-4 text-sky-900" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Nutritionist Strategy Memo
                        </h4>
                        <p className="text-slate-700 text-xs leading-relaxed font-semibold">
                          {userData.dietChart.summary.personalRecommendation}
                        </p>
                      </div>
                    </div>

                    {/* Day Selector triggers */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {Object.keys(userData.dietChart.dietPlan).map(
                        (dayKey) => {
                          const dayNum = parseInt(dayKey.replace("day", ""));
                          const isSelected = selectedDietDay === dayKey;
                          const isCheat =
                            userData.dietChart.dietPlan[dayKey].isCheatDay;

                          return (
                            <button
                              key={dayKey}
                              type="button"
                              onClick={() => setSelectedDietDay(dayKey)}
                              className={`px-3 py-1.5 rounded-lg border-2 text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer shadow-xs active:scale-95 ${
                                isSelected
                                  ? "bg-sky-900 border-slate-900 text-white shadow-sm"
                                  : isCheat
                                    ? "bg-rose-50 hover:bg-rose-100/80 border-slate-900 text-rose-900"
                                    : "bg-white hover:bg-slate-50 border-slate-900 text-slate-800"
                              }`}
                            >
                              {isCheat ? `D${dayNum} (Cheat)` : `Day ${dayNum}`}
                            </button>
                          );
                        },
                      )}
                    </div>

                    {/* Meal slots grid for chosen day */}
                    {(() => {
                      const dayMeals =
                        userData.dietChart.dietPlan[selectedDietDay];
                      if (!dayMeals) return null;
                      const isCheat = dayMeals.isCheatDay;
                      const mealSlots = [
                        "breakfast",
                        "lunch",
                        "snacks",
                        "dinner",
                      ];

                      return (
                        <div className="space-y-4">
                          {isCheat && (
                            <div className="bg-rose-50 border-2 border-slate-900 text-slate-950 p-3 rounded-xl flex items-center justify-center gap-2 w-fit mx-auto shadow-sm">
                              <FaInfoCircle className="h-4 w-4 text-rose-700 shrink-0" />
                              <p className="text-[10px] uppercase font-black tracking-widest">
                                Day 7 Cheat Day: Clean cheat suggestions
                                enabled. Enjoy responsibly!
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {mealSlots.map((slot) => {
                              const mealInfo = dayMeals[slot];
                              if (!mealInfo) return null;

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
                                  className={`border-2 border-slate-900 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                                    isCheat ? "ring-2 ring-rose-500/10" : ""
                                  }`}
                                >
                                  <div>
                                    <div
                                      className={`px-3 py-2 flex items-center justify-between font-bold ${slotColors[slot]}`}
                                    >
                                      <span className="text-[10px] font-black uppercase tracking-widest">
                                        {slot}
                                      </span>
                                      <span className="text-[9px] font-black uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border-2 border-slate-900 shadow-xs">
                                        {mealInfo.calories} kcal
                                      </span>
                                    </div>

                                    <div className="p-4 space-y-2 text-left">
                                      <ul className="space-y-1.5">
                                        {mealInfo.meals.map(
                                          (item: string, idx: number) => (
                                            <li
                                              key={idx}
                                              className="flex items-start gap-1.5"
                                            >
                                              <div className="h-4.5 w-4.5 rounded-full border border-slate-200 flex items-center justify-center text-emerald-600 bg-emerald-50 shrink-0 mt-0.5">
                                                <FaCheck className="h-2 w-2" />
                                              </div>
                                              <span className="text-[11px] font-semibold text-slate-800 leading-tight">
                                                {item}
                                              </span>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="px-4 pb-4 pt-1.5 border-t border-slate-100">
                                    <p className="text-[9px] text-slate-500 leading-normal font-medium italic flex items-start gap-1 text-left">
                                      <FaLightbulb className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" />
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
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 space-y-4 flex flex-col items-center justify-center">
                    <p className="text-slate-400 uppercase tracking-widest text-[10px]">
                      No personalized diet chart generated yet
                    </p>
                    <button
                      onClick={() => router.push("/diet-chart")}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-black text-xs uppercase bg-sky-900 text-white border-2 border-slate-900 hover:bg-sky-850 active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      <FaApple className="h-4 w-4" />
                      Create Personalized Diet Chart
                    </button>
                  </div>
                )}
              </TabsContent>

              {/* LOCATION TAB */}
              <TabsContent
                value="location"
                className="space-y-4 focus-visible:ring-0"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      City
                    </p>
                    <p className="text-sm sm:text-base text-sky-900 font-medium truncate w-full">
                      {userData?.city || "N/A"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      State
                    </p>
                    <p className="text-sm sm:text-base text-sky-900 font-medium truncate w-full">
                      {userData?.state || "N/A"}
                    </p>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-all shadow-sm">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                      Pincode
                    </p>
                    <p className="text-sm sm:text-base text-sky-900 font-medium tracking-widest">
                      {userData?.pincode || "N/A"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-3">
                <div className="flex gap-3">
                  <CompleteProfileSheet
                    userData={userData}
                    onUpdate={fetchUserData}
                  />
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3  bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md transition-all whitespace-nowrap"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </button>
                </div>
                <SignOutButton />
              </div>
            </Tabs>
          )}
        </CardContent>
      </Card>
      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl flex flex-col gap-4 text-left animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                Confirm Deletion
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-2 uppercase tracking-wide">
                This action is permanent and cannot be undone. To confirm,
                please type{" "}
                <strong className="text-rose-600 font-black">YES</strong> in the
                box below:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                toast.warning(
                  "Copy-paste is disabled. Please type YES manually.",
                  {
                    position: "top-right",
                    autoClose: 2000,
                  },
                );
              }}
              placeholder="YES"
              className="w-full border-2 border-slate-900 rounded-xl p-3 outline-none font-bold text-center tracking-widest text-slate-900 placeholder:text-slate-350 focus:border-rose-600 transition-all"
            />

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmType(null);
                  setDeleteConfirmId(null);
                  setDeleteConfirmInput("");
                }}
                className="flex-1 py-2.5 border-2 border-slate-900 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-white hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleteConfirmInput !== "YES"}
                className="flex-1 py-2.5 border-2 border-slate-900 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-rose-600 hover:bg-rose-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
