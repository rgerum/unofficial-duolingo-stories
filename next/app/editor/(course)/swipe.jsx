'use client'
import React from "react";
import {useEffect, useState} from "react";
import {useSwipeable} from "react-swipeable";
import styles from "./course/[course_id]/index.module.css";
import CourseList from "./course_list";
import {useSelectedLayoutSegments} from "next/navigation";


export default function SwiperSideBar({courses, children}) {
    const segment = useSelectedLayoutSegments()[1];

    // Render data...
    let [showList, setShowList] = useState(segment === null);
    useEffect(() => {
        setShowList(segment === null);
    }, [segment, setShowList]);

    let toggleShow = React.useCallback(() => setShowList(!showList), [setShowList, showList]);

    const handlers = useSwipeable({
        onSwipedRight: () => setShowList(true),
        onSwipedLeft: () => setShowList(false),
    });

    useEffect(() => {
        // Add event listener when the component mounts
        window.addEventListener('toggleSidebar', toggleShow);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('toggleSidebar', toggleShow);
        };
    }, [toggleShow]);

    return <>
        <div  {...handlers} className={styles.root}>
            <CourseList courses={courses} course_id={segment} showList={showList} toggleShow={toggleShow} />
            <div className={styles.main_overview}>
                {children}
            </div>
        </div>
    </>
}