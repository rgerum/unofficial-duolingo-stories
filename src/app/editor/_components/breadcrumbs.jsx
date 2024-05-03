import styles from "./breadcrumbs.module.css";
import React from "react";
import { DoubleFlag } from "@/components/layout/flag";
import Link from "next/link";
import EditorButton from "../editor_button";

function MyLink({ href, children, className }) {
  if (href !== undefined)
    return (
      <Link href={href} className={className + " " + styles.part_link}>
        {children}
      </Link>
    );
  return <span className={className}>{children}</span>;
}

function BreadcrumbPart({ part, hide }) {
  let class_name = styles.part;
  if (hide) {
    class_name += " " + styles.part_hide;
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
          <DoubleFlag width={40} lang1={part.lang1} className={styles.flag} />
          {part.lang1?.name ? (
            <span className={styles.name}>{`${
              part?.name || part.lang1?.name
            }`}</span>
          ) : null}
        </MyLink>
      );
    }
    return (
      <MyLink className={class_name} href={part.href}>
        <DoubleFlag
          width={40}
          lang1={part.lang1}
          lang2={part.lang2}
          className={styles.flag}
        />
        {part.lang1?.name && part.lang2?.name ? (
          <span className={styles.name}>
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
            alt="story title"
            src={`https://stories-cdn.duolingo.com/image/${part.data?.image}.svg`}
          />
        ) : (
          <img alt="story title" src={`/icons/empty_title.svg`} />
        )}
        <span className={styles.name}>{part.data?.name}</span>
      </MyLink>
    );
  }
  return (
    <MyLink className={class_name} href={part.href}>
      <span className={styles.name}>{part.type}</span>
    </MyLink>
  );
}

export function Breadcrumbs({ path }) {
  let link;
  let hide = path.length > 3;
  for (let part of path) {
    if (part.href) link = part.href;
  }
  return (
    <>
      {hide ? (
        <div className={styles.back}>
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
