import {backend_express} from "./include";

export async function getCoursesUser() {
    try {
        let response_courses = await fetch(`${backend_express}/courses_user`, {credentials: "include"});
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getCoursesCount() {
    try {
        let response_courses = await fetch(`${backend_express}/course_counts`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getPublicCourses() {
    try {
        let response_courses = await fetch(`${backend_express}/courses`);
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
        let response = await fetch(`${backend_express}/course/${lang}-${lang_base}`, {credentials: 'include'});
        return await response.json();
    }
    catch (e) {
        return {sets: []}
    }
}


export async function getStoryJSON(id) {
    let response_json = await fetch(`${backend_express}/story/${id}`);
    let story_json;
    if(response_json.status === 200) {
        try {
            story_json = await response_json.json();
        } catch (e) {
            story_json = null;
        }
    }
    return story_json;
}


export async function setStoryDone(id) {
    return fetch(`${backend_express}/story/${id}/done`, {credentials: 'include'});
}