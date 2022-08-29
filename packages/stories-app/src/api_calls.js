export function get_backend() {
    let backend = "https://carex.uber.space/stories/backend/"
    if(window.location.host === "www.duostories.org" || window.location.host === "duostories.org")
        backend = "https://"+window.location.host+"/stories/backend/"
    return backend;
}
let backend = get_backend();
let backend_stories = backend+"stories/"
window.backend_stories = backend_stories

export async function getCoursesUser() {
    try {
        let response_courses = await fetch(`${backend_stories}get_courses_user.php`);
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
    if(lang === undefined || lang_base === undefined)
        return {sets: []}
    try {
        let response = await fetch(`${backend}/stories/get_list.php?lang=${lang}&lang_base=${lang_base}`);
        let data = await response.json();

        let set = -1;
        let sets = [];
        for(let d of data.stories) {
            if (set !== d.set_id) {
                set = d.set_id;
                sets.push([]);
            }
            sets[sets.length - 1].push(d);
        }
        data.sets = sets;
        return data;
    }
    catch (e) {
        return {sets: []}
    }
}
