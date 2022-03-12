import {fetch_post} from "./includes.mjs";

let backend_get = "https://carex.uber.space/stories/backend/editor/get.php"
let backend_set = "https://carex.uber.space/stories/backend/editor/set.php"


export async function getCourses() {
    try {
        let response_courses = await fetch(`${backend_get}?action=courses`);
        let data_courses = await response_courses.json();
        return data_courses;
    }
    catch (e) {
        return [];
    }
}

export async function getSession() {
    try {
        let response_courses = await fetch(`${backend_get}?action=session`);
        let data_courses = await response_courses.json();
        return data_courses;
    }
    catch (e) {
        return undefined;
    }
}

export async function getCourse(id) {
    console.log("getCourse", id, `${backend_get}?action=course&id=${id}`)
    try {
        let response = await fetch(`${backend_get}?action=course&id=${id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getAvatars(id, course_id) {
    console.log("getAvatars", id, `${backend_get}?action=avatar_names&id=${id}`)
    try {
        let response = await fetch(`${backend_get}?action=avatar_names&id=${id}&course_id=${course_id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getSpeakers(id) {
    try {
        let response = await fetch(`${backend_get}?action=speakers&id=${id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setAvatarSpeaker(data) {
    try {
        let response = await fetch_post(`${backend_set}?action=avatar`, data);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setPublic(id, is_public) {
    return await fetch(backend_stories+"set_story_public.php?id="+id+"&public="+is_public);
}


export async function getStory(id) {
    let response_json = await fetch(`${backend_get}?action=story&id=${id}`);
    return response_json.json();
}
export async function getAvatar(id) {
    try {
        let response_json = await fetch(`${backend_get}?action=avatar&id=${id}`);
        return response_json.json();
    }
    catch (e) {
        return {};
    }
}

export async function getImportList(id, id2) {
    let response_json = await fetch(`${backend_get}?action=import&id=${id}&id2=${id2}`);
    return response_json.json();
}

export async function setImport(id, course_id) {
    let response_json = await fetch(`${backend_set}?action=import&id=${id}&course_id=${course_id}`);
    return response_json.text();
}

export async function setStory(data) {
    let res = await fetch_post(`${backend_set}?action=story`, data);
    res = await res.text()
    return res;
}

export async function deleteStory(data) {
    let res = await fetch_post(`${backend_set}?action=story_delete`, data);
    res = await res.text()
    return res;
}



