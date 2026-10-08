"use client";

import React from "react";
import RoleGuard from "@/components/RoleGuard";
import DriverDashboard from "@/components/DriverDashboard";

export default function DriverPage() {
  return (
    <RoleGuard allowedRole="driver">
      <DriverDashboard mode="driver" />
    </RoleGuard>
  );
}
