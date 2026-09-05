"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
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
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setIsLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F8FA] px-4">
      <div className="w-full max-w-sm bg-white rounded-lg border border-[#E8E3EA] p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#26232A] mb-1">Sign up</h1>
        <p className="text-sm text-[#77717B] mb-6">Create your PeoplePay360 account</p>

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
            helperText="At least 8 characters"
          />

          {error && (
            <p className="text-xs text-[#B56767] font-medium">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign up
          </Button>
        </form>

        <p className="mt-4 text-xs text-[#77717B] text-center">
          Already have an account?{" "}
          <a href="/login" className="text-[#9B7FA6] font-medium">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}