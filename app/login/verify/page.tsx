"use client";

import { useState } from "react";

export default function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    setIsLoading(false);

    if (res.ok) {
      // code valid → user should now be verified & logged in
      window.location.href = "/dashboard";
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Invalid or expired code");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="123456"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
