import { cn } from "@/lib/utils";

export const docsRootClass =
  "[--docs-background:white] [--docs-border:#fbfbfb] [--docs-toc-hover:#f6f6f6] [--docs-toc-active:#eae9eb] bg-[var(--docs-background)] text-black [&_a]:text-black";

export const docsMainContainerClass = "flex justify-center";

export const docsHeaderBarClass =
  "sticky top-0 z-[2] w-full border-b-2 border-[var(--docs-border)] bg-[var(--docs-background)]";
export const docsHeaderInnerClass =
  "mx-auto flex max-w-[1450px] items-baseline justify-start px-8 py-4";
export const docsHeaderLogoClass = "mr-auto [&_a]:no-underline";
export const docsSearchButtonClass =
  "flex items-baseline whitespace-nowrap rounded-[10px] border-0 px-2 py-2 pl-4 !text-[16px] !leading-[1.6] outline-none";
export const docsSearchLabelClass =
  "inline-block overflow-hidden text-ellipsis whitespace-nowrap max-[470px]:max-w-14";
export const docsSearchShortcutClass =
  "ml-[50px] rounded-[5px] border border-[var(--docs-border)] bg-[var(--docs-background)] px-[3px] py-[3px]";

export const docsDesktopNavigationClass =
  "hidden w-72 shrink-0 min-[1001px]:block";
export const docsDesktopNavigationInnerClass =
  "fixed h-[calc(100vh-70px)] w-72 overflow-y-auto bg-[var(--docs-background)] p-4 pb-10 text-[16px] leading-[1.6]";
export const docsMobileNavigationInnerClass =
  "overflow-y-auto bg-[var(--docs-background)] p-4 pb-10 text-[16px] leading-[1.6]";
export const docsNavigationHeadingClass =
  "m-0 px-4 pt-6 pb-[6px] text-[16px] leading-[1.6] font-bold";
export const docsNavigationListClass = "m-0 flex w-full list-none flex-col p-0";
export const docsNavigationItemClass = "m-0 w-full list-none p-0";
export function docsPageLinkClass(active: boolean) {
  return cn(
    "block w-full rounded-lg px-4 py-1.5 no-underline font-light hover:bg-[var(--docs-toc-hover)]",
    active && "bg-[var(--docs-toc-active)] font-bold",
  );
}

export const docsMobileBreadcrumbClass =
  "sticky top-20 z-[1] flex h-12 w-full items-center gap-[6px] border-b-2 border-[var(--docs-border)] bg-[var(--docs-background)] px-2 py-2 pl-[26px] text-[15px] leading-6 min-[1001px]:hidden";
export const docsUnstyledButtonClass =
  "grid cursor-pointer place-content-center rounded-md border-0 bg-transparent p-0";

export const docsPageMainClass =
  "w-[100px] max-w-[880px] grow overflow-x-auto px-8 py-5 text-[calc(18/16*1rem)] max-[1280.98px]:w-[calc(100%-288px)] max-[1280.98px]:max-w-[calc(100%-288px)] max-[1000.98px]:w-full max-[1000.98px]:max-w-[1000px] [&_h1]:m-0 [&_h1]:text-left [&_h1]:text-[1.875rem] [&_h1]:leading-9 [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:m-[32px_0_16px] [&_ol]:my-4 [&_ol]:pl-[19px] [&_p]:my-4 [&_ul]:my-4 [&_ul]:pl-[19px]";
export const docsHeaderIntroClass = "mb-7 max-[640px]:mb-5";
export const docsEditButtonContainerClass = "mt-10 flex w-full justify-end";
export const docsEditButtonClass =
  "rounded-[10px] border-2 border-[#f0f0f0] px-[15px] py-[5px] no-underline hover:border-[#d2d2d2]";
export const docsFooterClass = "mt-10 flex justify-between";
export const docsFooterLinkClass = "font-bold no-underline";
export const docsRightTocClass =
  "sticky top-[84px] h-full w-[304px] shrink-0 max-[1280.98px]:hidden";
export const docsRightTocInnerClass =
  "fixed h-[calc(100vh-70px)] w-[304px] overflow-y-auto pl-10 text-[16px] leading-[1.6] font-bold";

export const docsBoxClass =
  "relative !mt-12 !mb-0 mx-[-16px] rounded-[10px] px-4 py-2 before:absolute before:top-0 before:left-0 before:-translate-y-full before:rounded-t-[10px] before:px-4 before:pt-1 before:font-bold";
export const docsInfoBoxClass = cn(
  docsBoxClass,
  "border border-[#3535f2] bg-[hsla(210.8,100%,71.4%,0.5)] before:content-['Info'] before:text-[#3535f2]",
);
export const docsWarningBoxClass = cn(
  docsBoxClass,
  "border border-[#f29435] bg-[hsla(36,100%,71%,0.5)] before:content-['Warning'] before:text-[#f29435]",
);
export const docsAlertBoxClass = cn(
  docsBoxClass,
  "border border-[#f23535] bg-[hsla(0,100%,71%,0.5)] before:content-['Alert'] before:text-[#f23535]",
);
export const docsChannelLinkClass =
  "rounded-[5px] bg-[#b5d9ff] px-1 py-0.5 font-mono no-underline hover:bg-[#89c3ff]";
export const docsImageWrapperClass = "mx-[-32px] overflow-auto px-8 [&_p]:m-0";

export const docsSearchOverlayClass =
  "fixed inset-0 z-[16] hidden [backdrop-filter:blur(4px)_brightness(0.9)] data-[state=open]:block max-[640px]:bg-black/50 max-[640px]:[backdrop-filter:none]";
export const docsSearchModalClass =
  "[--docs-background:white] [--docs-border:#fbfbfb] [--docs-toc-hover:#f6f6f6] [--docs-toc-active:#eae9eb] fixed top-[15%] left-1/2 z-[100] hidden w-[640px] -translate-x-1/2 overflow-hidden rounded-[12px] bg-[var(--docs-background)] text-[16px] leading-[1.6] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0px_1px_1px_rgba(0,0,0,0.02),0px_8px_16px_-4px_rgba(0,0,0,0.04),0px_24px_32px_-8px_rgba(0,0,0,0.06)] outline-none data-[state=open]:block max-[640px]:top-auto max-[640px]:bottom-0 max-[640px]:h-[80%] max-[640px]:w-full max-[640px]:translate-x-[-50%] max-[640px]:rounded-none";
export const docsSearchTopRowClass =
  "flex border-b-2 border-[var(--docs-border)] p-[10px]";
export const docsSearchInputClass =
  "w-full border-0 bg-transparent outline-none";
export const docsSearchCloseButtonClass =
  "rounded-[5px] border border-[var(--docs-border)] bg-[var(--docs-background)] px-[5px] py-[5px]";
export const docsSearchResultsClass = "max-h-[400px] overflow-y-auto p-[10px]";
export function docsSearchResultClass(type: "main" | "sub") {
  return cn(
    "block overflow-hidden rounded-[5px] px-[5px] py-[5px] text-ellipsis whitespace-nowrap no-underline hover:bg-[#f6f6f6]",
    type === "main" && "font-bold",
    type === "sub" && "pl-10",
  );
}
