"use client";
"use no memo";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import Button from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { isAdmin, isContributor } from "@/lib/userInterface";
import { resetPostHogUser } from "@/lib/posthog-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn";

function themeToLightOrDark(
  theme: string | null,
): "light" | "dark" | undefined {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return undefined;
}

function get_current_theme(): "light" | "dark" | undefined {
  // it's currently saved in the document?
  if (
    typeof document !== "undefined" &&
    document.body.dataset.theme &&
    document.body.dataset.theme !== "undefined"
  ) {
    return themeToLightOrDark(document.body.dataset.theme);
  }
  if (typeof window !== "undefined") {
    // it has been previously saved in the window?
    if (
      window.localStorage.getItem("theme") !== undefined &&
      window.localStorage.getItem("theme") !== "undefined"
    ) {
      return themeToLightOrDark(window.localStorage.getItem("theme"));
    }
    // or the user has a preference?
    if (window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark";
    return "light";
  }
  // or we don't know yet
  return undefined;
}

function useDarkLight() {
  const [activeTheme, setActiveTheme] = useState<"light" | "dark" | undefined>(
    undefined,
  );
  const inactiveTheme = activeTheme === "light" ? "dark" : "light";
  //...

  useEffect(() => {
    if (activeTheme === undefined) {
      setActiveTheme(get_current_theme());
    } else {
      document.body.dataset.theme = activeTheme;
      window.localStorage.setItem("theme", activeTheme);
    }
  }, [activeTheme]);

  return {
    set: setActiveTheme,
    toggle: () => setActiveTheme(inactiveTheme),
    value: activeTheme,
  };
}

export function LogInButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push("/auth/signin")} data-cy="login-button">
      Log in
    </Button>
  );
}

export function LoggedInButton({
  page,
  course_id,
  user,
}: {
  page: string;
  course_id?: string;
  user?: {
    name?: string | null;
    image?: string | null;
    role?: boolean | string | null;
    admin?: boolean | null;
  };
}) {
  //const { data: session } = useSession();
  const controls = useDarkLight();
  const router = useRouter();

  const segment = useSelectedLayoutSegments();
  if (course_id === "segment") {
    if (segment[0] === "course") course_id = segment[1];
    else course_id = segment[0];
  }

  let editor_link = "/editor";
  if (course_id && course_id.includes("-"))
    editor_link = "/editor/course/" + course_id;
  let stories_link = "/";
  if (course_id) stories_link = "/" + course_id;

  if (user === undefined)
    return (
      <Button
        onClick={() => router.push("/auth/signin")}
        data-cy="login-button"
      >
        Log in
      </Button>
    );

  const canContribute = isContributor(user ?? null);
  const isAdminUser = isAdmin(user ?? null);
  const dropdownButtonClass =
    "w-full overflow-hidden text-left text-[var(--text-color)] no-underline [text-overflow:ellipsis] whitespace-nowrap";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-[50px] w-[50px] min-w-[50px] items-center justify-center rounded-[30px] bg-[var(--profile-background)] p-0 text-center text-[28px] leading-none uppercase text-[var(--profile-text)] outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--button-background)] focus-visible:ring-offset-2"
          data-cy="user-button"
          aria-label="Open user menu"
          style={
            user?.image ? { backgroundImage: `url('${user?.image}')` } : {}
          }
        >
          {(user.name ?? "").substring(0, 1)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[180px] overflow-visible"
        sideOffset={10}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[12px] right-[11px] h-[13px] w-[28px] overflow-hidden"
        >
          <svg
            viewBox="0 0 28 13"
            className="absolute inset-0 h-[13px] w-[28px]"
            aria-hidden="true"
          >
            <path
              d="M14 0.5 Q15.5 0.5 16.5 1.7 L28 13 H0 L11.5 1.7 Q12.5 0.5 14 0.5 Z"
              fill="var(--header-border)"
            />
            <path
              d="M14 1.5 Q15 1.5 15.8 2.4 L26 13 H2 L12.2 2.4 Q13 1.5 14 1.5 Z"
              fill="var(--body-background)"
            />
          </svg>
        </div>
        <DropdownMenuItem asChild>
          <Link
            className={dropdownButtonClass}
            href={"/profile"}
            data-cy="user-profile"
          >
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="button_dark_mode"
          data-cy="user-lightdark"
          onSelect={() => {
            controls.toggle();
          }}
        >
          {controls.value === "light"
            ? "Dark Mode"
            : controls.value === "dark"
              ? "Light Mode"
              : "Light/Dark"}
        </DropdownMenuItem>
        {canContribute && page !== "stories" ? (
          <DropdownMenuItem asChild>
            <Link
              className={dropdownButtonClass}
              href={stories_link}
              data-cy="user-stories"
            >
              Stories
            </Link>
          </DropdownMenuItem>
        ) : null}
        {canContribute && page !== "editor" ? (
          <DropdownMenuItem asChild>
            <Link
              className={dropdownButtonClass}
              href={editor_link}
              data-cy="user-editor"
            >
              Editor
            </Link>
          </DropdownMenuItem>
        ) : null}
        {canContribute && page !== "docs" ? (
          <DropdownMenuItem asChild>
            <Link
              className={dropdownButtonClass}
              href={"/docs"}
              data-cy="user-docs"
            >
              Docs
            </Link>
          </DropdownMenuItem>
        ) : null}
        {isAdminUser && page !== "admin" ? (
          <DropdownMenuItem asChild>
            <Link
              className={dropdownButtonClass}
              href={"/admin"}
              data-cy="user-admin"
            >
              Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-cy="user-logout"
          onSelect={async () => {
            await authClient.signOut();
            resetPostHogUser();
            window.location.href = "/";
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
