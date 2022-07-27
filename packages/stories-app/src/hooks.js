import React from 'react';


export function useDataFetcher2(fetcher, args = []) {
    const [data, updateData] = React.useState(undefined);
    const [, updateDone] = React.useState(false);

    React.useEffect(() => {
        async function doFetch() {
            updateData(undefined);
            const fetched_data = await fetcher(...args);
            updateData(fetched_data);
            updateDone(true);
        }

        doFetch();
        // eslint-disable-next-line
    }, [...args]);
    async function refetch() {
        const fetched_data = await fetcher(...args);
        updateData(fetched_data);
    }

    return [data, refetch];
}

export function useDataFetcher(fetcher, args = []) {
    const [data, updateData] = React.useState(undefined);
    const [, updateDone] = React.useState(false);

    React.useEffect(() => {
        async function doFetch() {
            updateData(undefined);

            const fetched_data = await fetcher(...args);
            updateData(fetched_data);
            updateDone(true);
        }

        doFetch();
        // eslint-disable-next-line
    }, [...args]);
    return data;
}

export function useInput(def) {
    let [value, setValue] = React.useState(def);
    return [value, e => setValue(e.target.value)];
} // Hook


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