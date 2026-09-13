"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/easy-card/shared/") ||
        pathname === "/privacy-policy" ||
        pathname === "/terms-of-service";

      if (!isPublic) {
        router.replace("/auth");
      }
    }
  }, [status, pathname, router]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <AuthWatcher />
      {children}
    </SessionProvider>
  );
}
