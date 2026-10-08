"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  GlassCard,
  Button,
  Badge,
  Input,
  Select,
  PasswordInput,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  Truck,
  HeartPulse,
  User,
  Mail,
  Building,
  Key,
  Flame,
  Check,
  ArrowRight,
  PhoneCall,
  Hash,
} from "lucide-react";

function SignupFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = searchParams.get("role") || "admin";

  const { t, isTamil } = useLanguage();
  const { signup, loading } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = useState(
    ["admin", "driver", "emergency"].includes(initialRole) ? initialRole : "admin"
  );

  // Sync role with search param on initial render or URL change
  useEffect(() => {
    const qRole = searchParams.get("role");
    if (qRole && ["admin", "driver", "emergency"].includes(qRole)) {
      setRole(qRole);
    }
  }, [searchParams]);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Admin Specific
  const [companyId, setCompanyId] = useState("KS-COV-99");
  const [department, setDepartment] = useState("Logistics Team");

  // Driver & Emergency Specific
  const [driverId, setDriverId] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // Emergency Specific
  const [priority, setPriority] = useState("Medical – oxygen/medicines");

  // Validation Errors
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Auto uppercase vehicle formatting: "tn 38 ab 1234" -> "TN 38 AB 1234"
  const handleVehicleChange = (e) => {
    const upper = e.target.value.toUpperCase();
    setVehicleNumber(upper);
  };

  // 10 digits phone handler
  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(cleaned);
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    // 1. Full name
    if (!fullName.trim()) {
      newErrors.fullName = t("val_required");
    }

    // 2. Username: exactly 7 characters, alphanumeric only
    if (!username) {
      newErrors.username = t("val_required");
    } else if (username.length !== 7) {
      newErrors.username = t("val_username_len");
    } else if (!/^[a-zA-Z0-9]{7}$/.test(username)) {
      newErrors.username = t("val_username_chars");
    }

    // 3. Gmail: must end with @gmail.com
    const cleanGmail = gmail.trim().toLowerCase();
    if (!cleanGmail) {
      newErrors.gmail = t("val_required");
    } else if (!cleanGmail.endsWith("@gmail.com")) {
      newErrors.gmail = t("val_gmail_format");
    }

    // 4. Password: at least 6 characters
    if (!password) {
      newErrors.password = t("val_required");
    } else if (password.length < 6) {
      newErrors.password = t("val_pass_len");
    }

    // 5. Confirm Password
    if (!confirmPassword) {
      newErrors.confirmPassword = t("val_required");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("val_pass_match");
    }

    // 6. Role-specific validation
    if (role === "admin") {
      if (!companyId.trim()) newErrors.companyId = t("val_required");
      if (!department.trim()) newErrors.department = t("val_required");
    }

    if (role === "driver" || role === "emergency") {
      if (!driverId.trim()) newErrors.driverId = t("val_required");
      if (!phone.trim()) {
        newErrors.phone = t("val_required");
      } else if (phone.length !== 10) {
        newErrors.phone = t("val_phone_len");
      }
      if (!vehicleNumber.trim()) newErrors.vehicleNumber = t("val_required");
    }

    if (role === "emergency") {
      if (!priority) newErrors.priority = t("val_required");
    }

    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate();
    setErrors(errs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({
      fullName: true,
      username: true,
      gmail: true,
      password: true,
      confirmPassword: true,
      companyId: true,
      department: true,
      driverId: true,
      phone: true,
      vehicleNumber: true,
      priority: true,
    });

    if (Object.keys(errs).length > 0) {
      toast({
        type: "warn",
        title: "Validation Incomplete",
        description: "Please resolve the highlighted fields.",
      });
      return;
    }

    const formData = {
      fullName,
      username,
      gmail,
      password,
      companyId,
      department,
      driverId,
      phone,
      vehicleNumber,
      priority,
    };

    const res = await signup(role, formData);

    if (res && res.ok) {
      const activeRole = res.role || role;
      toast({
        type: "success",
        title: t("auth_success_signup"),
        description: `${fullName} registered as ${activeRole.toUpperCase()}.`,
      });

      // Redirect by role
      const destination =
        activeRole === "admin"
          ? "/admin"
          : activeRole === "driver"
          ? "/driver"
          : "/emergency";
      router.push(destination);
    } else {
      toast({
        type: "danger",
        title: "Registration Failed",
        description: res?.error || "Could not register account.",
      });
    }
  };

  return (
    <GlassCard padding="p-6 sm:p-9" className="border-glass-border shadow-2xl backdrop-blur-2xl">
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-heading text-text">
              {t("nav_get_started")}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              KovaiSwift Logistics Terminal Registration
            </p>
          </div>
          <Badge
            variant={role === "emergency" ? "emergency" : role === "driver" ? "safe" : "info"}
            size="sm"
          >
            {role.toUpperCase()}
          </Badge>
        </div>

        {/* 3 Role Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-glass border border-glass-border">
          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setErrors({});
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "admin"
                ? "bg-primary text-white shadow-glow"
                : "text-muted hover:text-text hover:bg-white/5"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("driver");
              setErrors({});
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "driver"
                ? "bg-cyan text-black shadow-glow-cyan"
                : "text-muted hover:text-text hover:bg-white/5"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Driver</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("emergency");
              setErrors({});
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "emergency"
                ? "bg-pink text-white shadow-glow-pink"
                : "text-muted hover:text-text hover:bg-white/5"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Emergency</span>
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ================= ADMIN SPECIFIC FIELDS ================= */}
          {role === "admin" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t("auth_company_id")}
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                onBlur={() => handleBlur("companyId")}
                error={touched.companyId && errors.companyId}
                icon={Building}
                placeholder="e.g. KS-COV-99"
                required
              />

              <Select
                label={t("auth_department")}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                onBlur={() => handleBlur("department")}
                error={touched.department && errors.department}
                options={[
                  { value: "Logistics Team", label: t("auth_dept_logistics") },
                  { value: "Delivery Team", label: t("auth_dept_delivery") },
                  { value: "Management Team", label: t("auth_dept_management") },
                ]}
              />
            </div>
          )}

          {/* ================= COMMON FIELDS ================= */}
          <Input
            label={t("auth_fullname")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => handleBlur("fullName")}
            error={touched.fullName && errors.fullName}
            icon={User}
            placeholder="e.g. Karthik Raja"
            required
          />

          {/* Username with Live Character Counter (x/7) */}
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-muted">
              <span>{t("auth_username")}</span>
              <span
                className={`font-mono text-[11px] font-bold ${
                  username.length === 7
                    ? "text-safe"
                    : username.length > 7
                    ? "text-danger"
                    : "text-muted"
                }`}
              >
                {username.length}/7
              </span>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-muted pointer-events-none">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                maxLength={7}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                onBlur={() => handleBlur("username")}
                placeholder="e.g. drv3801"
                className={`w-full bg-glass text-text placeholder-muted/60 text-sm rounded-xl pl-10 pr-4 py-2.5 border transition-all duration-200 outline-none ${
                  touched.username && errors.username
                    ? "border-danger focus:ring-danger/20"
                    : "border-glass-border focus:border-primary focus:ring-primary/20"
                }`}
                required
              />
            </div>
            {touched.username && errors.username && (
              <span className="text-xs text-danger">{errors.username}</span>
            )}
          </div>

          {/* ================= DRIVER & EMERGENCY FIELDS ================= */}
          {(role === "driver" || role === "emergency") && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("auth_driver_id")}
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value.toUpperCase())}
                  onBlur={() => handleBlur("driverId")}
                  error={touched.driverId && errors.driverId}
                  icon={Key}
                  placeholder="e.g. DRV-3801"
                  required
                />

                {/* Phone with +91 Prefix */}
                <div className="w-full flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">
                    {t("auth_phone")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-semibold text-muted font-mono pointer-events-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={() => handleBlur("phone")}
                      placeholder="98421 23011"
                      className={`w-full bg-glass text-text placeholder-muted/60 text-sm rounded-xl pl-12 pr-4 py-2.5 border transition-all duration-200 outline-none ${
                        touched.phone && errors.phone
                          ? "border-danger focus:ring-danger/20"
                          : "border-glass-border focus:border-primary focus:ring-primary/20"
                      }`}
                      required
                    />
                  </div>
                  {touched.phone && errors.phone && (
                    <span className="text-xs text-danger">{errors.phone}</span>
                  )}
                </div>
              </div>

              {/* Vehicle Number (Auto Uppercase) */}
              <Input
                label={t("auth_vehicle_no")}
                value={vehicleNumber}
                onChange={handleVehicleChange}
                onBlur={() => handleBlur("vehicleNumber")}
                error={touched.vehicleNumber && errors.vehicleNumber}
                icon={Truck}
                placeholder="TN 38 AB 1234"
                required
              />
            </>
          )}

          {/* ================= EMERGENCY SPECIFIC CARGO PRIORITY CARDS ================= */}
          {role === "emergency" && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-medium text-muted">
                {t("auth_cargo_priority")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Medical */}
                <button
                  type="button"
                  onClick={() => setPriority("Medical – oxygen/medicines")}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all interactive-hover ${
                    priority === "Medical – oxygen/medicines"
                      ? "bg-pink/20 border-pink shadow-glow-pink"
                      : "bg-glass border-glass-border hover:bg-white/5"
                  }`}
                >
                  <HeartPulse className="w-5 h-5 text-pink" />
                  <span className="text-xs font-bold text-text">
                    {isTamil ? "மருத்துவம்" : "Medical"}
                  </span>
                  <span className="text-[10px] text-muted">
                    {isTamil ? "ஆக்சிஜன் & மருந்துகள்" : "Oxygen & medicines"}
                  </span>
                </button>

                {/* Food */}
                <button
                  type="button"
                  onClick={() => setPriority("Food – perishables")}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all interactive-hover ${
                    priority === "Food – perishables"
                      ? "bg-safe/20 border-safe shadow-glow-safe"
                      : "bg-glass border-glass-border hover:bg-white/5"
                  }`}
                >
                  <Truck className="w-5 h-5 text-safe" />
                  <span className="text-xs font-bold text-text">
                    {isTamil ? "உணவு" : "Food"}
                  </span>
                  <span className="text-[10px] text-muted">
                    {isTamil ? "அழுகக்கூடிய பொருட்கள்" : "Perishables"}
                  </span>
                </button>

                {/* Other Urgent */}
                <button
                  type="button"
                  onClick={() => setPriority("Other urgent")}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all interactive-hover ${
                    priority === "Other urgent"
                      ? "bg-cyan/20 border-cyan shadow-glow-cyan"
                      : "bg-glass border-glass-border hover:bg-white/5"
                  }`}
                >
                  <Flame className="w-5 h-5 text-cyan" />
                  <span className="text-xs font-bold text-text">
                    {isTamil ? "மற்றவை" : "Other"}
                  </span>
                  <span className="text-[10px] text-muted">
                    {isTamil ? "அவசர தூதஞ்சல்" : "Urgent courier"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Gmail Address */}
          <Input
            label={t("auth_gmail")}
            type="email"
            value={gmail}
            onChange={(e) => setGmail(e.target.value)}
            onBlur={() => handleBlur("gmail")}
            error={touched.gmail && errors.gmail}
            icon={Mail}
            placeholder="operator@gmail.com"
            helperText="Must be a valid @gmail.com address"
            required
          />

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              label={t("auth_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              error={touched.password && errors.password}
              placeholder="••••••••"
              required
            />

            <PasswordInput
              label={t("auth_confirm_password")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              error={touched.confirmPassword && errors.confirmPassword}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant={role === "emergency" ? "danger" : role === "driver" ? "cyan" : "primary"}
            size="lg"
            className="w-full mt-4"
            loading={loading}
            iconRight={ArrowRight}
          >
            {t("auth_btn_signup")} — {role.toUpperCase()}
          </Button>
        </form>

        {/* Footer Link to Login */}
        <div className="text-center pt-2 text-xs text-muted border-t border-glass-border">
          <span>{t("auth_already_have_acc")} </span>
          <Link href="/login" className="text-primary font-bold hover:underline">
            {t("nav_login")}
          </Link>
        </div>

      </div>
    </GlassCard>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<div className="text-center p-8 text-muted">Loading registration terminal...</div>}>
        <SignupFormContent />
      </Suspense>
    </AuthLayout>
  );
}
