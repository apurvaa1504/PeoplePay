"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        body: JSON.stringify({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: "EMPLOYEE",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setIsLoading(false);
        return;
      }

      // Automatically log the user in if token returned or redirect to login
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.employeeId) {
          router.push(`/employees/${data.user.employeeId}`);
        } else {
          router.push("/");
        }
      } else {
        router.push("/login");
      }
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
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Rahul"
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Verma"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
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