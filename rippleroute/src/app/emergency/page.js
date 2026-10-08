"use client";

import React from "react";
import RoleGuard from "@/components/RoleGuard";
import DriverDashboard from "@/components/DriverDashboard";

export default function EmergencyPage() {
  return (
    <RoleGuard allowedRole="emergency">
      <DriverDashboard mode="emergency" />
    </RoleGuard>
  );
}
