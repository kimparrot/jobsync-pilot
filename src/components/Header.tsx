"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SIDEBAR_LINKS } from "@/lib/constants";
import SidebarToggle from "./SidebarToggle";
import { AgentChatTrigger } from "./AgentChatTrigger";
import { Brand, BRAND_NAME, BRAND_TAGLINE } from "./Brand";
import { isNavRouteActive } from "./NavLink";
import { cn } from "@/lib/utils";

function Header() {
  const path = usePathname();

  return (
    <header className="shell-header sticky top-0 z-30 flex h-14 items-center gap-3 overflow-hidden border-b bg-card/90 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:backdrop-blur-none">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 sm:hidden"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="shell-nav w-[min(100%,20rem)] overflow-x-hidden p-0 sm:max-w-xs"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-14 items-center gap-2 overflow-hidden border-b border-border pr-12 pl-4">
            <SheetClose asChild>
              <Link
                href="/dashboard"
                className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Brand markClassName="h-8 w-8" />
              </Link>
            </SheetClose>
          </div>
          <nav className="grid gap-1 overflow-y-auto p-3 text-base font-medium">
            {SIDEBAR_LINKS.map((item) => {
              // Only show dev-only items in development mode
              if (item.devOnly && process.env.NODE_ENV !== "development") {
                return null;
              }
              const isActive = isNavRouteActive(path, item.route);
              return (
                <SheetClose asChild key={item.label}>
                  <Link
                    href={item.route}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isActive && "bg-accent text-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <SidebarToggle />
      <h1 className="flex min-w-0 items-baseline gap-2">
        <span className="text-display truncate text-[15px] sm:text-base">
          {BRAND_NAME}
        </span>
        <span className="hidden truncate font-sans text-sm font-normal text-muted-foreground sm:inline">
          {BRAND_TAGLINE}
        </span>
      </h1>
      <div className="relative ml-auto flex min-w-0 flex-1 justify-end md:grow-0">
        <AgentChatTrigger />
      </div>
    </header>
  );
}

export default Header;
