"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CornerDownLeftIcon,
  FileTextIcon,
  HashIcon,
  SearchIcon,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
} from "@ui-sdk/react/command";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogShortcut,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react/dialog";
import { popupTextReset } from "@/components/ui/ui-sdk";
import { cn } from "@/lib/utils";
import {
  docsSearchButtonClass,
  docsSearchLabelClass,
  docsSearchShortcutClass,
} from "../Docs/docsClasses";
import {
  type DocsSearchIndex,
  type TextPart,
  searchDocs,
  sectionHref,
} from "./docs_search_index";

const backdropClass =
  "fixed inset-0 z-[16] bg-black/20 [backdrop-filter:blur(4px)] transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none";
const contentClass = cn(
  popupTextReset,
  "fixed inset-x-0 top-[12vh] z-[100] m-0 mx-auto flex max-h-[min(560px,76dvh)] w-[min(640px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[14px] bg-white p-0 text-[16px] leading-[1.5] text-black shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_16px_-4px_rgba(0,0,0,0.06),0_24px_48px_-12px_rgba(0,0,0,0.18)] outline-none",
  "transition-[opacity,scale] duration-150 data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0 motion-reduce:transition-none",
  "max-[640px]:top-auto max-[640px]:bottom-0 max-[640px]:h-[85dvh] max-[640px]:max-h-none max-[640px]:w-full max-[640px]:rounded-b-none",
);
const itemClass =
  "group flex cursor-pointer items-start gap-3 rounded-[10px] px-3 py-2 text-black no-underline data-highlighted:bg-[#eaf4ff]";
const groupLabelClass =
  "px-3 pt-3 pb-1 text-[12px] font-bold tracking-[0.08em] text-slate-500 uppercase";

function Marked({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark
            key={i}
            className="rounded-[3px] bg-[#cfe6ff] px-px text-inherit"
          >
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        ),
      )}
    </>
  );
}

function partsText(parts: TextPart[]) {
  return parts.map((part) => part.text).join("");
}

function SearchItem({
  value,
  href,
  label,
  icon,
  title,
  detail,
  description,
  indent = false,
  onNavigate,
}: {
  value: string;
  href: string;
  /** The item's name, for search matching and assistive technology. */
  label: string;
  /** Plain text of `detail`, added to the accessible name. */
  description?: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  detail?: React.ReactNode;
  indent?: boolean;
  onNavigate: (event: Event, href: string) => void;
}) {
  return (
    <CommandItem
      value={value}
      label={label}
      aria-label={description ? `${label}: ${description}` : label}
      className={cn(itemClass, indent && "pl-9")}
      // Runs for clicks, Enter (which clicks the link) and an agent's `run`.
      onSelect={(event) => onNavigate(event, href)}
      render={<Link href={href} />}
    >
      <span
        aria-hidden="true"
        className="mt-[3px] shrink-0 text-slate-400 [&_svg]:size-4"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        {/* Keeps the title and detail apart in the item's text, which names it. */}
        {detail ? <span className="sr-only">: </span> : null}
        {detail ? (
          <span className="line-clamp-2 text-[14px] text-slate-600">
            {detail}
          </span>
        ) : null}
      </span>
      <CornerDownLeftIcon
        aria-hidden="true"
        className="mt-[3px] size-4 shrink-0 text-slate-400 opacity-0 group-data-highlighted:opacity-100"
      />
    </CommandItem>
  );
}

export default function DocsSearch({ index }: { index: DocsSearchIndex }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const pendingHref = React.useRef<string | null>(null);
  const results = React.useMemo(() => searchDocs(index, query), [index, query]);
  const searching = query.trim().length > 0;

  const groups = React.useMemo(() => {
    const byGroup = new Map<string, DocsSearchIndex>();
    for (const page of index) {
      byGroup.set(page.group, [...(byGroup.get(page.group) ?? []), page]);
    }
    return [...byGroup];
  }, [index]);

  // Close first and navigate once the dialog is gone, so releasing its scroll
  // lock can't undo the scroll to a #section. Modified clicks are left to the
  // browser, which opens the link in a new tab or window.
  function onNavigate(event: Event, href: string) {
    if (
      event instanceof MouseEvent &&
      (event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey)
    ) {
      return;
    }
    // Stops the link's own navigation and Next's client-side routing.
    event.preventDefault();
    pendingHref.current = href;
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setQuery("");
      }}
      onOpenChangeComplete={(isOpen) => {
        if (isOpen || !pendingHref.current) return;
        router.push(pendingHref.current);
        pendingHref.current = null;
      }}
    >
      <DialogTrigger
        id="search"
        className={docsSearchButtonClass}
        shortcut="mod+k"
      >
        <span className={docsSearchLabelClass}>Search Documentation...</span>
        <DialogShortcut className={docsSearchShortcutClass} />
      </DialogTrigger>
      <DialogBackdrop className={backdropClass} />
      <DialogContent className={contentClass} id="search_modal">
        <DialogTitle className="sr-only">Docs search</DialogTitle>
        <Command
          filter={false}
          query={query}
          onQueryChange={(next) => setQuery(next)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <SearchIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-slate-400"
            />
            <CommandInput
              aria-label="Search documentation"
              placeholder="Search documentation…"
              className="min-w-0 flex-1 border-0 bg-transparent text-[17px] text-black outline-none placeholder:text-slate-400"
            />
            <DialogClose className="shrink-0 rounded-[6px] border border-slate-200 px-[6px] py-[2px] text-[12px] text-slate-500 hover:bg-slate-50">
              Esc
            </DialogClose>
          </div>
          <CommandEmpty className="text-center text-slate-500 data-empty:px-4 data-empty:py-10">
            No results for “{query.trim()}”
          </CommandEmpty>
          <CommandList className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {searching
              ? results.map((result) => {
                  const intro = result.hits.find((hit) => !hit.section.heading);
                  const sections = result.hits.filter(
                    (hit) => hit.section.heading,
                  );
                  return (
                    <CommandGroup key={result.page.slug}>
                      <CommandGroupLabel className={groupLabelClass}>
                        {result.page.group || "Documentation"}
                      </CommandGroupLabel>
                      <SearchItem
                        value={`page:${result.page.slug}`}
                        href={`/docs/${result.page.slug}`}
                        label={result.page.title}
                        description={
                          intro
                            ? partsText(intro.snippet)
                            : result.page.description
                        }
                        icon={<FileTextIcon />}
                        title={<Marked parts={result.title} />}
                        detail={
                          intro ? (
                            <Marked parts={intro.snippet} />
                          ) : (
                            result.page.description
                          )
                        }
                        onNavigate={onNavigate}
                      />
                      {sections.map((hit) => (
                        <SearchItem
                          key={hit.section.id}
                          value={`section:${hit.section.id}`}
                          href={sectionHref(hit.section)}
                          label={`${result.page.title} › ${hit.section.heading}`}
                          description={partsText(hit.snippet)}
                          icon={<HashIcon />}
                          title={
                            hit.heading ? <Marked parts={hit.heading} /> : null
                          }
                          detail={<Marked parts={hit.snippet} />}
                          indent
                          onNavigate={onNavigate}
                        />
                      ))}
                    </CommandGroup>
                  );
                })
              : groups.map(([group, pages]) => (
                  <CommandGroup key={group}>
                    <CommandGroupLabel className={groupLabelClass}>
                      {group || "Documentation"}
                    </CommandGroupLabel>
                    {pages.map((page) => (
                      <SearchItem
                        key={page.slug}
                        value={`page:${page.slug}`}
                        href={`/docs/${page.slug}`}
                        label={page.title}
                        description={page.description}
                        icon={<FileTextIcon />}
                        title={page.title}
                        detail={page.description}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </CommandGroup>
                ))}
          </CommandList>
          <div className="hidden items-center gap-4 border-t border-slate-200 px-4 py-2 text-[12px] text-slate-500 sm:flex">
            <span>
              <kbd className="font-sans">↑</kbd>{" "}
              <kbd className="font-sans">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-sans">Enter</kbd> to open
            </span>
            <span>
              <kbd className="font-sans">Esc</kbd> to clear or close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
