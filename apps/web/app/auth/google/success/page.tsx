"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setStoredUsername, setStoredDisplayName } from "@/lib/profile";

export default function GoogleSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const username = searchParams.get("username");
    const displayName = searchParams.get("display_name");
    if (username) {
      setStoredUsername(username);
      setStoredDisplayName(displayName || username);
      router.replace("/individual");
    } else {
      router.replace("/login?error=google_failed");
    }
  }, [searchParams, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e0e7ff", borderTop: "3px solid #4a7af5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
