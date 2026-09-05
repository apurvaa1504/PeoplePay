import { signToken } from "./auth";

/**
 * Returns a valid JWT for Person A (HR_MANAGER) if no token exists in localStorage,
 * allowing authorized operations like manual attendance correction in the client.
 */
export function getClientAuthToken(): string {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("peoplepay_token");
    if (existing) return existing;

    // Generate valid HR_MANAGER token
    const token = signToken({
      userId: "usr-person-a-manager",
      role: "HR_MANAGER",
    });
    localStorage.setItem("peoplepay_token", token);
    return token;
  }
  return signToken({
    userId: "usr-person-a-manager",
    role: "HR_MANAGER",
  });
}
