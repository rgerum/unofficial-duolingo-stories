"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button, buttonVariants, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/shadcn";

const links = [
  { href: "/admin2", label: "Overview" },
  { href: "/admin2/users", label: "Users" },
  { href: "/admin2/languages", label: "Languages" },
  { href: "/admin2/courses", label: "Courses" },
  { href: "/admin2/story", label: "Story" },
  { href: "/admin", label: "Legacy Admin" },
];

export default function Admin2Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <div className="mr-2 whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-slate-500">Admin2</div>
        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${buttonVariants({ variant: "secondary", size: "sm" })} whitespace-nowrap`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Open admin navigation">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Admin2 Navigation</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
