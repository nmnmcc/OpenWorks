"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/posts" className="font-semibold text-lg">
        OpenWorks
      </Link>

      {isPending ? (
        <div className="h-8" />
      ) : session ? (
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">{session.user.name}</span>
          <Button variant="outline" size="sm" onClick={() => authClient.signOut().then(() => router.push("/login"))}>
            Sign out
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
            Sign in
          </Button>
          <Button size="sm" onClick={() => router.push("/register")}>
            Sign up
          </Button>
        </div>
      )}
    </header>
  );
}
