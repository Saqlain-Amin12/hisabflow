"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUsername } from "@/lib/profile";

export function useAuthGuard() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUsername();
    if (!u) { router.replace("/login"); return; }
    setUsername(u);
  }, [router]);

  return username;
}
