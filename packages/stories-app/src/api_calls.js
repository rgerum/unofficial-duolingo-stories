export function get_backend() {
    let backend = "https://carex.uber.space/stories/backend/"
    if(window.location.host === "www.duostories.org" || window.location.host === "duostories.org")
        backend = "https://"+window.location.host+"/stories/backend/"
    return backend;
}
let backend = get_backend();
let backend_stories = backend+"stories/"
window.backend_stories = backend_stories

const backend_express = "https://duostories.org/stories/backend_node/"


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

export async function getCoursesUser() {
    try {
        let response_courses = await fetch(`${backend_express}courses_user`, {credentials: "include"});
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getCoursesCount() {
    try {
        let response_courses = await fetch(`${backend_express}course_counts`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getPublicCourses() {
    try {
        let response_courses = await fetch(`${backend_express}courses`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getStoriesSets(lang, lang_base) {
    if(lang === undefined || lang_base === undefined)
        return {sets: []}
    try {
        let response = await fetch(`${backend_express}course/${lang}-${lang_base}`, {credentials: 'include'});
        return await response.json();
    }
    catch (e) {
        return {sets: []}
    }
}
