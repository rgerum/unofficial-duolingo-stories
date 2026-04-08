"use client";
"use no memo";
import React from "react";
import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import CourseList from "./course_list";
import { useSelectedLayoutSegments } from "next/navigation";

interface SwiperSideBarProps {
  children: React.ReactNode;
}

export default function SwiperSideBar({ children }: SwiperSideBarProps) {
  const segments = useSelectedLayoutSegments();
  const courseSegment = segments[1];
  const nestedRoute = segments[2];
  const showSidebar =
    nestedRoute !== "story" &&
    nestedRoute !== "voices" &&
    nestedRoute !== "localization";

  // Render data...
  let [showList, setShowList] = useState(courseSegment === null);
  useEffect(() => {
    setShowList(courseSegment === null);
  }, [courseSegment]);

  let toggleShow = React.useCallback(() => {
    setShowList((value) => !value);
  }, []);

  const handlers = useSwipeable({
    onSwipedRight: () => setShowList(true),
    onSwipedLeft: () => setShowList(false),
  });

  useEffect(() => {
    // Add event listener when the component mounts
    window.addEventListener("toggleSidebar", toggleShow);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("toggleSidebar", toggleShow);
    };
  }, [toggleShow]);

  return (
    <>
      <div
        {...handlers}
        className={
          "grid h-[100dvh] min-h-0 w-full overflow-hidden [grid-template-areas:'header_header''nav_main'] [grid-template-rows:auto_minmax(0,1fr)] " +
          (showSidebar
            ? "[grid-template-columns:400px_minmax(0,1fr)] max-[1250px]:[grid-template-columns:0_minmax(0,1fr)]"
            : "[grid-template-columns:0_minmax(0,1fr)]")
        }
      >
        {showSidebar ? (
          <CourseList
            course_id={courseSegment}
            showList={showList}
            toggleShow={toggleShow}
          />
        ) : null}
        {children}
      </div>
    </>
  );
}
