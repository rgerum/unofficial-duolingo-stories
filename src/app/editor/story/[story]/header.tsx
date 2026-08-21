import React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import Switch from "@/components/ui/switch";
import MobileEditorHeader, {
  mobileEditorMenuItemClassName,
} from "@/app/editor/_components/mobile_editor_header";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import EditorButton from "../../editor_button";
import { EditorHeaderActions } from "../../_components/header_context";
import type { StoryData } from "./types";

type StoryNavigationTarget = {
  href: string;
  name: string;
};

declare global {
  interface Window {
    editorShowTranslations?: boolean;
    editorShowSsml?: boolean;
  }
}

type HeaderProps = {
  isAdmin: boolean;
  story_data: StoryData;
  unsaved_changes: boolean;
  func_save: () => Promise<void>;
  func_delete: () => Promise<void>;
  is_saving: boolean;
  is_deleting: boolean;
  last_saved_at: number | null;
  show_trans: boolean;
  set_show_trans: (show: boolean) => void;
  show_ssml: boolean;
  set_show_ssml: (show: boolean) => void;
  open_bulk_audio: () => void;
  previous_story: StoryNavigationTarget | null;
  next_story: StoryNavigationTarget | null;
  feedbackReturnHref?: string;
};

export function StoryEditorHeader({
  isAdmin,
  story_data,
  unsaved_changes,
  func_save,
  func_delete,
  is_saving,
  is_deleting,
  last_saved_at,
  show_trans,
  set_show_trans,
  show_ssml,
  set_show_ssml,
  open_bulk_audio,
  previous_story,
  next_story,
  feedbackReturnHref,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  function do_set_show_trans() {
    let value = !show_trans;
    const event = new CustomEvent("editorShowTranslations", {
      detail: { show: value },
    });
    window.dispatchEvent(event);
    window.editorShowTranslations = value;
    set_show_trans(value);
    window.requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent("resize")),
    );
  }

  function do_set_show_ssml() {
    let value = !show_ssml;
    const event = new CustomEvent("editorShowSsml", {
      detail: { show: value },
    });

    window.dispatchEvent(event);
    window.editorShowSsml = value;
    set_show_ssml(value);
    window.requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent("resize")),
    );
  }

  async function Save() {
    if (is_saving || is_deleting) return;
    try {
      await func_save();
    } catch (e) {
      // The failure is surfaced to the user by the model.saveError banner
      // (with Retry) rendered in editor_v2.tsx; catch here only to log and to
      // avoid an unhandled promise rejection.
      console.error("error save", e);
    }
  }

  async function Delete() {
    if (is_saving || is_deleting) return;
    if (confirm("Are you sure that you want to delete this story?")) {
      try {
        await func_delete();
      } catch (e) {
        // Surfaced by the model.saveError banner in editor_v2.tsx; log only.
        console.error("error delete", e);
      }
    }
  }

  return (
    <>
      <EditorHeaderActions>
        <div className="hidden items-center min-[976px]:flex">
          <StoryNavButton
            href={previous_story?.href}
            label="Previous"
            title={previous_story?.name}
            compactIconDirection="left"
          />
          <StoryNavButton
            href={next_story?.href}
            label="Next"
            title={next_story?.name}
            compactIconDirection="right"
          />
          <EditorButton
            style={{ marginLeft: "auto" }}
            id="button_delete"
            onClick={Delete}
            img={"delete.svg"}
            text={is_deleting ? "Deleting..." : "Delete"}
            disabled={is_saving || is_deleting}
          />
          <EditorButton
            onClick={do_set_show_trans}
            checked={show_trans}
            text={"Hints"}
          />
          <div className="ml-2 flex shrink-0 flex-col items-center gap-0.5">
            <EditorButton
              onClick={do_set_show_ssml}
              checked={show_ssml}
              text={"Audio"}
            />
            <button
              type="button"
              className="inline-flex h-5 max-w-full items-center rounded-full border border-slate-300 bg-white px-1.5 text-[10px] font-semibold leading-none text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              onClick={open_bulk_audio}
            >
              Bulk audio
            </button>
          </div>
          <div className="relative">
            <EditorButton
              id="button_save"
              onClick={Save}
              img={"save.svg"}
              text={
                (is_saving ? "Saving..." : "Save") +
                (unsaved_changes ? "*" : "")
              }
              disabled={is_saving || is_deleting}
              title={
                story_data.official && !isAdmin
                  ? "Only admins can overwrite official stories."
                  : undefined
              }
            />
            {last_saved_at ? <SaveStatus lastSavedAt={last_saved_at} /> : null}
          </div>
        </div>
      </EditorHeaderActions>
      <MobileEditorHeader
        backHref={feedbackReturnHref ?? `/editor/course/${story_data.short}`}
        backLabel={feedbackReturnHref ? "Back to feedback" : "Back to course"}
        icon={
          <div className="shrink-0">
            <img
              src={
                story_data.image
                  ? `https://stories-cdn.duolingo.com/image/${story_data.image}.svg`
                  : "/editor/icons/empty_title.svg"
              }
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 object-contain"
            />
          </div>
        }
        title={story_data.name}
        subtitle={
          <MobileSaveStatus
            isSaving={is_saving}
            unsavedChanges={unsaved_changes}
            lastSavedAt={last_saved_at}
          />
        }
      >
        <button
          type="button"
          onClick={() => void Save()}
          disabled={is_saving || is_deleting}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-[var(--text-color)] transition-colors hover:bg-[var(--header-border)] disabled:opacity-50"
        >
          <SaveIcon className="size-5" />
          <span>{is_saving ? "Saving" : "Save"}</span>
        </button>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="More editor options"
              className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-color)] transition-colors hover:bg-[var(--header-border)]"
            >
              <EllipsisIcon className="size-6" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            aria-describedby={undefined}
            className="max-h-[min(82dvh,38rem)] overflow-y-auto rounded-t-3xl border-[var(--header-border)] bg-[var(--body-background)] p-0 pb-[env(safe-area-inset-bottom)] text-[var(--text-color)]"
          >
            <SheetHeader className="border-b border-[var(--header-border)]">
              <SheetTitle>Editor options</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col px-4 pb-4">
              <MobileToggleRow
                label="Hints"
                description="Show translations in the editor"
                checked={show_trans}
                onClick={do_set_show_trans}
              />
              <MobileToggleRow
                label="Audio details"
                description="Show SSML and audio timing"
                checked={show_ssml}
                onClick={do_set_show_ssml}
              />
              <button
                type="button"
                className={mobileEditorMenuItemClassName}
                onClick={() => {
                  setMobileMenuOpen(false);
                  open_bulk_audio();
                }}
              >
                Bulk audio
              </button>
              <div className="my-2 border-t border-[var(--header-border)]" />
              <MobileNavigationLink
                target={previous_story}
                label="Previous story"
                direction="left"
              />
              <MobileNavigationLink
                target={next_story}
                label="Next story"
                direction="right"
              />
              <div className="my-2 border-t border-[var(--header-border)]" />
              <button
                type="button"
                disabled={is_saving || is_deleting}
                className={`${mobileEditorMenuItemClassName} text-red-600 disabled:opacity-50`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  void Delete();
                }}
              >
                <Trash2Icon className="size-5" />
                {is_deleting ? "Deleting story…" : "Delete story"}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </MobileEditorHeader>
    </>
  );
}

export function StoryEditorHeaderLoading({ backHref }: { backHref?: string }) {
  return (
    <>
      <EditorHeaderActions>
        <div className="hidden items-center min-[976px]:flex">
          <StoryNavButton
            label="Previous"
            compactIconDirection="left"
            disabled={true}
          />
          <StoryNavButton
            label="Next"
            compactIconDirection="right"
            disabled={true}
          />
          <EditorButton
            style={{ marginLeft: "auto" }}
            id="button_delete_loading"
            onClick={() => {}}
            img={"delete.svg"}
            text={"Delete"}
            disabled={true}
          />
          <EditorButton
            onClick={() => {}}
            checked={false}
            text={"Hints"}
            disabled={true}
          />
          <div className="ml-2 flex shrink-0 flex-col items-center gap-0.5">
            <EditorButton
              onClick={() => {}}
              checked={false}
              text={"Audio"}
              disabled={true}
            />
            <button
              type="button"
              className="inline-flex h-5 max-w-full items-center rounded-full border border-slate-200 bg-slate-100 px-1.5 text-[10px] font-semibold leading-none text-slate-400"
              disabled={true}
            >
              Bulk audio
            </button>
          </div>
          <EditorButton
            id="button_save_loading"
            onClick={() => {}}
            img={"save.svg"}
            text={"Save"}
            disabled={true}
          />
        </div>
      </EditorHeaderActions>
      <MobileEditorHeader
        backHref={backHref}
        backLabel={backHref ? "Back to feedback" : undefined}
        title={
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--header-border)]" />
        }
      >
        <div className="h-8 w-16 animate-pulse rounded-lg bg-[var(--header-border)]" />
        <div className="size-11" />
      </MobileEditorHeader>
    </>
  );
}

function MobileSaveStatus({
  isSaving,
  unsavedChanges,
  lastSavedAt,
}: {
  isSaving: boolean;
  unsavedChanges: boolean;
  lastSavedAt: number | null;
}) {
  let text = "No unsaved changes";
  if (isSaving) text = "Saving changes…";
  else if (unsavedChanges) text = "Unsaved changes";
  else if (lastSavedAt) text = "Saved";

  return (
    <div className="truncate text-xs text-[var(--text-color-dim)]">{text}</div>
  );
}

function MobileToggleRow({
  label,
  description,
  checked,
  onClick,
}: {
  label: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex min-h-16 items-center gap-4 px-3">
      <button
        type="button"
        className="min-w-0 flex-1 text-left !text-base"
        onClick={onClick}
      >
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-[var(--text-color-dim)]">
          {description}
        </span>
      </button>
      <Switch checked={checked} onClick={onClick} ariaLabel={label} />
    </div>
  );
}

function MobileNavigationLink({
  target,
  label,
  direction,
}: {
  target: StoryNavigationTarget | null;
  label: string;
  direction: "left" | "right";
}) {
  const icon =
    direction === "left" ? (
      <ChevronLeftIcon className="size-5" />
    ) : (
      <ChevronRightIcon className="size-5" />
    );

  if (!target) {
    return (
      <span
        aria-disabled="true"
        className={`${mobileEditorMenuItemClassName} opacity-40`}
      >
        {icon}
        {label}
      </span>
    );
  }

  return (
    <SheetClose asChild>
      <Link
        href={target.href}
        title={target.name}
        className={mobileEditorMenuItemClassName}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="max-w-[45%] truncate text-sm font-normal text-[var(--text-color-dim)]">
          {target.name}
        </span>
      </Link>
    </SheetClose>
  );
}

function SaveStatus({ lastSavedAt }: { lastSavedAt: number }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[calc(100%-18px)] z-10 -translate-x-1/2 whitespace-nowrap text-[0.75rem] text-[var(--text-color-dim)]">
      {`Saved at ${new Date(lastSavedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`}
    </div>
  );
}

function StoryNavButton({
  href,
  label,
  title,
  compactIconDirection,
  disabled = false,
}: {
  href?: string;
  label: string;
  title?: string;
  compactIconDirection: "left" | "right";
  disabled?: boolean;
}) {
  const className =
    "px-3 py-2 text-center text-sm text-[var(--text-color-dim)] no-underline transition-colors hover:text-[var(--text-color)]";
  const content = (
    <>
      <span className="max-[1100px]:hidden">{label}</span>
      <span className="min-[1101px]:hidden">
        <ChevronIcon direction={compactIconDirection} />
      </span>
    </>
  );

  if (!href || disabled) {
    return (
      <span
        className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px] cursor-default opacity-50`}
        aria-disabled="true"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={title}
      className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px]`}
    >
      {content}
    </Link>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="inline-block h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? (
        <path d="M10 3.5 5.5 8 10 12.5" />
      ) : (
        <path d="M6 3.5 10.5 8 6 12.5" />
      )}
    </svg>
  );
}
