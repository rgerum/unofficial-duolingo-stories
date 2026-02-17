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
  const segment = useSelectedLayoutSegments()[1];

  // Render data...
  let [showList, setShowList] = useState(segment === null);
  useEffect(() => {
    setShowList(segment === null);
  }, [segment, setShowList]);

  let toggleShow = React.useCallback(
    () => setShowList(!showList),
    [setShowList, showList],
  );

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
        className="grid h-full overflow-hidden [grid-template-areas:'header_header''nav_main'] [grid-template-columns:400px_1fr] [grid-template-rows:auto_1fr] max-[1250px]:[grid-template-columns:0_1fr]"
      >
        <CourseList
          course_id={segment}
          showList={showList}
          toggleShow={toggleShow}
        />
        {children}
      </div>
    </>
  );
}
