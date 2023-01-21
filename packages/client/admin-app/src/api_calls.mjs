import {fetch_post, isLocalNetwork} from "includes";

export let backend_express = "/stories/backend_node";
if(isLocalNetwork())
    backend_express = "https://test.duostories.org/stories/backend_node_test";
if(window.location.hostname === "test.duostories.org")
    backend_express = "/stories/backend_node_test";
let backend_express_admin = backend_express + "/admin"

let backend_set = "https://admin.duostories.org/set2"

export async function getUserList() {
    try {
        let response_courses = await fetch(`${backend_express_admin}/user_list`, {credentials: 'include'});
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getLanguageList() {
    try {
        let response_courses = await fetch(`${backend_express_admin}/language_list`, {credentials: 'include'});
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getCourseList() {
    try {
        let response_courses = await fetch(`${backend_express_admin}/course_list`, {credentials: 'include'});
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function setLanguage(data) {
    if(data.rtl === undefined)
        data.rtl = 0;
    try {
        let response = await fetch_post(`${backend_express_admin}/set_language`, data);
        return response.text();
    }
    catch (e) {
        return [];
    }
}

export async function setCourse(data) {
    try {
        let response = await fetch_post(`${backend_express_admin}/set_course`, data);
        return response.text();
    }
    catch (e) {
        return [];
    }
}

export async function setSyncFlag() {
    try {
        let response = await fetch_post(`${backend_set}/sync_flags`, {});
        return response.text();
    }
    catch (e) {
        return "error";
    }
}

export async function setSyncFrontendStories() {
    try {
        let response = await fetch_post(`${backend_set}/sync_stories`, {});
        return response.text();
    }
    catch (e) {
        return "error";
    }
}

export async function setSyncFrontendEditor() {
    try {
        let response = await fetch_post(`${backend_set}/sync_editor`, {});
        return response.text();
    }
    catch (e) {
        return "error";
    }
}

export async function setSyncVoiceList() {
    try {
        let response = await fetch_post(`${backend_set}/sync_voice_list`, {});
        return response.text();
    }
    catch (e) {
        return "error";
    }
}

export async function setUserActivated(data) {
    try {
        let response = await fetch_post(`${backend_express_admin}/set_user_activate`, data);
        return await parseInt(response.text());
    }
    catch (e) {
        return undefined;
    }
}

export async function setUserWrite(data) {
    try {
        let response = await fetch_post(`${backend_express_admin}/set_user_write`, data);
        return await parseInt(response.text());
    }
    catch (e) {
        return undefined;
    }
}
