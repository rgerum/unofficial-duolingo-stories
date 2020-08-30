let language_data = undefined;
backend = "https://carex.uber.space/stories/backend/"
backend_stories = backend+"stories/"

async function getLanguageNames() {
    let response = await fetch(`${backend_stories}get_languages.php`);
    let data = await response.json();
    language_data = {};
    for(let lang of data) {
        language_data[lang.short] = lang;
    }
    return language_data;
}

async function getCourses() {
    try {
        let response_courses = await fetch(`${backend_stories}get_courses.php`);
        let data_courses = await response_courses.json();
        return data_courses;
    }
    catch (e) {
        return [];
    }
}

async function getStories(lang, lang_base) {
    try {
        let response = await fetch(`https://carex.uber.space/stories/backend/stories/get_list.php?lang=${lang}&lang_base=${lang_base}`);
        return await response.json();
    }
    catch (e) {
        return [];
    }
}

async function getStoriesEditor(lang, lang_base) {
    try {
        let response = await fetch(`https://carex.uber.space/stories/backend/stories/get_list_editor.php?lang=${lang}&lang_base=${lang_base}`);
        return await response.json();
    }
    catch (e) {
        return undefined;
    }
}

async function getStoryJSON(id) {
    let response_json = await fetch(`${backend_stories}get_story_json.php?id=${id}`);
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
    let response = await fetch(`${backend_stories}get_story.php?id=${id}`);
    let data = await response.json();

    story_id = data[0]["id"];
    await reloadAudioMap();
    story = data[0]["text"];
    story_json = processStoryFile();
    return story_json;
}

function isCourseValid(data_courses, lang, lang_base) {
    let valid_course = false;
    for(let course of data_courses) {
        if(course.learningLanguage === lang && course.fromLanguage === lang_base) {
            valid_course = true;
        }
    }
    return valid_course;
}