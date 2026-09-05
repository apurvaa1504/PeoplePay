"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("peoplepay_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (user?.role === "EMPLOYEE") {
        if (user.employeeId) {
          router.replace(`/employees/${user.employeeId}`);
        } else {
          router.replace("/employees");
        }
      } else {
        router.replace("/dashboard");
      }
    } catch {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBFD]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-[#9B7FA6] border-t-transparent animate-spin" />
        <p className="text-xs text-[#77717B]">Redirecting...</p>
      </div>
    </div>
  );
}
