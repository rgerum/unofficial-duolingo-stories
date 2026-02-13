"use client";
import React from "react";
import styles from "./DocsHeader.module.css";
import Link from "next/link";
import DocsSearchModal from "../DocsSearchModal";
import useKeypress from "@/hooks/use-keypress.hook";
import * as Dialog from "@radix-ui/react-dialog";

function DocsHeader() {
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");

  function doShow(value: boolean) {
    setShowSearch(value);
    setSearchText("");
  }
  useKeypress(
    "ctrl+k",
    (e: KeyboardEvent | number) => {
      if (typeof e !== "number") {
        e.preventDefault();
        !showSearch && doShow(true);
      }
    },
    "keydown",
  );

  return (
    <>
      <div className={styles.navbar}>
        <div className={styles.navbar_inner}>
          <div className={styles.navbar_logo}>
            <Link href="/">Duostories</Link>
          </div>

          <Dialog.Root open={showSearch} onOpenChange={doShow}>
            <Dialog.Trigger asChild={true}>
              <button
                id="search"
                className={styles.search}
                onClick={() => doShow(true)}
              >
                <span>
                  <span>Search Documentation...</span>
                </span>
                <span>Ctrl K</span>
              </button>
            </Dialog.Trigger>
            <DocsSearchModal
              showSearch={showSearch}
              setShowSearch={doShow}
              searchText={searchText}
              setSearchText={setSearchText}
            />
          </Dialog.Root>
        </div>
      </div>
    </>
  );
}

export default DocsHeader;
