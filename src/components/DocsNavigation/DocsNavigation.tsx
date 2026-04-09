"use client";
import React from "react";
import Link from "next/link";
import { showNavContext } from "../DocsNavigationBackdrop";
import { useSelectedLayoutSegment } from "next/navigation";
import VisuallyHidden from "../VisuallyHidden";
import {
  docsNavigationClass,
  docsNavigationCloseClass,
  docsNavigationHeadingClass,
  docsNavigationInnerClass,
  docsNavigationItemClass,
  docsNavigationListClass,
  docsPageLinkClass,
} from "../Docs/docsClasses";

function DocsNavigation({
  data,
}: {
  data: {
    navigation: { group: string; pages: { slug: string; title: string }[] }[];
  };
}) {
  const { show, setShow } = React.useContext(showNavContext);

  const segment = useSelectedLayoutSegment();

  return (
    <>
      <div className={docsNavigationClass(show)} id="toc" data-show={show}>
        <button
          className={docsNavigationCloseClass}
          id="close"
          onClick={() => setShow(false)}
        >
          <VisuallyHidden>Close Menu</VisuallyHidden>×
        </button>
        <div className={docsNavigationInnerClass}>
          {data.navigation.map((item, i) => (
            <div key={i}>
              {item.group ? (
                <h5 className={docsNavigationHeadingClass}>{item.group}</h5>
              ) : null}
              <ul className={docsNavigationListClass}>
                {item.pages.map((child, i) => (
                  <li className={docsNavigationItemClass} key={i}>
                    <PageLink
                      page={child.slug}
                      title={child.title}
                      setShow={setShow}
                      active={child.slug === segment}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PageLink({
  page,
  title,
  active,
  setShow,
}: {
  page: string;
  title: string;
  active: boolean;
  setShow: (value: boolean) => void;
}) {
  return (
    <Link
      href={`/docs/${page}`}
      className={docsPageLinkClass(active)}
      onClick={() => setShow(false)}
    >
      {title}
    </Link>
  );
}

export default DocsNavigation;
