story = undefined;
async function loadStory(name) {
    let response = await fetch(name+".txt");
    story = await response.text();
    document.getElementById("button_next").dataset.status = "active";
    processStoryFile();
    addTitle();
//    addNext();
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
        if (line.length == 0)
            continue;
        if (line.substr(0, 1) == ">") {
            line = line.substr(1);
            line = line.split(/\s*([^:]+)\s*:\s*(.+)\s*/).splice(1, 2);
            phrases.push({tag: "phrase", speaker: line[0], text: line[1]});
            continue;
        }
        if (line.substr(0, 1) == "[") {
            // split the part in brackets
            line = line.split(/\s*\[(.*)\]\s*(.+)\s*/).splice(1, 2);
            if (line[0] == "choice") {
                phrases.push({tag: line[0], question: line[1], answers: [], solution: 0});
            }
            if (line[0] == "finish") {
                let line2 = line[1].split(/\s*([^:]+)\s*:\s*(.+)\s*/).splice(1, 2);
                phrases.push({tag: line[0], question: "", speaker: line2[0], text: line2[1], answers: [], solution: 0});
            }
            if (line[0] == "order") {
                let line2 = line[1].split(/\s*([^:]+)\s*:\s*(.*)\s*/).splice(1, 2);
                phrases.push({tag: line[0], question: "", speaker: line2[0], text: "", words: []});
            }
            if (line[0] == "pairs") {
                phrases.push({tag: line[0], question: line[1], words: [], solution: 0});
            }
            if (line[0] == "click") {
                phrases.push({tag: line[0], question: line[1], answers: [], solution: 0});
            }
            continue;
        }
        if(phrases[phrases.length - 1]) {
            if (phrases[phrases.length - 1].tag === "choice") {
                line = line.split(/\s*([+-])\s*(.+)\s*/);
                if (line[1] == "+")
                    phrases[phrases.length - 1].solution = phrases[phrases.length - 1].answers.length;
                phrases[phrases.length - 1].answers.push(line[2]);
                continue;
            }
            if (phrases[phrases.length - 1].tag === "finish") {
                line = line.split(/\s*([+-])\s*(.+)\s*/);
                if (line.length == 1)
                    phrases[phrases.length - 1].question = line[0];
                else {
                    if (line[1] == "+")
                        phrases[phrases.length - 1].solution = phrases[phrases.length - 1].answers.length;
                    phrases[phrases.length - 1].answers.push(line[2]);
                }
                continue;
            }
            if (phrases[phrases.length - 1].tag === "order") {
                if (phrases[phrases.length - 1].question == "")
                    phrases[phrases.length - 1].question = line;
                else
                    phrases[phrases.length - 1].words = line.split("/");
                continue;
            }
            if (phrases[phrases.length - 1].tag === "click") {
                if (phrases[phrases.length - 1].question == "")
                    phrases[phrases.length - 1].question = line;
                else
                    phrases[phrases.length - 1].words = line.split("/");
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
function addSpeach(data) {
    let story = d3.select("#story");
    let phrase = story.append("p");
    phrase.append("span").attr("class", "speaker").text(data.speaker);
    phrase.append("span").attr("class", "text").text(data.text).each(addTextWithHints);

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
            p.append("div").attr("class", "answer_text").text(d);
        })
}
function addFinishMultipleChoice(data) {
    let story = d3.select("#story");
    let phrase = story.append("p");
    phrase.append("span").attr("class", "speaker").text(data.speaker);
    phrase.append("span").attr("class", "text").text(data.text.replace("*", "______"));

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(data.answers).enter()
        .append("div").attr("class", "answer")
        .on("click", function(d, i) {
            let checkbox = this.firstChild;
            if(i == data.solution) {
                checkbox.dataset.status = "right";
                checkbox.innerText = "✓";
                phrase.select(".text").text(data.text.replace("*", data.answers[i]));
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
            p.append("div").attr("class", "answer_text").text(d);
        })
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
        for(let i = story; i < data.words.length; i++)
            for(let j = 0; j < data.words[i].length + 1; j++)
                length += "_";
        return length;
    }

    let story = d3.select("#story");
    let phrase = story.append("p");
    phrase.append("span").attr("class", "speaker").text(data.speaker);
    phrase.append("span").attr("class", "text").text(getEmptyLength());
    let text = "";

    let sort = [];
    for(let i = 0; i < data.words.length; i++)
        sort.push(i);
    shuffle(sort);

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.question);
    question.append("p").selectAll("div").data(sort).enter()
        .append("div").attr("class", "clickword")        .attr("data-status", "unselected")
        .text(d => data.words[d])
        .on("click", function(d, i) {
            if(d == index) {
                this.dataset.status = "empty";
                text += " " + data.words[d];
                index += 1;
                phrase.select(".text").text(text+" "+getEmptyLength());
                if(index == data.words.length) {
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
        .append("div").attr("class", "clickword").text(d => data.words[d]).attr("data-status", "unselected")
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
}
function addNext() {
    if(document.getElementById("button_next").dataset.status == "inactive")
        return;
    document.getElementById("button_next").dataset.status = "inactive";
    setProgress(index*100/phrases.length);
    if(index == phrases.length) {
        document.getElementById("button_next").dataset.status = "active";
        document.getElementById("button_next").innerText = "finished";
        document.getElementById("button_next").onclick = function() { window.location.href = 'index.html?lang='+story_properties["language"]};

        return;
    }
    if(phrases[index].tag === "phrase")
        addSpeach(phrases[index]);
    if(phrases[index].tag === "choice")
        addMultipleChoice(phrases[index]);
    if(phrases[index].tag === "finish")
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
        console.log("https://linguee-api.herokuapp.com/api?q=" + this.innerText + "&src="+story_properties.language+"&dst=en")
        let test = await fetch("https://linguee-api.herokuapp.com/api?q=" + this.innerText + "&src="+story_properties.language+"&dst=en")
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