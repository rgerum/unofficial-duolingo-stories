"use client";
import React from "react";
import Link from "next/link";
import DocsSearchModal from "../DocsSearchModal";
import useKeypress from "@/hooks/use-keypress.hook";
import * as Dialog from "@radix-ui/react-dialog";
import {
  docsHeaderBarClass,
  docsHeaderInnerClass,
  docsHeaderLogoClass,
  docsSearchButtonClass,
  docsSearchLabelClass,
  docsSearchShortcutClass,
} from "../Docs/docsClasses";

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
      <div className={docsHeaderBarClass}>
        <div className={docsHeaderInnerClass}>
          <div className={docsHeaderLogoClass}>
            <Link href="/">Duostories</Link>
          </div>

          <Dialog.Root open={showSearch} onOpenChange={doShow}>
            <Dialog.Trigger asChild={true}>
              <button
                id="search"
                className={docsSearchButtonClass}
                onClick={() => doShow(true)}
              >
                <span className={docsSearchLabelClass}>
                  Search Documentation...
                </span>
                <span className={docsSearchShortcutClass}>Ctrl K</span>
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
