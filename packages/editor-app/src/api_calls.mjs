import {fetch_post, setCookie, getCookie, isLocalNetwork} from "story-component";

let backend_get = "https://editor.duostories.org/get"
let backend_set = "https://editor.duostories.org/set"

export let backend_express = "/stories/backend_node";
if(isLocalNetwork())
    backend_express = "https://test.duostories.org/stories/backend_node_test";
if(window.location.hostname === "test.duostories.org")
    backend_express = "/stories/backend_node_test";
let backend_express_editor = backend_express + "/editor"

export async function fetch_post2(url, data)
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

export async function getCourses() {
    try {
        let response_courses = await fetch(`${backend_express_editor}/courses`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getSession() {
    try {
        let response_courses = await fetch(`${backend_express}/session`, {credentials: 'include'});
        return await response_courses.json();
    }
    catch (e) {
        return undefined;
    }
}

export async function login(data, remember) {
    // currently only store the local cookies for local test
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // check if the user is logged in
    data["remember"] = remember;
    let reponse = await fetch_post2(`${backend_express}/login`, data);
    return reponse.status !== 403;

}

export async function getCourse(id) {
    if(!id)
        return {}
    try {
        let response = await fetch(`${backend_express_editor}/course/${id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getAvatars(id) {
    try {
        let response = await fetch(`${backend_express_editor}/avatar_names/${id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getAvatarsList(id) {
    if(!id)
        return {}
    let avatar_names_list = await getAvatars(id);
    let avatar_names = {}
    for(let avatar of avatar_names_list) {
        avatar_names[avatar.avatar_id] = avatar;
    }
    return avatar_names;
}

export async function getSpeakers(id) {
    try {
        let response = await fetch(`${backend_express_editor}/speakers/${id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getLanguageName(id) {
    try {
        let response = await fetch(`${backend_express_editor}/language/${id}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setAvatarSpeaker(data) {
    try {
        let response = await fetch_post(`${backend_set}/avatar`, data);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setStatus(data) {
    try {
        let response = await fetch_post(`${backend_set}/status`, data);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setApproval(data) {
    try {
        let response = await fetch_post(`${backend_set}/approve`, data);
        return await response.text();
    }
    catch (e) {
        return undefined;
    }
}

export async function setPublic(id, is_public) {
    return await fetch_get(backend_stories+"set_story_public.php?id="+id+"&public="+is_public);
}


export async function getStory(id) {
    let response_json = await fetch_get(`${backend_get}/story?id=${id}`);
    return response_json.json();
}
export async function getAvatar(id) {
    try {
        let response_json = await fetch_get(`${backend_get}/avatar?id=${id}`);
        return response_json.json();
    }
    catch (e) {
        return {};
    }
}

let images_cached = {};
export function getImage(id) {
    if(images_cached[id] !== undefined) {
        return images_cached[id];
    }
    getImageAsync(id)
    return {}
}

export async function getImageAsync(id) {
    try {
        let response_json = await fetch_get(`${backend_express_editor}/image/${id}`);
        let image = await response_json.json();
        images_cached[id] = image;
        return image;
    }
    catch (e) {
        return {};
    }
}

export async function getImportList(id, id2) {
    let response_json = await fetch(`${backend_express_editor}/import/${id}/${id2}`);
    return response_json.json();
}

export async function setImport(id, course_id) {
    let response_json = await fetch_get(`${backend_set}/import?id=${id}&course_id=${course_id}`);
    return response_json.text();
}

export async function setStory(data) {
    let res = await fetch_post(`${backend_set}/story`, data);
    res = await res.text()
    return res;
}

export async function deleteStory(data) {
    let res = await fetch_post(`${backend_set}/story_delete`, data);
    res = await res.text()
    return res;
}

export const upload_audio_endpoint = `${backend_set}/audio_upload`;

export async function setUploadAudio(id, blob, filename) {
    /** like fetch but with post instead of get */
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(let i in login_data){
        fd.append(i,login_data[i]);
    }
    fd.append("id", id);
    fd.append("file", blob, filename);
    return fetch(upload_audio_endpoint, {
        method: "POST",
        body: fd,
        mode: "cors"
    });
}




