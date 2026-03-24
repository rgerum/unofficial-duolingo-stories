import React from "react";
import LanguageFlag from "@/components/ui/language-flag";
import Link from "next/link";
import EditorButton from "../editor_button";

interface BreadcrumbLanguage {
  languageId?: string;
  name?: string;
}

interface BreadcrumbStoryData {
  image?: string | number | null;
  name?: string;
}

interface BreadcrumbPartData {
  type: string;
  href?: string;
  lang1?: BreadcrumbLanguage;
  lang2?: BreadcrumbLanguage;
  name?: string;
  data?: BreadcrumbStoryData;
}

function MyLink({
  href,
  children,
  className,
}: {
  href?: string | undefined;
  children: React.ReactNode;
  className: string;
}) {
  const linkClassName = `${className} opacity-70 hover:brightness-90 hover:opacity-100 hover:text-[var(--text-color)]`;
  if (href !== undefined)
    return (
      <Link href={href} className={linkClassName}>
        {children}
      </Link>
    );
  return <span className={className}>{children}</span>;
}

function BreadcrumbPart({
  part,
  hide,
}: {
  part: BreadcrumbPartData;
  hide: boolean;
}) {
  let class_name =
    "flex h-[50px] items-center overflow-hidden rounded-[14px] border-0 bg-[var(--body-background)] px-[5px] py-[5px] no-underline [&_img]:mb-[5px] [&_img]:mr-[5px] [&_img]:pl-0";
  if (hide) {
    class_name += " max-[460px]:hidden";
  }
  if (part.type === "sep") {
    return (
      <MyLink className={class_name} href={part.href}>
        /
      </MyLink>
    );
  }
  if (part.type === "course") {
    if (!part.lang2) {
      return (
        <MyLink className={class_name} href={part.href}>
          <LanguageFlag languageId={part.lang1?.languageId} width={40} />
          {part.lang1?.name ? (
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{`${
              part?.name || part.lang1?.name
            }`}</span>
          ) : null}
        </MyLink>
      );
    }
    return (
      <MyLink className={class_name} href={part.href}>
        <span className="flex">
          <LanguageFlag languageId={part.lang1?.languageId} width={40} />
          <LanguageFlag
            languageId={part.lang2?.languageId}
            width={36}
            className="ml-[-28px] mt-[10px]"
          />
        </span>
        {part.lang1?.name && part.lang2?.name ? (
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {part?.name || `${part.lang1?.name} (from ${part.lang2?.name})`}
          </span>
        ) : null}
      </MyLink>
    );
  }
  if (part.type === "story") {
    return (
      <MyLink className={class_name} href={part.href}>
        {part.data?.image ? (
          <img
            className="h-9"
            alt="story title"
            src={`https://stories-cdn.duolingo.com/image/${part.data?.image}.svg`}
          />
        ) : (
          <img alt="story title" src={`/icons/empty_title.svg`} />
        )}
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {part.data?.name}
        </span>
      </MyLink>
    );
  }
  return (
    <MyLink className={class_name} href={part.href}>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        {part.type}
      </span>
    </MyLink>
  );
}

export function Breadcrumbs({ path }: { path: BreadcrumbPartData[] }) {
  let link;
  let hide = path.length > 3;
  for (let part of path) {
    if (part.href) link = part.href;
  }
  return (
    <>
      {hide ? (
        <div className="hidden max-[460px]:inline">
          <EditorButton
            id="button_back"
            href={link}
            data-cy="button_back"
            img={"back.svg"}
            text={"Back"}
            style={{ paddingLeft: 0 }}
          />
        </div>
      ) : (
        <></>
      )}
      {path.map((d, i) => (
        <BreadcrumbPart key={i} part={d} hide={hide} />
      ))}
    </>
  );
}
