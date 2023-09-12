'use client'
import styles from "./set_list.module.css"
import StoryButton from "./story_button";
import {useEffect, useState} from "react";


const useFetch = (course_id) => {
    const [data, setData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsError(false);
            setIsLoading(true);

            try {
                const result = await fetch(`${course_id}/get_done`, {credentials: 'include'});

                setData(await result.json());
                setIsLoaded(true);
            } catch (error) {
                setIsError(true);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [course_id]);

    return { data, isLoading, isLoaded, isError };
}

export default function SetListClient({course_id, course}) {
    const { data: done, isLoading, isLoaded, isError } = useFetch(course_id);

    return <div className={styles.story_list} data-loaded={isLoaded}>
        {course.about ?
            <div className={styles.set_list}>
                <div className={styles.set_title}>About</div><p>
                {course.about}
            </p>
            </div>
            : <></>}
        {course.sets.map(set => (
            <div key={set[0].set_id} className={styles.set_list}>
                <div className={styles.set_title}>Set {set[0].set_id}</div>
                {set.map(story => (
                    <StoryButton key={story.id} story={story} done={done[story.id]} />
                ))}
            </div>
        ))}
    </div>
}
