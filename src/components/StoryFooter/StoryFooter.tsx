import React from "react";
import Button from "@/components/ui/button";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";
import { cn } from "@/lib/utils";

const footerIconStyle = {
  backgroundImage:
    "url(//d35aaqx5ub95lt.cloudfront.net/images/icon-sprite8.svg)",
  backgroundPosition: "-166px -90px",
};

const footerBaseClassName =
  "fixed bottom-0 left-0 z-10 flex h-[140px] w-full items-center border-t-2 border-[var(--header-border)] bg-[var(--body-background)] p-[30px] max-[800px]:h-auto max-[800px]:p-[18px_16px] max-[500px]:justify-stretch max-[500px]:border-t-0 max-[500px]:p-4";

const widthWrapperBaseClassName =
  "mx-auto flex w-full max-w-[921px] items-center justify-end max-[500px]:[&_button]:w-full";

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[calc(25/16*1rem)] font-bold text-[var(--footer-right-color)]">
      {children}
    </div>
  );
}

function Check() {
  return (
    <div className="inline-block h-20 w-20 shrink-0 rounded-[98px] bg-[var(--footer-icon-backgroud)] animate-[story-footer-check-pop_0.4s_ease-in-out_forwards] max-[500px]:hidden">
      <span
        aria-hidden="true"
        className="mt-[27px] ml-5 block h-[31px] w-[41px] bg-no-repeat"
        style={footerIconStyle}
      />
    </div>
  );
}

function FooterShell({
  children,
  className,
  feedback,
}: {
  children: React.ReactNode;
  className?: string;
  feedback?: React.ReactNode;
}) {
  return (
    <div data-story-footer className={cn(footerBaseClassName, className)}>
      {feedback ? (
        <div className="absolute right-6 bottom-[calc(100%+16px)] z-[1] max-[500px]:right-4 max-[500px]:bottom-[calc(100%+12px)]">
          {feedback}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function StoryFooter({
  buttonStatus,
  onClick,
  onBackToOverview,
  finishedLabel,
  nextStoryPreview,
  learningLanguageName,
  showFinishedPrimaryAction = true,
  feedback,
}: {
  buttonStatus: string;
  onClick: () => void;
  onBackToOverview?: () => void | Promise<void>;
  finishedLabel?: string;
  nextStoryPreview?: {
    id: number;
    title: string;
    active: string;
    gilded: string;
  } | null;
  learningLanguageName?: string;
  showFinishedPrimaryAction?: boolean;
  feedback?: React.ReactNode;
}) {
  const localisation = useLocalisation();

  const onContinueClick = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("story_autoplay_ts", String(Date.now()));
    }
    onClick();
  }, [onClick]);

  if (buttonStatus === "...") {
    return (
      <FooterShell>
        <div className={widthWrapperBaseClassName}>
          <Button key={"c"} onClick={onContinueClick}>
            {"..."}
          </Button>
        </div>
      </FooterShell>
    );
  }

  if (buttonStatus === "finished") {
    return (
      <FooterShell>
        <div
          className={cn(
            widthWrapperBaseClassName,
            "grid justify-stretch gap-4 [grid-template-columns:minmax(170px,220px)_minmax(0,1fr)_minmax(170px,220px)] max-[800px]:grid-cols-1 max-[800px]:gap-3",
          )}
        >
          <Button
            type="button"
            variant="secondary"
            className="mt-px min-h-14 max-[800px]:order-1 max-[800px]:w-full"
            onClick={() => {
              void onBackToOverview?.();
            }}
          >
            Back to overview
          </Button>
          <div className="flex min-w-0 items-center justify-center max-[800px]:order-2">
            {nextStoryPreview ? (
              <div className="w-full min-w-0 min-[801px]:relative">
                <div className="mb-2 text-center text-[calc(12/16*1rem)] font-bold tracking-[0.08em] text-[var(--title-color-dim)] uppercase min-[801px]:absolute min-[801px]:top-[-24px] min-[801px]:left-0 min-[801px]:mb-0 min-[801px]:w-full">
                  Up next
                </div>
                <div className="relative mx-auto flex min-h-[76px] max-w-[360px] items-center gap-3 overflow-visible rounded-[18px] border-2 border-[var(--overview-hr)] bg-[color:color-mix(in_srgb,var(--body-background)_90%,white_10%)] py-[10px] pr-3 pl-[18px]">
                  <div className="ml-[-6px] h-[52px] w-[52px] shrink-0 overflow-visible">
                    <img
                      alt=""
                      className="block h-full w-full object-cover"
                      src={nextStoryPreview.active}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[calc(17/16*1rem)] leading-[1.2] font-bold text-[var(--text-color-dim)]">
                      {nextStoryPreview.title}
                    </div>
                    <div className="mt-0.5 text-[calc(14/16*1rem)] text-[var(--title-color-dim)]">
                      {learningLanguageName
                        ? `Continue in ${learningLanguageName}`
                        : "Next story in this course"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[76px]" />
            )}
          </div>
          {showFinishedPrimaryAction ? (
            <div className="max-[800px]:order-3 max-[800px]:w-full max-[800px]:[&_button]:w-full">
              <Button key={"c"} onClick={onContinueClick}>
                {finishedLabel ?? localisation("button_finished") ?? "finished"}
              </Button>
            </div>
          ) : (
            <div className="min-h-14 max-[800px]:order-3" />
          )}
        </div>
      </FooterShell>
    );
  }

  if (buttonStatus === "wait") {
    return (
      <FooterShell feedback={feedback}>
        <div className={widthWrapperBaseClassName}>
          <Button key={"c"} disabled onClick={onContinueClick}>
            {localisation("button_continue") || "continue"}
          </Button>
        </div>
      </FooterShell>
    );
  }
  if (buttonStatus !== "right") {
    return (
      <FooterShell feedback={feedback}>
        <div className={widthWrapperBaseClassName}>
          <Button key={"c"} onClick={onContinueClick}>
            {localisation("button_continue") || "continue"}
          </Button>
        </div>
      </FooterShell>
    );
  }
  return (
    <FooterShell
      className="border-[var(--footer-right-background)] bg-[var(--footer-right-background)] text-[var(--footer-right-color)]"
      feedback={feedback}
    >
      <div
        className={cn(
          widthWrapperBaseClassName,
          "gap-4 justify-between max-[500px]:flex-col max-[500px]:items-stretch",
        )}
      >
        <div className="mr-auto flex items-center gap-4 max-[500px]:mr-0 max-[500px]:min-h-12 max-[500px]:w-full max-[500px]:justify-start">
          <Check />
          <Message>
            {localisation("story_correct") || "You are correct"}
          </Message>
        </div>
        <div className="max-[500px]:w-full max-[500px]:[&_button]:w-full">
          <Button key={"c"} onClick={onContinueClick}>
            {localisation("button_continue") || "continue"}
          </Button>
        </div>
      </div>
    </FooterShell>
  );
}

export default StoryFooter;
