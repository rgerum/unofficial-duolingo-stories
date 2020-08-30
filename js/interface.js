

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
        let a = parent.append("a").attr("class", "language_select_item")
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

function addEditorCourses(parent, data_lang, language_data, lang, lang_base) {
    parent.selectAll("div").remove();
    for(let course of data_lang) {
        let language = language_data[course.learningLanguage];
        let name = course.name || language.name;

        let div = parent.append("div");

        let a = parent.append("a").attr("class", "course_selection_button")
            .attr("href", `editor_overview.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`);

        a.append("span").attr("class", "course_count").text(`${course.count}`)
        let flag = a.append("div").attr("class", "flag").style("background-position", `0 ${language.flag}px`);
        if(language.flag_file != null)
            flag.style("background-image", `url(flags/${language.flag_file})`);
        a.append("span").text(`${course.learningLanguageName} [${course.fromLanguage}]`)
        /*

        div.append("span").html(" &bull; ")
        let a = div.append("a").text(`${course.learningLanguageName} [${course.fromLanguage}] (${course.count})`).attr("href", `editor_overview.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`);
        if(course.learningLanguage === lang && course.fromLanguage === lang_base) {
            a.style("font-weight", "bold");
        }*/
    }
}

function addEditorTable(parent, data) {
    console.log("addEditorTable", parent, data);
    parent.selectAll("tr").remove();
    parent.selectAll("tr").data(data).enter().append("tr")
        .each(function(d) {
            function pad(x) {
                if(x < 10)
                    return "&nbsp;"+x;
                return x;
            }
            let td = d3.select(this).append("td");
            if(d.set_id)
                td.append("span").html("<b>"+pad(d.set_id)+"</b>"+"&nbsp;-&nbsp;"+pad(d.set_index))
            td = d3.select(this).append("td").attr("width", "30px");
            if(d.image)
                td.append("img").attr("src", d.image).attr("width", "30px")
            //if(d.image_done)
            //    td.append("img").attr("src", d.image_done).attr("width", "30px")
            td = d3.select(this).append("td");
            td.append("a")
                .attr("href", "editor.html?story="+d.id+"&lang="+urlParams.get('lang')+ "&lang_base=" + urlParams.get('lang_base'))
                .text(d.name_base)

            d3.select(this).append("td").style("text-align", "right").text("+"+d.xp+"xp")
            d3.select(this).append("td").text(d.username)
            d3.select(this).append("td").text(d.date)
            d3.select(this).append("td").text(d.change_date)
            d3.select(this).append("td").style("text-align", "right").each(function() {
                d3.select(this).append("span").html(`${d.count}x&nbsp;`);
                d3.select(this).append("a").attr("href", "story.html?test&story=" + d.id + "&lang=" + urlParams.get('lang') + "&lang_base=" + urlParams.get('lang_base')).text("[test]")
            });
            d3.select(this).append("td").style("text-align", "right").html(`
                <label class="switch">
                  <input type="checkbox" ${d.public ? "checked" : ""}>
                  <span class="slider round"></span>
                </label>
                `).on("click", async function () {
                console.log("clicked", this, d.public);
                d3.event.preventDefault();
                if(!d.public) {
                    if(confirm(`Do you want to publish the story \"${d.name_base}\"?`)) {
                        let response = await fetch(backend_stories+"set_story_public.php?id="+d.id+"&public=1");
                        if(response.status === 200) {
                            d3.select(this).select("input").attr("checked", "true");
                            d.public = 1;
                        }
                    }
                }
                else {
                    if(confirm(`Do you want to hide the story \"${d.name_base}\"?`)) {
                        let response = await fetch(backend_stories+"set_story_public.php?id="+d.id+"&public=0");
                        if(response.status === 200) {
                            d3.select(this).select("input").attr("checked", null);
                            d.public = 0;
                        }
                    }
                }
            })
        })
}