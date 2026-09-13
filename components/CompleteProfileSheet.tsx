"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { indianStatesAndCities } from "@/lib/states";
import { validatePincode } from "@/lib/pincode-validator";
import { useSession } from "next-auth/react";
import { AlertCircle, X } from "lucide-react";

interface CompleteProfileSheetProps {
  userData: any;
  onUpdate: () => void;
}

export default function CompleteProfileSheet({
  userData,
  onUpdate,
}: CompleteProfileSheetProps) {
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    state: userData?.state || "",
    city: userData?.city || "",
    pincode: userData?.pincode || "",
    gender: userData?.gender || "male",
    weight: userData?.weight || "",
    heightFeet: userData?.height?.feet || "",
    heightInches: userData?.height?.inches || "",
    diet: userData?.diet || "",
    bloodGroup: userData?.bloodGroup || "",
    diseases: userData?.diseases || [],
    allergies: userData?.allergies || userData?.easyCard?.allergies || [],
    role: userData?.role || "",
    mobile: userData?.mobile ? String(userData.mobile) : "",
    specialization: userData?.specialization || "",
    dob: userData?.dob
      ? new Date(userData.dob).toISOString().split("T")[0]
      : "",
  });

  const [allergyInput, setAllergyInput] = useState("");

  const availableStates = Object.keys(indianStatesAndCities).sort();
  const availableCities = formData.state
    ? (indianStatesAndCities[formData.state] || []).sort()
    : [];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [id]: value };

      if (id === "state") {
        newData.city = "";
        newData.pincode = "";
      } else if (id === "city") {
        newData.pincode = "";
      }

      return newData;
    });
  };

  const handleDiseaseChange = (disease: string) => {
    setFormData((prev) => {
      let diseases = [...prev.diseases];
      if (diseases.includes(disease)) {
        diseases = diseases.filter((d) => d !== disease);
      } else {
        diseases.push(disease);
        if (disease === "High Blood Pressure") {
          diseases = diseases.filter((d) => d !== "Low Blood Pressure");
        } else if (disease === "Low Blood Pressure") {
          diseases = diseases.filter((d) => d !== "High Blood Pressure");
        }
      }
      return { ...prev, diseases };
    });
  };

  // Enter-separated allergy tag addition
  const handleAddAllergy = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const cleanTag = allergyInput.trim().replace(/,/g, "");
      if (cleanTag && !formData.allergies.includes(cleanTag)) {
        setFormData((prev) => ({
          ...prev,
          allergies: [...prev.allergies, cleanTag],
        }));
        setAllergyInput("");
      }
    }
  };

  const handleRemoveAllergy = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((a: string) => a !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.state ||
      !formData.city ||
      !formData.pincode ||
      !formData.role ||
      !formData.mobile ||
      !formData.dob ||
      !formData.bloodGroup ||
      !formData.gender
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.role === "doctor" && !formData.specialization.trim()) {
      toast.error("Specialization is required for doctors");
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast.error("Invalid Mobile Number. Must be a valid 10-digit number.");
      return;
    }

    const validation = validatePincode(
      formData.state,
      formData.city,
      formData.pincode,
    );

    if (!validation.isValid) {
      toast.error(validation.message || "Invalid Pincode");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      await updateSession();
      onUpdate();
      toast.success("Profile updated successfully!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        state: userData.state || "",
        city: userData.city || "",
        pincode: userData.pincode || "",
        gender: userData.gender || "male",
        weight: userData.weight || "",
        heightFeet: userData.height?.feet || "",
        heightInches: userData.height?.inches || "",
        diet: userData.diet || "",
        bloodGroup: userData.bloodGroup || "",
        diseases: userData.diseases || [],
        allergies: userData.allergies || userData.easyCard?.allergies || [],
        role: userData.role || "",
        mobile: userData.mobile ? String(userData.mobile) : "",
        specialization: userData.specialization || "",
        dob: userData.dob
          ? new Date(userData.dob).toISOString().split("T")[0]
          : "",
      });
    }
  }, [userData]);

  const isProfileIncomplete = userData && !userData.isAddressUpdated;

  if (!isProfileIncomplete) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold bg-rose-600 text-white hover:bg-rose-700 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all whitespace-nowrap">
          <AlertCircle className="h-4 w-4" />
          Complete Profile
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-2xl font-bold text-slate-900">
            Complete Your Profile
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            Please provide your medical profile details to complete
            registration.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 pt-2">
          <div className="flex flex-col gap-4">
            {/* Gender Selection */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-slate-900 font-semibold">
                Gender <span className="text-rose-600">*</span>
              </Label>
              <select
                id="gender"
                className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white focus:border-slate-900 outline-none transition-all h-11"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non binary">Non Binary</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-slate-900 font-semibold">
                State <span className="text-rose-600">*</span>
              </Label>
              <select
                id="state"
                className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white focus:border-slate-900 outline-none transition-all"
                value={formData.state}
                onChange={handleInputChange}
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
              <Label htmlFor="city" className="text-slate-900 font-semibold">
                City <span className="text-rose-600">*</span>
              </Label>
              <select
                id="city"
                className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-900 outline-none transition-all"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!formData.state}
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
              <Label htmlFor="pincode" className="text-slate-900 font-semibold">
                Pincode <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="pincode"
                placeholder="123456"
                maxLength={6}
                value={formData.pincode}
                onChange={handleInputChange}
                className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11 disabled:bg-slate-100 disabled:text-slate-400"
                disabled={!formData.city}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-slate-900 font-semibold">
                Mobile Number <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="mobile"
                placeholder="9876543210"
                maxLength={10}
                value={formData.mobile}
                onChange={handleInputChange}
                className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="text-slate-900 font-semibold">
                Date of Birth <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11"
              />
            </div>

            {/* Enter-Separated Allergies Field */}
            <div className="space-y-2">
              <Label
                htmlFor="allergies"
                className="text-slate-900 font-semibold"
              >
                Allergies{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (Press Enter to add tag)
                </span>
              </Label>
              <div className="p-2 border-2 border-slate-200 focus-within:border-slate-900 rounded-lg bg-white min-h-11 flex flex-wrap items-center gap-1.5">
                {formData.allergies.map((allergy: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-md"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(allergy)}
                      className="hover:text-rose-900 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={
                    formData.allergies.length === 0
                      ? "Type allergy and press Enter (e.g. Penicillin)"
                      : "Add more..."
                  }
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={handleAddAllergy}
                  className="flex-1 bg-transparent text-xs font-semibold outline-none min-w-30"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="weight"
                  className="text-slate-900 font-semibold"
                >
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="bloodGroup"
                  className="text-slate-900 font-semibold"
                >
                  Blood Group <span className="text-rose-600">*</span>
                </Label>
                <select
                  id="bloodGroup"
                  className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white focus:border-slate-900 outline-none transition-all text-sm h-11"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
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
                <Label htmlFor="diet" className="text-slate-900 font-semibold">
                  Dietary Info
                </Label>
                <select
                  id="diet"
                  className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white focus:border-slate-900 outline-none transition-all text-sm h-11"
                  value={formData.diet}
                  onChange={handleInputChange}
                >
                  <option value="">Select Diet</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non veg">Non-Vegetarian</option>
                  <option value="jain">Jain</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-900 font-semibold">Height</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    id="heightFeet"
                    type="number"
                    placeholder="Feet"
                    value={formData.heightFeet}
                    onChange={handleInputChange}
                    className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    ft
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="heightInches"
                    type="number"
                    placeholder="Inches"
                    value={formData.heightInches}
                    onChange={handleInputChange}
                    className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    in
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-900 font-semibold">
                Role <span className="text-rose-600">*</span>
              </Label>
              <select
                id="role"
                className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white focus:border-slate-900 outline-none transition-all"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="">Select Role</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
            </div>

            {formData.role === "doctor" && (
              <div className="space-y-2">
                <Label
                  htmlFor="specialization"
                  className="text-slate-900 font-semibold"
                >
                  Specialization <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="specialization"
                  placeholder="e.g. Cardiology, General Medicine"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11"
                  required
                />
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-slate-900 font-semibold">
                Common Diseases (Optional)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Diabetic",
                  "Thyroid",
                  "High Blood Pressure",
                  "Low Blood Pressure",
                ].map((disease) => (
                  <label
                    key={disease}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      formData.diseases.includes(disease)
                        ? "border-sky-900 bg-sky-50 shadow-sm"
                        : "border-slate-100 bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-sky-900 focus:ring-sky-900 cursor-pointer"
                      checked={formData.diseases.includes(disease)}
                      onChange={() => handleDiseaseChange(disease)}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {disease}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              className="flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-semibold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed min-w-30"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Details"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
