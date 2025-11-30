'use client';

import { useSession } from "next-auth/react";

export default function AccessToken() {
  const { data: session } = useSession();

  return (
    <div>
      Access Token: {session?.accessToken ?? "No token"}
    </div>
  );
}
