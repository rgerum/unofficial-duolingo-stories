backend = "https://carex.uber.space/stories/backend/"
backend_stories = backend+"stories/"
backend_audio = "https://carex.uber.space/stories/audio/"

Date.prototype.now = function () {
    var day = ((this.getDate() < 10)?"0":"") + this.getDate();
    var month = (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1);
    var year = this.getFullYear();
    var hours = ((this.getHours() < 10)?"0":"") + this.getHours();
    var minutes = ((this.getMinutes() < 10)?"0":"") + this.getMinutes();
    var seconds = ((this.getSeconds() < 10)?"0":"") + this.getSeconds();

    return year+"-"+month+"-"+day+" "+hours+":"+minutes+":"+seconds;
};

function fetch_post(url, data) {
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(var i in data){
        fd.append(i,data[i]);
    }
    var req = new Request(url,{
        method:"POST",
        body:fd,
        mode:"cors"
    });
    return fetch(req);
}


story = undefined;
story_id = undefined;
audio_map = undefined;
audio_objects = undefined;
async function loadStory(name) {
    //let response = await fetch(name+".txt");
    audio_map = await fetch(`audio/${name}/audio_${name}.json`);
    if(audio_map.status !== 200)
        audio_map = undefined;
    else {
        audio_map = await audio_map.json();
        audio_objects = {}
        for(let id in audio_map)
            audio_objects[id] = new Audio(`audio/${name}/speech_${name}_${id}.mp3`);
    }
    let response = await fetch(`${backend_stories}get_story.php?id=${name}`);
    let data = await response.json();
    story_id = data[0]["id"];
    story = data[0]["text"];
    document.getElementById("button_next").dataset.status = "active";
    processStoryFile();
    addTitle();
//    addNext();
}
async function getLanguages() {
    let response = await fetch(`${backend_stories}get_languages.php`);
    let data = await response.json();
    let languages_ids = {}
    for(let lang of data)
        languages_ids[lang.short] = lang.id;
    return languages_ids;
}
async function setStoryDone(id) {
    let response = await fetch(`${backend_stories}set_story_done.php?id=${id}`);
    console.log("response", response);
}

function setProgress(i) {
    document.getElementById("progress_inside").style.width = i+"%";
}

let phrases = undefined;
let story_properties = undefined;
function processStoryFile() {
    phrases = [];
    story_properties = {title: "", language: ""}
    let code_block = false;
    for (let line of story.split("\n")) {
        if (line.substr(0, 3) === '"""') {
            if(code_block === true) {
                code_block = false;
                phrases[phrases.length - 1].text = phrases[phrases.length - 1].text.trim();
            }
            else {
                code_block = true;
                phrases.push({tag: "code", text: ""});
            }
            continue;
        }
        if (line.substr(0, 3) === '>>>') {
            if(code_block === true) {
                code_block = false;
                phrases[phrases.length - 1].text = phrases[phrases.length - 1].text.trim();
            }
            else {
                code_block = true;
                phrases.push({tag: "html", text: ""});
            }
            continue;
        }
        if(code_block) {
            phrases[phrases.length - 1].text += line+"\n";
            continue;
        }
        line = line.trim();
        if (line.length === 0 || line.substr(0, 1) === "#")
            continue;
        if (line.substr(0, 1) === ">") {
            line = line.substr(1);
            line = line.split(/\s*(?:([^:]+)\s*:)?\s*(.+)\s*/).splice(1, 2);
            phrases.push({tag: "phrase", id: phrases.length+1, speaker: line[0], text: line[1]});
            continue;
        }

        if (line.substr(0, 1) === "[") {
            // split the part in brackets
            line = line.split(/\s*\[(.*)\]\s*(.+)\s*/).splice(1, 2);
            if (line[0] === "choice") {
                phrases.push({tag: line[0], id: phrases.length+1, question: line[1], answers: [], solution: 0});
            }
            if (line[0] === "fill") {
                let line2 = line[1].split(/\s*(?:([^:]+)\s*:)?\s*(.+)\s*/).splice(1, 2);
                phrases.push({tag: line[0], id: phrases.length+1, question: "", speaker: line2[0], text: line2[1], translation: "", answers: [], solution: 0});
            }
            if (line[0] === "order") {
                let line2 = line[1].split(/\s*(?:([^:]+)\s*:)?\s*(.+)\s*/).splice(1, 2);
                phrases.push({tag: line[0], id: phrases.length+1, question: "", speaker: line2[0], text: line2[1], translations: [], words: []});
            }
            if (line[0] === "pairs") {
                phrases.push({tag: line[0], id: phrases.length+1, question: line[1], words: [], solution: 0});
            }
            if (line[0] === "click") {
                phrases.push({tag: line[0], id: phrases.length+1, question: line[1], speaker: "", text: "", solution: 0});
            }
            continue;
        }
        if(phrases[phrases.length - 1]) {
            if (phrases[phrases.length - 1].tag === "phrase" && line.substr(0, 1) === "~") {
                line = line.substr(1);
                line = line.split(/\s*(?:([^:]+)\s*:)?\s*(.+)\s*/).splice(1, 2);
                phrases[phrases.length - 1].translation = line[1];
                phrases[phrases.length - 1].translation_speaker = line[0];
                continue;
            }

            if (phrases[phrases.length - 1].tag === "choice") {
                line = line.split(/\s*([~+-])\s*(.+)\s*/);
                console.log("[choice]", line);
                if (line[1] === "+")
                    phrases[phrases.length - 1].solution = phrases[phrases.length - 1].answers.length;
                if (line[1] === "+" || line[1] === "-") {
                    let splited = line[2].split("/");
                    phrases[phrases.length - 1].answers.push([splited[0], "", splited[1]]);
                }
                if (line[1] === "~") {
                    let splited = line[2].split("/");
                    let anwers = phrases[phrases.length - 1].answers;
                    anwers[anwers.length-1][1] = splited[0];
                    anwers[anwers.length-1][3] = splited[1];
                }
                continue;
            }
            if (phrases[phrases.length - 1].tag === "fill") {
                line = line.split(/\s*([~+-])\s*(.+)\s*/);
                console.log("FILL", line, line[1], line.length)
                if (line.length === 1 && phrases[phrases.length - 1].question === "") {
                    phrases[phrases.length - 1].question = line[0];
                }
                else {
                    if (line[1] === "+")
                        phrases[phrases.length - 1].solution = phrases[phrases.length - 1].answers.length;
                    if (line[1] === "+" || line[1] === "-") {
                        let correct = line[1] === "+";
                        let splited = line[2].split("/");
                        phrases[phrases.length - 1].answers.push([splited[0], "", splited[1]]);
                        // construct the target text (for audio)
                        if(correct) {
                            if (splited[1] === undefined)
                                phrases[phrases.length - 1].full_text = phrases[phrases.length - 1].text.replace("*", splited[0]);
                            else
                                phrases[phrases.length - 1].full_text = phrases[phrases.length - 1].text.replace("*", splited[1]);
                        }
                    }
                    if (line[1] === "~") {
                        let anwers = phrases[phrases.length - 1].answers;
                        if(anwers.length === 0) {
                            line = line[2].split(/\s*(?:([^:]+)\s*:)?\s*(.+)\s*/).splice(1, 2);
                            phrases[phrases.length - 1].translation = line[1];
                        }
                        else {
                            let splited = line[2].split("/");
                            anwers[anwers.length-1][1] = splited[0];
                            anwers[anwers.length-1][3] = splited[1];
                        }
                    }
                }
                continue;
            }
            if (phrases[phrases.length - 1].tag === "order") {
                if (phrases[phrases.length - 1].question === "")
                    phrases[phrases.length - 1].question = line;
                else if(phrases[phrases.length - 1].words.length === 0 || phrases[phrases.length - 1].translations.length !== 0) {
                    phrases[phrases.length - 1].words.push(line.split("/"));

                    // construct the target text (for audio)
                    if(phrases[phrases.length - 1].words.length === 1) {
                        phrases[phrases.length - 1].full_text = phrases[phrases.length - 1].text.replace("*", line.split("/").join(" "));
                    }
                }
                else
                    phrases[phrases.length - 1].translations.push(line.split("/"));
                continue;
            }
            if (phrases[phrases.length - 1].tag === "click") {
                if(line[0] === "~") {
                    line = line.substr(1);
                    line = line.split(/\s*(?:([^:]+)\s*:)?\s*(.+)\s*/).splice(1, 2);
                    phrases[phrases.length - 1].translation = line[1];
                    phrases[phrases.length - 1].translation_speaker = line[0];
                }
                else {
                    line = line.split(/\s*(?:([^:]+)\s*:)?\s*(.+)\s*/).splice(1, 2);
                    phrases[phrases.length - 1].text = line[1];
                    phrases[phrases.length - 1].speaker = line[0];
                }
                continue;
            }
            if (phrases[phrases.length - 1].tag === "pairs") {
                line = line.split(/\s*(.+)\s+-\s+(.+)\s*/).splice(1, 2);
                phrases[phrases.length - 1].words.push(line[0]);
                phrases[phrases.length - 1].words.push(line[1]);
                continue;
            }
        }
        if(line.search("=") !== -1) {
            let [key, value] = line.split("=");
            console.log(line, key, value);
            story_properties[key] = value;
        }
    }
    console.log(phrases);
}

let index = 0;
function addTitle() {
    let story = d3.select("#story");
    let phrase = story.append("p");
    phrase.append("span").attr("class", "title").text(story_properties.title);
    document.getElementById("button_next").dataset.status = "active";
}
function addTextWithTranslation(target, words, translation, words_fill, translation_fill, click_words=false) {
    console.log("addTextWithTranslation", target, words, translation, words_fill, translation_fill);
    if(typeof words === "string")
        words = words.trim().split(/\s+/);
    if(typeof translation === "string")
        translation = translation.trim().split(/\s+/);
    if(translation === undefined)
        translation = [];
    if(typeof words_fill === "string")
        words_fill = words_fill.trim().split(/\s+/);
    if(typeof translation_fill === "string")
        translation_fill = translation_fill.trim().split(/\s+/);

    function addWord(words, translation) {
        console.log("addWord", words, translation);
        let w = words.split(/([^.,!?:]*)([.,!?:]*)/);
        let span = target;

        let singe_words = w[1].replace(/~/g, " ").split(" ")

        let word = span.append("span");
        if(singe_words.length === 1)
            word.attr("class", "word").text(singe_words[0])
        else
            word.selectAll("span").data(singe_words).enter().append("span").attr("class", "word").text((d,i)=>d+(i===(singe_words.length-1) ? "": " "));

        if(translation !== undefined && translation !== "" && translation !== "~" && translation !== "~." && translation !== "~," && translation !== "~!" && translation !== "~?" && translation !== "~:") {
            let t = translation.split(/([^.,!?:]*)([.,!?:]*)/);
            if(singe_words.length === 1)
                word.attr("class", "word tooltip")
            else
                word.attr("class", "tooltip")
            word.append("span").attr("class", "tooltiptext").text(t[1].replace(/~/g, " "));
        }
        let space = span.append("span").text(w[2]+" ");
        return [word, space];
    }

    let inserted = undefined;
    let click_words_list = [];
    let click_words_solution = 0;
    for(let i in words) {
        if(words[i] === "")
            continue;
        if(words[i][0] === "[") {
            let parts = words[i].split(/(\[)(\+?)(.*)(\])/);
            words[i] = parts[3];
            if(click_words === true) {
                let newword = target.append("button").attr("class", "clickword")        .attr("data-status", "unselected")
                    .text(d => words[i].replace(/~/g, " "))
                click_words_list.push(newword);
                if(parts[2] === "+")
                    click_words_solution = click_words_list.length-1;
                continue
            }
        }
        if(words[i][0] === "*" && words_fill !== undefined) {
            inserted = []
            let data = []
            let added_element;
            for(let j in words_fill) {
                for (added_element of addWord(words_fill[j], translation_fill[j])) {
                    inserted.push(added_element.node());
                    data.push(j);
                }
            }
            if(words[i].substr(1) !== "") {
                d3.select(inserted.pop()).remove()
                data.pop();
                addWord(words[i].substr(1), (translation[i]||"").substr(1));
            }
            inserted = d3.selectAll(inserted);
            inserted.data(data).attr("data-hidden", true);
        }
        else
            addWord(words[i], translation[i]);
    }
    if(click_words === true)
        return [click_words_list, click_words_solution];
    return inserted;
/*
    target.selectAll("span").data(words).enter().append("span")
        .each(function(d, i) {
            let word = d3.select(this).append("span").attr("class", "word").text(d.replace(/~/g, " "))
            console.log(d, i, translation[i], words[i]);
            if(translation[i] !== undefined && translation[i] !== "" && translation[i] !== "~" && translation[i] !== "~." && translation[i] !== "~," && translation[i] !== "~!" && translation[i] !== "~?" && translation[i] !== "~:") {
                word.attr("class", "word tooltip")
                word.append("span").attr("class", "tooltiptext").text(translation[i].replace(/~/g, " "));
            }
            d3.select(this).append("span").text(" ");
        })*/
}

function fadeIn(element) {
    element.style("opacity", 0).style("overflow", "hidden").style("height", "0px")
        .transition(1).style("opacity", 1).style("height", "auto").style("overflow", "");
}
function fadeOut(element) {
    element.style("overflow", "hidden").transition().style("height", "0px").remove();
}

function questionFinished(question) {
    document.getElementById("button_next").onclick = function () {
        document.getElementById("button_next").onclick = addNext;
        fadeOut(question);
        addNext();
    }
    document.getElementById("button_next").dataset.status = "active";
}

function addHtml(data) {
    let story = d3.select("#story");
    let part = story.append("div")
    part.node().innerHTML += data.text;
}
let editors = [];
function addCode(data) {
    let story = d3.select("#story");
    let phrase = story.append("div").attr("id", "editor"+editors.length);
    //phrase.text(data.text);

    var editor = ace.edit(phrase.node());
    console.log("EDITOR", editor);
    editors.push(editor);

    editor.setOptions({
        maxLines: Infinity
    });

    editor.session.setMode("ace/mode/javascript-custom");
    editor.setTheme("ace/theme/dracula");

    editor.session.setUseWrapMode(true);
    editor.resize();
    editor.setReadOnly(true);

    editor.setValue(data.text);
    editor.blur();
}

function addSpeaker(speaker) {
    let story = d3.select("#story");
    let phrase = story.append("p");
    //if(data.speaker !== undefined)
    //    phrase.append("span").attr("class", "speaker").text(data.speaker);
    let bubble = phrase;
    if(speaker !== undefined)
    {
        let name = story_properties
            ["icon_"+speaker];
        if(name === undefined) {
            phrase.append("span").attr("class", "speaker").text(speaker);
        }
        else {
            phrase.attr("class", "phrase");
            phrase.append("img").attr("class", "head").attr("src", name)
            bubble = phrase.append("div").attr("class", "bubble");
            //if (data.translation === undefined)
            //    bubble.append("span").attr("class", "text").text(text);//.each(addTextWithHints);
        }
    }
    return [phrase, bubble];
}

function playAudio(id, phrase) {
    if(audio_map !== undefined) {
        let audio_map_data = audio_map[id];
        let times = [];
        for(let part of audio_map_data) {
            times.push(part.time);
        }
        function wait(d, i) {
            console.log("wait", d, i, times[i])
            return times[i];
        }

        phrase.selectAll(".word").style("opacity", 0.5).transition().delay(wait).style("opacity", 1);
        audio_objects[id].play();
    }
}

function addSpeech(data) {
    let [phrase, bubble] = addSpeaker(data.speaker);
    if(data.translation == undefined)
        bubble.append("span").attr("class", "text").text(data.text);//.each(addTextWithHints);
    else {
        addTextWithTranslation(bubble.append("span"), data.text, data.translation);
    }
    
    playAudio(data.id, phrase);

    fadeIn(phrase);

    document.getElementById("button_next").dataset.status = "active";
}
function addTextWithHints(elem) {
    let text = this.innerText;
    this.innerText = "";
    d3.select(this).selectAll("span").data(text.split(" ")).enter().append("span")
        .attr("class", "word")
        .text(d=>d).on("mouseover", hoverWord);
}
function addMultipleChoice(data) {
    let story = d3.select("#story");
    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(data.answers).enter()
        .append("div").attr("class", "answer")
        .on("click", function(d, i) {
            let checkbox = this.firstChild;
            if(i == data.solution) {
                checkbox.dataset.status = "right";
                checkbox.innerText = "✓";
                questionFinished(question);
            }
            else {
                checkbox.dataset.status = "false";
                checkbox.innerText = "×";
            }
        })
        .each(function(d, i) {
            let p = d3.select(this);
            p.append("div").attr("class", "checkbox").text(" ")
            addTextWithTranslation(p.append("div").attr("class", "answer_text"), d[0], d[1]);
        })

    fadeIn(question);
}
function addFinishMultipleChoice(data) {
    console.log("addFinishMultipleChoice");
    let story = d3.select("#story");

    let [phrase, bubble] = addSpeaker(data.speaker);
    //if(data.speaker !== undefined)
    //    phrase.append("span").attr("class", "speaker").text(data.speaker);

    let base_lang = 0;
    if(data.answers[data.solution][2] !== undefined)
        base_lang = 1;
    let inserted = addTextWithTranslation(bubble.append("span").attr("class", "text"),
        data.text, data.translation, data.answers[data.solution][0+base_lang*2], data.answers[data.solution][1+base_lang*2]);

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(data.answers).enter()
        .append("div").attr("class", "answer")
        .on("click", function(d, i) {
            let checkbox = this.firstChild;
            if(i === data.solution) {
                checkbox.dataset.status = "right";
                checkbox.innerText = "✓";
                // show the filled in text
                console.log("inserted", inserted)
                inserted.attr("data-hidden", undefined);
                // finish the question
                questionFinished(question);
            }
            else {
                checkbox.dataset.status = "false";
                checkbox.innerText = "×";
            }
        })
        .each(function(d, i) {
            let p = d3.select(this);
            p.append("div").attr("class", "checkbox").text(" ")
            addTextWithTranslation(p.append("div").attr("class", "answer_text"), d[0], d[1]);
        })

    playAudio(data.id, phrase);

    fadeIn(question);
}
/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function addOrder(data) {
    let index = 0;

    let story = d3.select("#story");
    let [phrase, bubble] = addSpeaker(data.speaker);

    let inserted = addTextWithTranslation(bubble.append("span").attr("class", "text"),
        data.text, data.translation, data.words[0], data.translations[0]);

    let sort = [];
    for(let i = 0; i < data.words[0].length; i++)
        sort.push(i);
    shuffle(sort);

    let allowed_order = [];
    for(let i = 0; i < data.words.length; i++) {
        allowed_order.push([]);
    }
    for(let i = 0; i < data.words[0].length; i++) {
        allowed_order[0].push(i);
        for(let j = 1; j < data.words.length; j++) {
            allowed_order[j].push(parseInt(data.words[j][i])-1);
        }
    }
    console.log("allowed_order", allowed_order);

    let clicked_order = [];
    function checkOrderAllowed(new_value) {
        for (let j = 0; j < allowed_order.length; j++) {
            for(let i = 0; i < allowed_order[j].length; i++) {
                console.log("check", j, i, clicked_order[i], allowed_order[j][i], new_value, "-", i === clicked_order.length, new_value === allowed_order[j][i])
                if (i === clicked_order.length && new_value === allowed_order[j][i])
                    return true;
                if(clicked_order[i] !== allowed_order[j][i])
                    break
            }
        }
        return false;
    }

    function getSortOder(d) {
        for(let j = 0; j < clicked_order.length; j++) {
            console.log("---", clicked_order[j], parseInt(d), clicked_order[j] == parseInt(d))
            if (clicked_order[j] == parseInt(d))
                return j;
        }
        return 99;
    }

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(sort).enter()
        .append("button").attr("class", "clickword")        .attr("data-status", "unselected")
        .text(d => data.words[0][d].replace(/~/g, " "))
        .on("click", function(d, i) {
            if(checkOrderAllowed(d)) {
                clicked_order.push(d);
                console.log("clicked_order", clicked_order, inserted.nodes())
                this.dataset.status = "empty";
                inserted.attr("data-hidden", function(d, i) {
                        return (clicked_order.includes(parseInt(d))) ? undefined : true
                    })
                    .sort((a, b) => getSortOder(a) - getSortOder(b));
                index += 1;
                if(index === data.words[0].length)
                    questionFinished(question);
            }
            else {
                if(this.dataset.status === "unselected")
                    d3.select(this).attr("data-status", "wrong_shake").transition().delay(820).attr("data-status", "unselected")
            }
        })

    playAudio(data.id, phrase);

    fadeIn(question);
}
function addClick(data) {
    let story = d3.select("#story");

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);

    let phrase = question.append("p");//story.append("p");
    if(data.speaker !== undefined)
        phrase.append("span").attr("class", "speaker").text(data.speaker);
    let [click_words_list, click_words_solition] = addTextWithTranslation(phrase.append("span").attr("class", "text"),
        data.text, data.translation, undefined, undefined, true);

    for(let i = 0; i < click_words_list.length; i++) {
        if(i === click_words_solition) {
            click_words_list[i].on("click", function() {
                for(let i = 0; i < click_words_list.length; i++) {
                    if(i !== click_words_solition)
                        click_words_list[i].attr("data-status", "inactive");
                }
                d3.select(this).attr("data-")
                questionFinished(question);
            });
        }
        else {
            click_words_list[i].on("click", function() {
                d3.select(this).attr("data-status", "wrong_shake").transition().delay(820).attr("data-status", "inactive");
            });
        }
    }

    fadeIn(question);
    fadeIn(phrase);
}

function addPairs(data) {
    let count = 0;
    let selected = undefined;
    let selected_item = undefined;

    let story = d3.select("#story");

    let sort = [];
    for(let i = 0; i < data.words.length; i++)
        sort.push(i);
    shuffle(sort);

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(sort).enter()
        .append("button").attr("class", "clickword").text(d => data.words[d]).attr("data-status", "unselected")
        .on("click", function(d, i) {
            if(this.dataset.status === "inactive")
                return
            if(selected === undefined) {
                this.dataset.status = "selected";
                selected = d;
                selected_item = this;
            }
            else if(selected === d) {
                this.dataset.status = "unselected";
                selected = undefined;
                selected_item = undefined;
            }
            else {
                if(Math.floor(selected/2) === Math.floor(d/2)) {
                    this.dataset.status = "inactive";
                    selected_item.dataset.status = "inactive";
                    count += 1;
                    selected = undefined;
                    selected_item = undefined;
                    if(count === data.words.length/2)
                        questionFinished(question);
                }
                else {
                    selected_item.dataset.status = "unselected";
                    this.status = "unselected";
                    selected = undefined;
                    selected_item = undefined;
                }
            }
        })

    fadeIn(question);
}
scroll_enabled = true;
function addNext() {
    if(document.getElementById("button_next").dataset.status == "inactive")
        return;
    document.getElementById("button_next").dataset.status = "inactive";
    setProgress(index*100/phrases.length);
    if(index == phrases.length) {
        setStoryDone(story_id);
        document.getElementById("button_next").dataset.status = "active";
        document.getElementById("button_next").innerText = "finished";
        document.getElementById("button_next").onclick = function() { window.location.href = 'index.html?lang='+story_properties["lang"]+"&lang_base="+story_properties["lang_base"]};

        return;
    }
    if(phrases[index].tag === "html")
        addHtml(phrases[index]);
    if(phrases[index].tag === "code")
        addCode(phrases[index]);

    if(phrases[index].tag === "phrase")
        addSpeech(phrases[index]);
    if(phrases[index].tag === "choice")
        addMultipleChoice(phrases[index]);
    if(phrases[index].tag === "fill")
        addFinishMultipleChoice(phrases[index]);
    if(phrases[index].tag === "order")
        addOrder(phrases[index]);
    if(phrases[index].tag === "pairs")
        addPairs(phrases[index]);
    if(phrases[index].tag === "click")
        addClick(phrases[index]);
    index += 1;
    if(scroll_enabled)
    document.documentElement.scrollTo({
        left: 0,
        top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        behavior: 'smooth'
    });
}


let json;
async function hoverWord(element) {
    if(this.dataset.has_translation === null)
        return;
    if(this.dataset.has_translation === undefined) {
        this.dataset.has_translation = null;
        console.log("https://linguee-api.herokuapp.com/api?q=" + this.innerText + "&src="+story_properties.lang+"&dst=en")
        let test = await fetch("https://linguee-api.herokuapp.com/api?q=" + this.innerText + "&src="+story_properties.lang+"&dst=en")
        json = await test.json();
        if (json.exact_matches && json.exact_matches[0].translations) {
            let trans = json.exact_matches[0].translations[0].text
            this.dataset.has_translation = true;
            this.dataset.translation = trans;
            console.log(trans);
            d3.select(this).attr("class", "word tooltip").append("span").attr("class", "tooltiptext").text(trans);
        } else {
            this.dataset.has_translation = false;
        }
    }
    console.log("currenttrans", this.dataset.translation, this.dataset.has_translation);
}

function download_json() {
    let j = document.createElement("a")
    j.id = "download"
    j.download = "story"+story_id+".json"
    j.href = URL.createObjectURL(new Blob([JSON.stringify({"meta": story_properties, "phrases": phrases}, null, 2)]))
    j.click()
}

async function upload_json() {
    let json = JSON.stringify({"meta": story_properties, "phrases": phrases});
    let response = await fetch_post(`${backend_audio}set_audio.php`, {"id": story_id, "json": json});
    console.log(response);
    let text = await response.text();
    console.log(text);
    return text;
}