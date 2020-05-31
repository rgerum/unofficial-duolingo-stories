backend = "https://carex.uber.space/stories/backend/stories/"

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
async function loadStory(name) {
    //let response = await fetch(name+".txt");
    let response = await fetch(`${backend}get_story.php?id=${name}`);
    let data = await response.json();
    story_id = data[0]["id"];
    story = data[0]["text"];
    document.getElementById("button_next").dataset.status = "active";
    processStoryFile();
    addTitle();
//    addNext();
}
async function getLanguages() {
    let response = await fetch(`${backend}get_languages.php`);
    let data = await response.json();
    let languages_ids = {}
    for(let lang of data)
        languages_ids[lang.short] = lang.id;
    return languages_ids;
}
async function setStoryDone(id) {
    let response = await fetch(`${backend}set_story_done.php?id=${id}`);
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
    for (let line of story.split("\n")) {
        line = line.trim();
        if (line.length === 0 || line.substr(0, 1) === "#")
            continue;
        if (line.substr(0, 1) === ">") {
            line = line.substr(1);
            line = line.split(/\s*([^:]+)\s*:\s*(.+)\s*/).splice(1, 2);
            phrases.push({tag: "phrase", speaker: line[0], text: line[1]});
            continue;
        }

        if (line.substr(0, 1) === "[") {
            // split the part in brackets
            line = line.split(/\s*\[(.*)\]\s*(.+)\s*/).splice(1, 2);
            if (line[0] === "choice") {
                phrases.push({tag: line[0], question: line[1], answers: [], solution: 0});
            }
            if (line[0] === "fill") {
                let line2 = line[1].split(/\s*([^:]+)\s*:\s*(.+)\s*/).splice(1, 2);
                phrases.push({tag: line[0], question: "", speaker: line2[0], text: line2[1], translation: "", answers: [], solution: 0});
            }
            if (line[0] === "order") {
                let line2 = line[1].split(/\s*([^:]+)\s*:\s*(.*)\s*/).splice(1, 2);
                phrases.push({tag: line[0], question: "", speaker: line2[0], text: line2[1], translation: "", words: []});
            }
            if (line[0] === "pairs") {
                phrases.push({tag: line[0], question: line[1], words: [], solution: 0});
            }
            if (line[0] === "click") {
                phrases.push({tag: line[0], question: line[1], answers: [], solution: 0});
            }
            continue;
        }
        if(phrases[phrases.length - 1]) {
            if (phrases[phrases.length - 1].tag === "phrase" && line.substr(0, 1) === "~") {
                line = line.substr(1);
                line = line.split(/\s*([^:]+)\s*:\s*(.+)\s*/).splice(1, 2);
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
                        let splited = line[2].split("/");
                        phrases[phrases.length - 1].answers.push([splited[0], "", splited[1]]);
                    }
                    if (line[1] === "~") {
                        let anwers = phrases[phrases.length - 1].answers;
                        if(anwers.length === 0) {
                            line = line[2].split(/\s*([^:]+)\s*:\s*(.+)\s*/).splice(1, 2);
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
                else if(phrases[phrases.length - 1].words.length === 0)
                    phrases[phrases.length - 1].words = line.split("/");
                else
                    phrases[phrases.length - 1].translations = line.split("/");
                continue;
            }
            if (phrases[phrases.length - 1].tag === "click") {
                if (phrases[phrases.length - 1].question === "")
                    phrases[phrases.length - 1].question = line;
                else if(phrases[phrases.length - 1].words.length === 0)
                    phrases[phrases.length - 1].words = line.split("/");
                else
                    phrases[phrases.length - 1].translations = line.split("/");
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
function addTextWithTranslation(target, words, translation, words_fill, translation_fill) {
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
        let word = span.append("span").attr("class", "word").text(w[1].replace(/~/g, " "))
        if(translation !== undefined && translation !== "" && translation !== "~" && translation !== "~." && translation !== "~," && translation !== "~!" && translation !== "~?" && translation !== "~:") {
            let t = translation.split(/([^.,!?:]*)([.,!?:]*)/);
            word.attr("class", "word tooltip")
            word.append("span").attr("class", "tooltiptext").text(t[1].replace(/~/g, " "));
        }
        let space = span.append("span").text(w[2]+" ");
        return [word, space];
    }

    let inserted = undefined;
    for(let i in words) {
        if(words[i] === "")
            continue;
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

function fadeIn(element){
    element.style("opacity", 0).style("overflow", "hidden").style("height", "0px")
        .transition(1).style("opacity", 1).style("height", "auto");
}

function addSpeach(data) {
    let story = d3.select("#story");
    let phrase = story.append("p");
    phrase.append("span").attr("class", "speaker").text(data.speaker);
    if(data.translation == undefined)
        phrase.append("span").attr("class", "text").text(data.text);//.each(addTextWithHints);
    else {
        addTextWithTranslation(phrase.append("span"), data.text, data.translation);
    }
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
                document.getElementById("button_next").onclick = function () {
                    document.getElementById("button_next").onclick = addNext;
                    question.style("overflow", "hidden").transition().style("height", "0px").remove();
                    addNext();
                }
                document.getElementById("button_next").dataset.status = "active";
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
    let story = d3.select("#story");
    let phrase = story.append("p");
    phrase.append("span").attr("class", "speaker").text(data.speaker);
    //phrase.append("span").attr("class", "text").text(data.text.replace("*", "______"));
    let base_lang = 0;
    if(data.answers[data.solution][2] !== undefined)
        base_lang = 1;
    let inserted = addTextWithTranslation(phrase.append("span").attr("class", "text"),
        data.text, data.translation, data.answers[data.solution][0+base_lang*2], data.answers[data.solution][1+base_lang*2]);

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(data.answers).enter()
        .append("div").attr("class", "answer")
        .on("click", function(d, i) {
            let checkbox = this.firstChild;
            if(i == data.solution) {
                checkbox.dataset.status = "right";
                checkbox.innerText = "✓";
                inserted.attr("data-hidden", undefined);
                document.getElementById("button_next").onclick = function () {
                    document.getElementById("button_next").onclick = addNext;
                    question.style("overflow", "hidden").style("opacity", 1).transition().duration(750).style("height", "0px").style("opacity", 0).remove();
                    addNext();
                }
                document.getElementById("button_next").dataset.status = "active";
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
    function getEmptyLength() {
        let length = "";
        for(let i = index; i < data.words.length; i++)
            for(let j = 0; j < data.words[i].length + 1; j++)
                length += "_";
        return length;
    }

    let story = d3.select("#story");
    let phrase = story.append("p");
    phrase.append("span").attr("class", "speaker").text(data.speaker);
    let inserted = addTextWithTranslation(phrase.append("span").attr("class", "text"),
        data.text, data.translation, data.words, data.translations);
    //phrase.append("span").attr("class", "text").text(getEmptyLength());
    let text = "";

    let sort = [];
    for(let i = 0; i < data.words.length; i++)
        sort.push(i);
    shuffle(sort);

    let selected_words = [];
    let selected_translations = [];

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(sort).enter()
        .append("button").attr("class", "clickword")        .attr("data-status", "unselected")
        .text(d => data.words[d].replace(/~/g, " "))
        .on("click", function(d, i) {
            if(d === index) {
                this.dataset.status = "empty";
                inserted.attr("data-hidden", d => (d<=index) ? undefined : true);
                index += 1;
                if(index === data.words.length) {
                    document.getElementById("button_next").onclick = function () {
                        document.getElementById("button_next").onclick = addNext;
                        question.style("overflow", "hidden").transition().style("height", "0px").remove();
                        addNext();
                    }
                    document.getElementById("button_next").dataset.status = "active";
                }
            }
            else {
                if(this.dataset.status === "unselected")
                    d3.select(this).attr("data-status", "wrong_shake").transition().delay(820).attr("data-status", "unselected")
            }
        })

    fadeIn(question);
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
            if(this.dataset.status == "inactive")
                return
            if(selected == undefined) {
                this.dataset.status = "selected";
                selected = d;
                selected_item = this;
                console.log(selected, selected_item);
            }
            else if(selected == d) {
                this.dataset.status = "unselected";
                selected = undefined;
                selected_item = undefined;
            }
            else {
                console.log(selected_item, this, selected_item, d)
                if(Math.floor(selected/2) === Math.floor(d/2)) {
                    this.dataset.status = "inactive";
                    selected_item.dataset.status = "inactive";
                    count += 1;
                    selected = undefined;
                    selected_item = undefined;
                    if(count == data.words.length/2) {
                        document.getElementById("button_next").onclick = function () {
                            document.getElementById("button_next").onclick = addNext;
                            question.style("overflow", "hidden").transition().style("height", "0px").remove();
                            addNext();
                        }
                        document.getElementById("button_next").dataset.status = "active";
                    }
                }
                else {
                    selected_item.dataset.status = "unselected";
                    this.status = "unselected";
                    selected = undefined;
                    selected_item = undefined;
                }
            }
            if(0) {
                this.dataset.status = "empty";
                text += " " + data.words[d];
                count += 1;
                phrase.select(".text").text(text+" "+getEmptyLength());
                if(count == data.words.length) {
                    document.getElementById("button_next").onclick = function () {
                        document.getElementById("button_next").onclick = addNext;
                        question.style("overflow", "hidden").transition().style("height", "0px").remove();
                        addNext();
                    }
                    document.getElementById("button_next").dataset.status = "active";
                }
            }
        })

    fadeIn(question);
}
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
    if(phrases[index].tag === "phrase")
        addSpeach(phrases[index]);
    if(phrases[index].tag === "choice")
        addMultipleChoice(phrases[index]);
    if(phrases[index].tag === "fill")
        addFinishMultipleChoice(phrases[index]);
    if(phrases[index].tag === "order")
        addOrder(phrases[index]);
    if(phrases[index].tag === "pairs")
        addPairs(phrases[index]);
    index += 1;
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
