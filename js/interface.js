

function addBigLanguageButtons(parent, data_courses, language_data) {
    parent.selectAll("*").remove();
    let list_div = parent.append("div").attr("class", "set_list");
    for(let course of data_courses) {
        // ignore courses that are not public yet
        if(!course.public)
            continue
        // get the learningLanguage
        let language = language_data[course.learningLanguage];
        let name = course.name || language.name;
        // add the link/button
        let div = list_div.append("a");
        div.attr("class", "language_select_button")
        div.attr("href", `index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`);
        // add the flag
        let flag = div.append("div")
            .attr("class", "flag flag_big")
            .style("background-position", `0 ${language.flag}px`);
        if(language.flag_file != null)
            flag.style("background-image", `url(flags/${language.flag_file})`);
        // add the text
        div.append("span").text(name).attr("class", "language_select_button_text")
    }
}

function addSmallLanguageButtons(parent, data_courses, language_data, lang) {
    parent.selectAll("a").remove();
    for(let course of data_courses) {
        let language = language_data[course.learningLanguage];
        let name = course.name || language.name;

        if(language.short === lang) {
            let flag = d3.select("#current_language_flag").style("background-position", `0 ${language.flag}px`);
            if(language.flag_file != null) {
                flag.style("background-image", `url(flags/${language.flag_file})`);
            }
        }
        if (!course.public)
            continue
        let a = d3.select("#header_lang_selector").append("a").attr("class", "language_select_item")
            .attr("href", `index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`)
            .style("display", "block")
        let flag = a.append("div").attr("class", "flag").style("background-position", `0 ${language.flag}px`);
        if(language.flag_file != null)
            flag.style("background-image", `url(flags/${language.flag_file})`);
        a.append("span").text(name);
    }
}

function addStorySets(parent, data) {
    parent.selectAll("*").remove();

    let set = -1;
    let div = undefined;
    for(let d of data) {
        if(set != d.set_id) {
            parent.append("div").attr("class", "set").text("Set "+d.set_id)
            set = d.set_id;
            div = parent.append("div").attr("class", "set_list");
        }
        let a = div.append("a")
            .style("width", "150px")
            .attr("href", _=>"story.html?story="+d.id)
        let button = a.append("button")
            .attr("class", "button_story")
            .attr("data-done", _=>d.time != null)
        if(d.image) {
            if(d.time != null && d.image_done != null)
                button.append("img").attr("src", d.image_done)
            else {
                button.append("img").attr("src", d.image);
                button.style("box-shadow", "#"+images_lip_colors[d.image]+" 0 6px")
            }
        }
        a.append("div")
            .attr("class", "story_title")
            .text(d.name_base)
        a.append("div")
            .attr("class", "story_xp")
            .text("+"+d.xp+"xp")
    }
}