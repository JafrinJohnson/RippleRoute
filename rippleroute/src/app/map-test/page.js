"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MapTestRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/live-map");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-muted font-mono text-sm">
      Redirecting to Live Fleet Map...
    </div>
  );
}
