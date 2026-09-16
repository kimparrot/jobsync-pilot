"use client";
import Link from "next/link";

import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONSTANTS, SIDEBAR_LINKS } from "@/lib/constants";
import NavLink from "./NavLink";
import { BrandMark, BRAND_NAME } from "./Brand";
import { ProfileDropdown } from "./ProfileDropdown";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { CurrentUser } from "@/models/user.model";

interface SidebarProps {
  user: CurrentUser | null;
  signOutAction: () => void;
}

function Sidebar({ user, signOutAction }: SidebarProps) {
  const path = usePathname();
  const { expanded } = useSidebar();
  const isOnDashboard = path === "/dashboard";

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        id={APP_CONSTANTS.SIDEBAR_DOM_ID}
        className={cn(
          "shell-nav fixed inset-y-0 left-0 z-10 hidden flex-col overflow-x-hidden border-r transition-[width] duration-200 ease-in-out motion-reduce:transition-none sm:flex",
          expanded
            ? APP_CONSTANTS.SIDEBAR_WIDTH.expanded.rail
            : APP_CONSTANTS.SIDEBAR_WIDTH.collapsed.rail,
        )}
      >
        <div className="flex h-14 shrink-0 items-center overflow-hidden sm:mt-2">
          <div className="flex w-14 shrink-0 items-center justify-center">
            <Link
              href="/dashboard"
              aria-current={isOnDashboard ? "page" : undefined}
              onClick={(e) => {
                if (isOnDashboard) e.preventDefault();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BrandMark className="h-8 w-8" />
              <span className="sr-only">{BRAND_NAME}</span>
            </Link>
          </div>
          <span
            className={cn(
              "text-display truncate text-[15px] motion-safe:transition-opacity motion-safe:duration-200",
              expanded ? "opacity-100 delay-100" : "opacity-0",
            )}
          >
            {BRAND_NAME}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto py-2">
          {SIDEBAR_LINKS.map((item) => {
            // Only show dev-only items in development mode
            if (item.devOnly && process.env.NODE_ENV !== "development") {
              return null;
            }
            return (
              <NavLink
                key={item.label}
                label={item.label}
                Icon={item.icon}
                route={item.route}
                pathname={path}
                expanded={expanded}
              />
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border py-2">
          <ProfileDropdown
            user={user}
            expanded={expanded}
            signOutAction={signOutAction}
          />
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default Sidebar;
