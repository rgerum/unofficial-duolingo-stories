export function get_backend() {
    let backend = "https://carex.uber.space/stories/backend/"
    if(window.location.host === "www.duostories.org" || window.location.host === "duostories.org")
        backend = "https://"+window.location.host+"/stories/backend/"
    return backend;
}
let backend = get_backend();
let backend_stories = backend+"stories/"
window.backend_stories = backend_stories

export async function getLanguageNames() {
    /**
     * Get the language data table.
     * @type {Response}
     */
    let response = await fetch(`${backend_stories}get_languages.php`);
    let data = await response.json();
    window.language_data = {};
    for(let lang of data) {
        window.language_data[lang.short] = lang;
    }
    return window.language_data;
}

export async function getCourses() {
    try {
        let response_courses = await fetch(`${backend_stories}get_courses.php`);
        return await response_courses.json();
    }
    catch (e) {
        return [];
    }
}

export async function getPublicCourses() {
    try {
        let response_courses = await fetch(`${backend_stories}get_courses.php`);
        let data_courses = await response_courses.json();
        let public_courses = [];
        for(let course of data_courses)
            if(course.public)
                public_courses.push(course)
        return public_courses;
    }
    catch (e) {
        return [];
    }
}

export async function getStoriesSets(lang, lang_base) {
    try {
        let response = await fetch(`${backend}/stories/get_list.php?lang=${lang}&lang_base=${lang_base}`);
        let data =  await response.json();

        let set = -1;
        let sets = [];
        for(let d of data) {
            if (set !== d.set_id) {
                set = d.set_id;
                sets.push([]);
            }
            sets[sets.length - 1].push(d);
        }
        return sets;
    }
    catch (e) {
        return [];
    }
}

export async function getStoriesEditor(lang, lang_base) {
    try {
        let response = await fetch(`${backend}/stories/get_list_editor.php?lang=${lang}&lang_base=${lang_base}`);
        return await response.json();
    }
    catch (e) {
        return undefined;
    }
}

export async function setPublic(id, is_public) {
    return await fetch(backend_stories+"set_story_public.php?id="+id+"&public="+is_public);
}

export async function getStoryJSON(id) {
    let response_json = await fetch(`${backend_stories}get_story_json.php?id=${id}`);
    let story_json;
    if(response_json.status === 200) {
        try {
            story_json = await response_json.json();
        } catch (e) {
            story_json = undefined;
        }
        if (story_json) {
            return story_json;
        }
    }
}

export async function getLexicon(lang) {
    try {
        let response = await fetch(`${backend}/stories/get_lexicon.php?lang=${lang}`);
        return await response.json();
    }
    catch (e) {
        return {};
    }
}

export async function setStoryDone(id) {
    await fetch(`${backend_stories}set_story_done.php?id=${id}`);
}
