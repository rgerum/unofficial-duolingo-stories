'use client'
import {useEffect, useState} from "react";
import {useSwipeable} from "react-swipeable";
import styles from "./course/[course_id]/index.module.css";
import CourseList from "./course_list";


export default function SwiperSideBar({courses, course_id, children}) {

    // Render data...
    let [showList, setShowList] = useState(false);
    useEffect(() => {
        setShowList(false);
    }, [1])//course.id

    let toggleShow = () => setShowList(!showList);

    const handlers = useSwipeable({
        onSwipedRight: () => setShowList(true),
        onSwipedLeft: () => setShowList(false),
    });

    return <>
        <div  {...handlers} className={styles.root}>
            <CourseList courses={courses} course_id={course_id} showList={showList} toggleShow={toggleShow} />
            <div className={styles.main_overview}>
                {children}
            </div>
        </div>
    </>
}