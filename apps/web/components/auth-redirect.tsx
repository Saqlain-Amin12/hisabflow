"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUsername } from "@/lib/profile";

export function AuthRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (getStoredUsername()) router.replace("/individual");
  }, [router]);
  return null;
}
