import {fetch_post, setCookie, getCookie, isLocalNetwork} from "story-component";

let backend_get = "https://admin.duostories.org/get2"
let backend_set = "https://admin.duostories.org/set2"


let login_data = {username: getCookie("username"), password: getCookie("password")}
async function fetch_get(url) {
    if(!isLocalNetwork())
        return fetch(url);
    /** like fetch but with post instead of get */
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(var i in login_data){
        if(login_data[i] !== undefined)
            fd.append(i,login_data[i]);
    }
    return fetch(url, {
        method: "POST",
        body: fd,
        mode: "cors"
    })
}


export async function getUserList() {
    try {
        let response_courses = await fetch_get(`${backend_get}/user_list`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getLanguageList() {
    try {
        let response_courses = await fetch_get(`${backend_get}/language_list`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getCourseList() {
    try {
        let response_courses = await fetch_get(`${backend_get}/course_list`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function setLanguage(data) {
    try {
        let response = await fetch_post(`${backend_set}/language`, data);
        return response.text();
    }
    catch (e) {
        return [];
    }
}

export async function setCourse(data) {
    try {
        let response = await fetch_post(`${backend_set}/course`, data);
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



export async function getCourses() {
    try {
        let response_courses = await fetch_get(`${backend_get}/courses`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getSession() {
    try {
        let response_courses = await fetch_get(`${backend_get}/session`);
        return await response_courses.json();
    }
    catch (e) {
        return undefined;
    }
}

export async function login(data) {
    // currently only store the local cookies for local test
    if(isLocalNetwork()) {
        login_data = data;
        setCookie("username", data["username"])
        setCookie("password", data["password"])
    }
    // check if the user is logged in
    let reponse = await fetch_post(`${backend_get}/login`, data);
    return reponse.status !== 403;

}

export async function setUserActivated(data) {
    try {
        let response = await fetch_post(`${backend_set}/user_activate`, data);
        return await parseInt(response.text());
    }
    catch (e) {
        return undefined;
    }
}

export async function setUserWrite(data) {
    try {
        let response = await fetch_post(`${backend_set}/user_write`, data);
        return await parseInt(response.text());
    }
    catch (e) {
        return undefined;
    }
}



