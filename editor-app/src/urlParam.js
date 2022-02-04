const setQueryStringWithoutPageReload = qsValue => {
    const newurl = window.location.protocol + "//" +
    window.location.host +
    window.location.pathname +
    qsValue;

    window.history.pushState({ path: newurl }, "", newurl);
};

const setQueryStringValue = (
    key,
    value,
    queryString = window.location.search
) => {
    const values = qs.parse(queryString);
    const newQsValue = qs.stringify({...values, [key]: value });
    setQueryStringWithoutPageReload(`?${newQsValue}`);
};

const getQueryStringValue = (
    key,
    queryString = window.location.search
) => {
    const values = qs.parse(queryString);
    return values[key];
};

function queryToObject(urlParams) {
    var search = location.search.substring(1);
    return JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
}

function setQueryValue(key, newValue) {
    let urlParams = new URLSearchParams(window.location.search);
    urlParams.set(key, newValue);
    window.history.pushState(queryToObject(urlParams), "", "?"+urlParams.toString());
}

function useQueryString(key, initialValue) {
    let urlParams = new URLSearchParams(window.location.search);
    const [value, setValue] = React.useState(urlParams.get(key) || initialValue);
    useEventListener("popstate", (event) => {
        setValue(event.state[key] || initialValue);
    })

    const onSetValue = React.useCallback(
        newValue => {
            setValue(newValue);
            setQueryValue(key, newValue);
        },
        [key]
    );

    return [value, onSetValue];
}
