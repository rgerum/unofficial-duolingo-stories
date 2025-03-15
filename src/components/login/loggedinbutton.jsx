"use client";

import styles from "./loggedinbutton.module.css";
import styles2 from "./login.module.css";
import React, { useEffect, useState } from "react";
import Dropdown from "../layout/dropdown";
import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import Button from "../layout/button";
import { getUser } from "@/lib/userInterface";

function get_current_theme() {
  // it's currently saved in the document?
  if (
    typeof document !== "undefined" &&
    document.body.dataset.theme &&
    document.body.dataset.theme !== "undefined"
  ) {
    return document.body.dataset.theme;
  }
  if (typeof window !== "undefined") {
    // it has been previously saved in the window?
    if (
      window.localStorage.getItem("theme") !== undefined &&
      window.localStorage.getItem("theme") !== "undefined"
    ) {
      return window.localStorage.getItem("theme");
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
  const [activeTheme, setActiveTheme] = useState(undefined);
  const inactiveTheme = activeTheme === "light" ? "dark" : "light";
  //...

  useEffect(() => {
    if (activeTheme === undefined || activeTheme === "undefined") {
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
  return (
    <Button onClick={() => signIn()} data-cy="login-button">
      Log in
    </Button>
  );
}

export function LoggedInButton({ page, course_id, user }) {
  //const { data: session } = useSession();
  const controls = useDarkLight();

  if (course_id === "segment") {
    const segment = useSelectedLayoutSegments();
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
      <Button onClick={() => signIn()} data-cy="login-button">
        Log in
      </Button>
    );
  return (
    <Dropdown>
      <div
        className={styles.round}
        data-cy="user-button"
        style={user?.image ? { backgroundImage: `url('${user?.image}')` } : {}}
      >
        {user.name.substring(0, 1)}
      </div>
      <div>
        <Link
          className={styles.profile_dropdown_button}
          href={"/profile"}
          data-cy="user-profile"
        >
          Profile
        </Link>
        {
          <div
            className={styles.profile_dropdown_button + "  button_dark_mode"}
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
        {user?.role && page !== "stories" ? (
          <Link
            className={styles.profile_dropdown_button}
            href={stories_link}
            data-cy="user-stories"
          >
            Stories
          </Link>
        ) : null}
        {user?.role && page !== "editor" ? (
          <Link
            className={styles.profile_dropdown_button}
            href={editor_link}
            data-cy="user-editor"
          >
            Editor
          </Link>
        ) : null}
        {user?.role && page !== "docs" ? (
          <Link
            className={styles.profile_dropdown_button}
            href={"/docs"}
            data-cy="user-docs"
          >
            Docs
          </Link>
        ) : null}
        {user?.admin && page !== "admin" ? (
          <Link
            className={styles.profile_dropdown_button}
            href={"/admin"}
            data-cy="user-admin"
          >
            Admin
          </Link>
        ) : null}
        <div
          className={styles.profile_dropdown_button}
          onClick={() => signOut()}
          data-cy="user-logout"
        >
          Log out
        </div>
      </div>
    </Dropdown>
  );
}
