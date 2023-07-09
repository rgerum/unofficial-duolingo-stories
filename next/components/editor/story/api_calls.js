//import {isLocalNetwork} from "includes";

function isLocalNetwork() {return 0;}

let backend_set = "https://editor.duostories.org/set"

export let backend_express = "/stories/backend_node";
if(isLocalNetwork())
    backend_express = "https://test.duostories.org/stories/backend_node_test";
//if(window.location.hostname === "test.duostories.org")
//    backend_express = "/stories/backend_node_test";
let backend_express_editor = backend_express + "/editor"

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

export async function getCourses() {
    try {
        let response_courses = await fetch(`${backend_express_editor}/courses`, {credentials: 'include'});
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getCourse(id) {
    if(!id)
        return {}
    try {
        let response = await fetch(`${backend_express_editor}/course/${id}`, {credentials: 'include'});
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getAvatars(id) {
    try {
        let response = await fetch(`${backend_express_editor}/avatar_names/${id}`, {credentials: 'include'});
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getAvatarsList(id) {
    try {
        if (!id)
            return {}
        let avatar_names_list = await getAvatars(id);
        let avatar_names = {}
        for (let avatar of avatar_names_list) {
            avatar_names[avatar.avatar_id] = avatar;
        }
        return avatar_names;
    }
    catch (e) {
        return {error: "error"}
    }
}

export async function getSpeakers(id) {
    try {
        let response = await fetch(`${backend_express_editor}/speakers/${id}`, {credentials: 'include'});
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function getLanguageName(id) {
    try {
        let response = await fetch(`${backend_express_editor}/language/${id}`, {credentials: 'include'});
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setAvatarSpeaker(data) {
    try {
        let response = await fetch_post(`${backend_express_editor}/set_avatar`, data);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setApproval(data) {
    let response = await fetch_post(`${backend_express_editor}/set_approve`, data);
    return await response.json();
}

export async function getStory(id) {
    try {
        let response_json = await fetch(`${backend_express_editor}/story/${id}`, {credentials: 'include'});
        return response_json.json();
    }
    catch (e) {
        return {error: "error"}
    }
}

export async function getAvatar(id) {
    try {
        let response_json = await fetch(`${backend_express_editor}/avatar/${id}`, {credentials: 'include'});
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
        let response_json = await fetch(`${backend_express_editor}/image/${id}`, {credentials: 'include'});
        let image = await response_json.json();
        images_cached[id] = image;
        return image;
    }
    catch (e) {
        return {};
    }
}

export async function getImportList(id, id2) {
    try {
        let response_json = await fetch(`${backend_express_editor}/import/${id}/${id2}`, {credentials: 'include'});
        return response_json.json();
    }
    catch (e) {
        return [];
    }
}

export async function setImport(id, course_id) {
    let response_json = await fetch(`${backend_express_editor}/set_import/${course_id}/${id}`, {credentials: 'include'});
    let data = await response_json.json();
    return data.id;
}

export async function setStory(data) {
    let res = await fetch_post(`${backend_express_editor}/set_story`, data);
    res = await res.text()
    return res;
}

export async function deleteStory(data) {
    let res = await fetch_post(`${backend_express_editor}/delete_story`, data);
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
