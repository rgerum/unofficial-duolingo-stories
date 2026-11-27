"use client";
import React from "react";
import Link from "next/link";
import { showNavContext } from "../DocsNavigationBackdrop";
import { useSelectedLayoutSegment } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  docsDesktopNavigationClass,
  docsDesktopNavigationInnerClass,
  docsNavigationHeadingClass,
  docsNavigationItemClass,
  docsNavigationListClass,
  docsMobileNavigationInnerClass,
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
      <div className={docsDesktopNavigationClass} id="toc">
        <div className={docsDesktopNavigationInnerClass}>
          <NavigationContent data={data} segment={segment} setShow={setShow} />
        </div>
      </div>

      <Drawer
        side="left"
        open={show}
        onOpenChange={(open) => setShow(open)}
        preventEdgeSwipe
      >
        <DrawerContent className="gap-0 p-0 data-[side=left]:w-[min(18rem,calc(100vw-1.5rem))]">
          <DrawerHeader>
            <DrawerTitle>Documentation navigation</DrawerTitle>
          </DrawerHeader>
          <div className={docsMobileNavigationInnerClass}>
            <NavigationContent
              data={data}
              segment={segment}
              setShow={setShow}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function NavigationContent({
  data,
  segment,
  setShow,
}: {
  data: {
    navigation: { group: string; pages: { slug: string; title: string }[] }[];
  };
  segment: string | null;
  setShow: (value: boolean) => void;
}) {
  return (
    <>
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
