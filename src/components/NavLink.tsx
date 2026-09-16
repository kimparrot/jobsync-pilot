import React, { ForwardRefExoticComponent, RefAttributes } from "react";
import Link from "next/link";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  label: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  route: string;
  pathname: string;
  expanded: boolean;
}

/** "/dashboard" is a prefix of every other route, so it only matches exactly. */
export function isNavRouteActive(pathname: string, route: string) {
  return (
    pathname === route ||
    (route !== "/dashboard" && pathname.startsWith(`${route}/`))
  );
}

function NavLink({ label, Icon, route, pathname, expanded }: NavLinkProps) {
  const isActive = isNavRouteActive(pathname, route);

  const link = (
    <Link
      href={route}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "navlink h-10 w-full min-h-10 hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        isActive && "bg-accent",
        expanded ? "rounded-md" : "rounded-sm",
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-0.5 rounded-full bg-brand"
        />
      )}
      {/* Fixed-width lead box (= collapsed rail width) so the icon sits at the
          same spot in both states and never moves during the slide. */}
      <span className="flex h-full w-14 shrink-0 items-center justify-center">
        <Icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
      </span>
      <span
        className={cn(
          "truncate text-sm motion-safe:transition-opacity motion-safe:duration-200",
          expanded ? "opacity-100 delay-100" : "opacity-0",
        )}
      >
        {label}
      </span>
    </Link>
  );

  // Always render the Tooltip wrapper so the <Link> keeps a stable position in
  // the tree across expand/collapse — remounting it would reset the CSS
  // transitions and make the toggle snap instead of animate.
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );
}

export default NavLink;
