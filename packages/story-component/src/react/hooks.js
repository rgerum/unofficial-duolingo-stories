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
    function set(e) {
        let v = e?.target ? e?.target?.value : e;
        if (v === null || v === undefined)
            v = "";
        setValue(v);
    }
    return [value, set];
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


export function useLocalStorage(key, initialValue) {
    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = React.useState(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }
        try {
            // Get from local storage by key
            const item = window.localStorage.getItem(key);
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If error also return initialValue
            console.log(error);
            return initialValue;
        }
    });
    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = (value) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            // Save state
            setStoredValue(valueToStore);
            // Save to local storage
            if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            // A more advanced implementation would handle the error case
            console.log(error);
        }
    };
    return [storedValue, setValue];
}