export const backend_express = "https://duostories.org/stories/backend_node/"


let fetch_promises = {}
window.fetch_promises = fetch_promises;
export function useSuspendedDataFetcher(fetcher, args= []) {
    let key = `${fetcher.name} ${args}`;
    if(fetch_promises[key] === undefined) {
        fetch_promises[key] = {
            promise: undefined,
            response: undefined,
            status: "pending",
        }
        fetch_promises[key].promise = fetcher(...args).then((res) => {
                fetch_promises[key].response = res;
                fetch_promises[key].status = "done";
            }
        );
    }
    if(fetch_promises[key].status === "pending")
        throw fetch_promises[key].promise;
    return fetch_promises[key].response;
}

export async function fetch_post(url, data)
{
    // check if the user is logged in
    var req = new Request(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: "cors",
        credentials: 'include',
    });
    return fetch(req);
}