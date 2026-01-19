"use client";
"use no memo";
import React from "react";
import { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import styles from "./course/[course_id]/index.module.css";
import CourseList from "./course_list";
import { useSelectedLayoutSegments } from "next/navigation";
import type { CourseProps, LanguageProps } from "./db_get_course_editor";

interface SwiperSideBarProps {
  courses: CourseProps[] | undefined;
  languages: Record<string | number, LanguageProps>;
  children: React.ReactNode;
}

export default function SwiperSideBar({ courses, languages, children }: SwiperSideBarProps) {
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
      <div {...handlers} className={styles.root}>
        <CourseList
          courses={courses}
          languages={languages}
          course_id={segment}
          showList={showList}
          toggleShow={toggleShow}
        />
        {children}
      </div>
    </>
  );
}
