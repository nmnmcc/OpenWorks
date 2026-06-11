"use client";

import { authDialogAtom } from "@/atoms/auth-dialog";
import { unreadCountQuery } from "@/atoms/notifications";
import { postComposeDialogAtom } from "@/atoms/post-compose-dialog";
import {
  BottomNavigation,
  BottomNavigationItem,
  BottomNavigationItemIcon,
  BottomNavigationItemLabel,
  BottomNavigationList,
} from "@/components/ui/bottom-navigation";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { BellIcon, BookOpenIcon, HomeIcon, PlusIcon, UserIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Mobile (<640px)
 * +--------------------------------------------+
 * | Home  | Library |  +  | Notif  | Profile  |
 * | [ic]  |  [ic]   | [ic]|  [ic]  |  [ic]    |
 * | Home  | Library | New | Notif  | Profile   |
 * +--------------------------------------------+
 * fixed bottom-0, full width, border-t, backdrop-blur
 * safe-area-inset-bottom padding for notched devices
 *
 * Tablet (640-1023px)
 * +--------------------------------------------+
 * | Home  | Library |  +  | Notif  | Profile  |
 * | [ic]  |  [ic]   | [ic]|  [ic]  |  [ic]    |
 * | Home  | Library | New | Notif  | Profile   |
 * +--------------------------------------------+
 * same as mobile
 *
 * Desktop (1024-1535px)
 * (hidden -- lg:hidden, sidebar takes over)
 *
 * Ultra-wide (>=1536px)
 * (hidden -- lg:hidden, sidebar takes over)
 */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [t] = useT();
  const { data: session } = authClient.useSession();
  const setAuthDialog = useAtomSet(authDialogAtom);
  const setPostComposeDialog = useAtomSet(postComposeDialogAtom);
  const notifResult = useAtomValue(unreadCountQuery);
  const unreadCount = AsyncResult.isSuccess(notifResult) ? notifResult.value.count : 0;

  const currentTab =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/library")
        ? "library"
        : pathname.startsWith("/notifications")
          ? "notifications"
          : pathname.startsWith("/users/")
            ? "profile"
            : "home";

  function handleValueChange(details: { value: string }) {
    if (details.value === "create") return;

    if (details.value === "home") router.push("/");
    else if (details.value === "library") router.push("/library");
    else if (details.value === "notifications") router.push("/notifications");
    else if (details.value === "profile") {
      if (session) router.push(`/users/${session.user.id}`);
      else setAuthDialog({ open: true, mode: "login" });
    }
  }

  function handleCreate() {
    setPostComposeDialog({ open: true, spaceId: "" });
  }

  return (
    <BottomNavigation className="lg:hidden" value={currentTab} onValueChange={handleValueChange}>
      <BottomNavigationList>
        <BottomNavigationItem value="home">
          <BottomNavigationItemIcon>
            <HomeIcon />
          </BottomNavigationItemIcon>
          <BottomNavigationItemLabel>{t.nav.home}</BottomNavigationItemLabel>
        </BottomNavigationItem>

        <BottomNavigationItem value="library">
          <BottomNavigationItemIcon>
            <BookOpenIcon />
          </BottomNavigationItemIcon>
          <BottomNavigationItemLabel>{t.library.title}</BottomNavigationItemLabel>
        </BottomNavigationItem>

        <BottomNavigationItem onClick={handleCreate} value="create">
          <BottomNavigationItemIcon>
            <PlusIcon />
          </BottomNavigationItemIcon>
          <BottomNavigationItemLabel>{t.nav.createPost}</BottomNavigationItemLabel>
        </BottomNavigationItem>

        <BottomNavigationItem className="relative" value="notifications">
          <BottomNavigationItemIcon>
            <BellIcon />
            {unreadCount > 0 && (
              <span className="bg-destructive absolute -top-0.5 right-1/4 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </BottomNavigationItemIcon>
          <BottomNavigationItemLabel>{t.nav.notifications}</BottomNavigationItemLabel>
        </BottomNavigationItem>

        <BottomNavigationItem value="profile">
          <BottomNavigationItemIcon>
            <UserIcon />
          </BottomNavigationItemIcon>
          <BottomNavigationItemLabel>{t.nav.profile}</BottomNavigationItemLabel>
        </BottomNavigationItem>
      </BottomNavigationList>
    </BottomNavigation>
  );
}
