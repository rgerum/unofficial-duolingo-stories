"use client";
"use no memo";

import React, { useEffect, useState } from "react";
import Dropdown from "../layout/dropdown";
import Link from "next/link";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import Button from "../layout/button";
import { authClient } from "@/lib/auth-client";
import { isAdmin, isContributor } from "@/lib/userInterface";
import posthog from "posthog-js";

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
    "block h-[39px] cursor-pointer overflow-hidden border-b border-[var(--header-border)] p-[5px] text-center text-[18px] font-bold text-[var(--text-color)] no-underline [text-overflow:ellipsis] [text-transform:none] whitespace-nowrap hover:bg-[var(--language-selector-hover-background)] hover:text-[var(--link-hover)]";

  return (
    <Dropdown>
      <div
        className="h-[50px] w-[50px] min-w-[50px] rounded-[30px] bg-[var(--profile-background)] pt-1 text-center text-[28px] uppercase text-[var(--profile-text)]"
        data-cy="user-button"
        style={user?.image ? { backgroundImage: `url('${user?.image}')` } : {}}
      >
        {(user.name ?? "").substring(0, 1)}
      </div>
      <div>
        <Link
          className={dropdownButtonClass}
          href={"/profile"}
          data-cy="user-profile"
        >
          Profile
        </Link>
        {
          <div
            className={`${dropdownButtonClass} button_dark_mode`}
            data-cy="user-lightdark"
            onClick={() => {
              controls.toggle();
            }}
          >
            {controls.value === "light"
              ? "Dark Mode"
              : controls.value === "dark"
                ? "Light Mode"
                : "Light/Dark"}
          </div>
        }
        {canContribute && page !== "stories" ? (
          <Link
            className={dropdownButtonClass}
            href={stories_link}
            data-cy="user-stories"
          >
            Stories
          </Link>
        ) : null}
        {canContribute && page !== "editor" ? (
          <Link
            className={dropdownButtonClass}
            href={editor_link}
            data-cy="user-editor"
          >
            Editor
          </Link>
        ) : null}
        {canContribute && page !== "docs" ? (
          <Link
            className={dropdownButtonClass}
            href={"/docs"}
            data-cy="user-docs"
          >
            Docs
          </Link>
        ) : null}
        {isAdminUser && page !== "admin" ? (
          <Link
            className={dropdownButtonClass}
            href={"/admin"}
            data-cy="user-admin"
          >
            Admin
          </Link>
        ) : null}
        <div
          className={dropdownButtonClass}
          onClick={async () => {
            await authClient.signOut();
            posthog.reset();
            window.location.href = "/";
          }}
          data-cy="user-logout"
        >
          Log out
        </div>
      </div>
    </Dropdown>
  );
}
