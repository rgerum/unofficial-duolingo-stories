import React from 'react';


export async function fetch_post(url, data) {
    /** like fetch but with post instead of get */
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(var i in data){
        fd.append(i,data[i]);
    }
    return fetch(url, {
        method: "POST",
        body: fd,
        mode: "cors"
    });
}

export function useEventListener(eventName, handler, element = window) {
    // Create a ref that stores handler
    const savedHandler = React.useRef(); // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.

    React.useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);
    React.useEffect(() => {
            // Make sure element supports addEventListener
            // On
            const isSupported = element && element.addEventListener;
            if (!isSupported) return; // Create event listener that calls handler function stored in ref

            const eventListener = event => savedHandler.current(event); // Add event listener


            element.addEventListener(eventName, eventListener); // Remove event listener on cleanup

            return () => {
                element.removeEventListener(eventName, eventListener);
            };
        }, [eventName, element] // Re-run if eventName or element changes
    );
}



let backend = "https://carex.uber.space/stories/backend/"
let backend_stories = backend+"stories/"
//window.backend_stories = backend_stories


export async function setStoryDone(id) {
    return fetch(`${backend_stories}set_story_done.php?id=${id}`);
}

export async function getStoryJSON(id) {
    let response_json = await fetch(`${backend_stories}get_story_json.php?id=${id}`);
    let story_json;
    if(response_json.status === 200) {
        try {
            story_json = await response_json.json();
        } catch (e) {
            story_json = undefined;
        }
        if (story_json) {
            return story_json;
        }
    }
}

export function scroll_down() {
    // scroll down to the bottom
    document.documentElement.scrollTo({
        left: 0,
        top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        behavior: 'smooth'
    });
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
let random_seed = 1234;
Math.set_seed = function (seed) {
    random_seed = seed;
}
Math.random_seeded = function() {
    random_seed = Math.sin(random_seed) * 10000;
    return random_seed - Math.floor(random_seed);
};

export function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random_seeded() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}