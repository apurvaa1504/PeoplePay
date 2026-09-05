"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user?.role === "EMPLOYEE" && data.user?.employeeId) {
        router.push(`/employees/${data.user.employeeId}`);
      } else {
        router.push("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8FA] px-4">
      <div className="w-full max-w-sm bg-white rounded-lg border border-[#E8E3EA] p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#26232A] mb-1">Log in</h1>
        <p className="text-sm text-[#77717B] mb-6">PeoplePay360</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-xs text-[#B56767] font-medium">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Log in
          </Button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-4 border-t border-[#E8E3EA]">
          <p className="text-[11px] font-semibold text-[#77717B] uppercase tracking-wider mb-2">
            Quick Demo Logins (password123)
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@peoplepay360.com");
                setPassword("password123");
              }}
              className="text-left px-2.5 py-1.5 rounded text-xs bg-[#F9F8FA] hover:bg-[#F1EBF3] text-[#524E57] hover:text-[#71547D] transition-colors flex items-center justify-between"
            >
              <span>admin@peoplepay360.com</span>
              <span className="text-[10px] font-semibold text-[#9B7FA6]">ADMIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("hr@peoplepay360.com");
                setPassword("password123");
              }}
              className="text-left px-2.5 py-1.5 rounded text-xs bg-[#F9F8FA] hover:bg-[#F1EBF3] text-[#524E57] hover:text-[#71547D] transition-colors flex items-center justify-between"
            >
              <span>hr@peoplepay360.com</span>
              <span className="text-[10px] font-semibold text-[#9B7FA6]">HR_MANAGER</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("employee@peoplepay360.com");
                setPassword("password123");
              }}
              className="text-left px-2.5 py-1.5 rounded text-xs bg-[#F9F8FA] hover:bg-[#F1EBF3] text-[#524E57] hover:text-[#71547D] transition-colors flex items-center justify-between"
            >
              <span>employee@peoplepay360.com</span>
              <span className="text-[10px] font-semibold text-[#9B7FA6]">EMPLOYEE</span>
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-[#77717B] text-center">
          Don't have an account?{" "}
          <a href="/signup" className="text-[#9B7FA6] font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}