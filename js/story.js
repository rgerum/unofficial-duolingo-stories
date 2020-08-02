backend = "https://carex.uber.space/stories/backend/"
backend_stories = backend+"stories/"
backend_audio = "https://carex.uber.space/stories/audio/"

isEditor = false;

story = undefined;
story_id = undefined;
audio_map = undefined;
audio_objects = undefined;
audio_right = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3");
audio_wrong = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3")
rtl = false;

div_elements = [];

audio_objects = {}
function loadAudios() {
    for(let element of story_json.elements) {
        if(element.line && element.line.content && element.line.content.audio) {
            let audio = element.line.content.audio;
            if(audio.url)
                audio_objects[audio.url] = new Audio(audio.url);
        }
    }
}

function getAudioUrl(id) {
    return `audio/${story_id}/speech_${story_id}_${id}.mp3`
}

async function loadStory(name) {
    await getLanguages();

    let response_json = await fetch(`${backend_stories}get_story_json.php?id=${name}`);
    if(response_json.status === 200) {
        try {
            story_json = await response_json.json();
        }
        catch (e) {
            story_json = undefined;
        }
        if(story_json) {
            console.log("LOADED JSON");
            rtl = language_data[story_json.learningLanguage]["rtl"];

            if(document.getElementById("button_next")) {
                document.getElementById("button_next").dataset.status = "active";
            }
            document.getElementById("license_language").innerText = language_data[story_json.learningLanguage].name;

            if(story_json.discussion)
                d3.select("#button_discuss").style("display", "inline")
                    .on("click", _=>{window.open(story_json.discussion);})

            loadAudios();

            addAll();
            addNext();

            return
        }
    }

    let response = await fetch(`${backend_stories}get_story.php?id=${name}`);
    let data = await response.json();
    story_id = data[0]["id"];
    story = data[0]["text"];

    lang = data[0]['lang'];
    lang_base = data[0]["lang_base"];
    rtl = data[0]["rtl"];

    if(document.getElementById("button_next")) {
        document.getElementById("button_next").dataset.status = "active";
    }
    document.getElementById("license_language").innerText = data[0]["language"];

    if(data[0].discussion && data[0].discussion !== "undefined")
        d3.select("#button_discuss").style("display", "inline")
            .on("click", _=>{window.open(data[0].discussion);})

    await reloadAudioMap();
    processStoryFile();

    loadAudios();
    //addTitle();
    addAll();
    addNext();
}
language_data = {};
async function getLanguages() {
    let response = await fetch(`${backend_stories}get_languages.php`);
    let data = await response.json();
    let languages_ids = {}
    for(let lang of data) {
        languages_ids[lang.short] = lang.id;
        language_data[lang.short] = lang;
    }
    return languages_ids;
}
getLanguages();

async function setStoryDone(id) {
    let response = await fetch(`${backend_stories}set_story_done.php?id=${id}`);
    console.log("response", response);
}

function setProgress(i) {
    document.getElementById("progress_inside").style.width = i+"%";
}


/*              */


function addTextWithTranslationX(dom, content, hideRangesForChallenge, transcriptParts) {
    //                 let newword = target.append("button").attr("class", "clickword")        .attr("data-status", "unselected")
    //                     .text(d => words[i].replace(/~/g, " "))
    //                 click_words_list.push(newword);
    if(0) {
        let tokens = splitTextTokens(content.text);
        let start = 0, end = 0;
        let last_element = undefined;
        for (let token of tokens) {
            end = start + token.length;
            dom.append("span").attr("class", "word")
            start = end;
        }
    }

    function getOverlap(start1, end1, start2, end2) {
        if(start2 === undefined || end2 === undefined)
            return false;
        if(start1 <= start2 && start2 < end1)
            return true;
        if(start2 <= start1 && start1 < end2)
            return true;
        return false;
    }

    function addWord2(dom, start, end) {
        if(hideRangesForChallenge !== undefined &&
            getOverlap(start, end, hideRangesForChallenge.start, hideRangesForChallenge.end)) {
            dom.attr("data-hidden", true);
            dom.attr("data-end", end);
        }

        return dom.text(content.text.substring(start, end))
    }
    function addWord(dom, start, end) {
        let text_pos = start
        if(!content.audio || !audio_objects[content.audio.url]) {
            addWord2(dom, text_pos, end);
            return dom;
        }
        for(let audio of content.audio.keypoints) {
            if(audio.rangeEnd <= text_pos)
                continue

            if(audio.rangeEnd === end && start === text_pos) {
                addWord2(dom
                    .attr("data-audio", audio.audioStart), text_pos, audio.rangeEnd);
                return dom;
            }
            if(audio.rangeEnd <= end) {
                addWord2(dom.append("span").attr("class", "audio")
                    .attr("data-audio", audio.audioStart), text_pos, audio.rangeEnd);
                text_pos = audio.rangeEnd;
                if(text_pos === end)
                    return dom;
            }
            else {
                addWord2(dom.append("span").attr("class", "audio")
                    .attr("data-audio", audio.audioStart), text_pos, end);
                return dom;
            }
        }
        addWord2(dom.append("span"), text_pos, end);
        return dom;
    }
    function addSplitWord(dom, start, end) {
        let parts = splitTextTokens(content.text.substring(start, end));
        if(parts[0] === "")
            parts.splice(0, 1);
        if(parts[parts.length-1] === "")
            parts.pop()

        if(parts.length === 1) {
            addWord(dom, start, end);
            return dom;
        }
        for(let p of parts) {
            addWord(dom.append("span"), start, start+p.length);
            start += p.length;
        }
        return dom;
    }
    let text_pos = 0;
    // iterate over all hints
    for(let hint of content.hintMap) {
        // add the text since the last hint
        if(hint.rangeFrom > text_pos)
            addSplitWord(dom.append("span").attr("class", "word"), text_pos, hint.rangeFrom);

        // add the text with the hint
        addSplitWord(dom.append("span").attr("class", "word tooltip"), hint.rangeFrom, hint.rangeTo+1)
            .append("span").attr("class", "tooltiptext").text(content.hints[hint.hintIndex]);
        // advance the position
        text_pos = hint.rangeTo+1;
    }
    // add the text after the last hint
    if(text_pos < content.text.length)
        addSplitWord(dom.append("span").attr("class", "word"), text_pos, content.text.length);
}

function addSpeakerX(line) {
    let story = d3.select("#story");
    let phrase = story.append("p");

    let bubble = phrase;
    if(line.type === "CHARACTER")
    {
        if(line.avatarUrl === undefined) {
            phrase.append("span").attr("class", "speaker").text(line.characterId);
        }
        else {
            phrase.attr("class", "phrase");
            phrase.append("img").attr("class", "head").attr("src", line.avatarUrl);
            bubble = phrase.append("div").attr("class", "bubble");
        }
    }
    return [phrase, bubble];
}

function playAudioX(phrase, content) {
    if(content.audio !== undefined && audio_objects[content.audio.url] !== undefined) {
        phrase.selectAll("[data-audio]")
            .style("opacity", 0.5)
            .transition()
            .delay(function() { return parseInt(this.dataset.audio)})
            .style("opacity", 1);

        audio_objects[content.audio.url].pause();
        audio_objects[content.audio.url].currentTime = 0;
        audio_objects[content.audio.url].play();
    }
}

function addLoudspeakerX(bubble, content) {
    if(content.audio !== undefined && audio_objects[content.audio.url] !== undefined) {
        let loudspeaker = bubble.append("img").attr("src", "https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg")
            .attr("width", "28px").attr("class", "speaker")
            .on("click", function() { playAudioX(bubble, content)});
    }
}

function addTypeLineElement(data) {
    let phrase = addTypeLine(data);
    phrase.classed("fadeGlideIn", true);

    div_elements.push(function() {
        phrase.classed("hidden", false);

        if(!isEditor)
            playAudioX(phrase, data.line.content);

        //fadeIn(phrase);

        if(document.getElementById("button_next"))
            document.getElementById("button_next").dataset.status = "active";
    });
    return phrase;
}

function addTypeLine(data) {
    let phrase, bubble;
    if(data.line.type === "TITLE") {
        let story = d3.select("#story");
        phrase = story.append("p").attr("class", "title");
        bubble = phrase.append("span").attr("class", "title")
    }
    else
        [phrase, bubble] = addSpeakerX(data.line);

    phrase.classed("hidden", true);

    if(rtl)
        phrase.attr("data-rtl", true);

    addLoudspeakerX(bubble, data.line.content);

    addTextWithTranslationX(bubble, data.line.content, data.hideRangesForChallenge);

    if(isEditor && data.line.content.audio && data.line.content.audio.ssml) {
        let ssml = bubble.append("p").attr("class", "ssml");
        ssml.append("span").attr("class", "ssml_speaker").text(data.line.content.audio.ssml.speaker);
        ssml.append("span").text(data.line.content.audio.ssml.text);
        ssml.append("span").attr("class", "ssml_speaker").text("#"+data.line.content.audio.ssml.id);
    }

    return phrase;
}

function addMultipleChoiceAnswers(question, data, finishedCallback) {
    function selectAnswer(i) {
        let checkbox = answers.nodes()[i].firstChild;
        if(d3.select(answers.nodes()[i]).attr("data-off"))
            return;
        if(i === data.correctAnswerIndex) {
            for(let ii in answers.nodes()) {
                d3.select(answers.nodes()[ii]).attr("data-off", true)
            }
            d3.select(answers.nodes()[i]).attr("data-right", true)
            if(finishedCallback)
                finishedCallback()
            document.removeEventListener("keydown", selectAnswer);
            playSoundRight();
        }
        else {
            d3.select(answers.nodes()[i]).attr("data-off", true)
            d3.select(answers.nodes()[i]).attr("data-false", true)
            playSoundWrong();
        }
    }

    document.addEventListener("keydown", event => {
        if(isEditor)
            return
        if (event.key >= "1" || event.key <= answers.node().length) {
            selectAnswer(parseInt(event.key)-1);
        }
    });
    let answers = question.append("ul").attr("class", "multiple_choice_ul").selectAll("li").data(data.answers).enter()
        .append("li").attr("class", "multiple_choice_li")
        .on("click", function(d, i) { selectAnswer(i);})
        .each(function(d, i) {
            let p = d3.select(this);
            p.append("button").attr("class", "multiple_choice_checkbox").text(" ")
            addTextWithTranslationX(p.append("div").attr("class", "multiple_choice_answer_text"), d);
        })
}

function addTypeMultipleChoice(data) {
    let story = d3.select("#story");
    let question = story.append("p");

    question.classed("hidden", true);
    question.classed("fadeGlideIn", true);

    addTextWithTranslationX(question.append("span").attr("class", "question"), data.question);

    addMultipleChoiceAnswers(question, data, function () {
        questionFinished(question);
    });

    div_elements.push(function() {
        question.classed("hidden", false);
        fadeIn(question);
    });
}

function addTypeChallengePrompt(data) {
    let story = d3.select("#story");
    let question = story.append("p");
    addTextWithTranslationX(question.append("span").attr("class", "question"), data.prompt);
    return question;
}

function addTypeSelectPhrase(data, data2, data3) {
    let story = d3.select("#story");

    let prompt = addTypeChallengePrompt(data);

    let line = addTypeLine(data2);

    function selectAnswer(i) {
        let element = answers.nodes()[i];
        if(answers.nodes()[i].dataset.status) {
            return;
        }
        if(i === data3.correctAnswerIndex) {
            for(let ii = 0; ii < answers.nodes().length; ii++) {
                if(ii !== i)
                    answers.nodes()[ii].dataset.status = "off";
            }
            element.dataset.status = "right";
            // show the filled in text
            line.selectAll('[data-hidden="true"]').attr("data-hidden", undefined);
            // finish the question
            questionFinished(question, prompt);
            document.removeEventListener("keydown", selectAnswer);
            playSoundRight();
        }
        else {
            element.dataset.status = "inactive";
            playSoundWrong();
        }
    }

    document.addEventListener("keydown", event => {
        if(isEditor)
            return
        if (event.key >= "1" || event.key <= answers.node().length) {
            selectAnswer(parseInt(event.key)-1);
        }
    });

    let question = story.append("p");
    let answers = question.append("p").selectAll("button").data(data3.answers).enter()
        .append("button").attr("class", "answer")
        .on("click", function(d, i) { selectAnswer(i);})
        .each(function(d, i) {
            let p = d3.select(this);
            d.hintMap = [];
            addTextWithTranslationX(p.attr("class", "answer_button"), d);
        })

    prompt.classed("hidden", true);
    question.classed("hidden", true);

    prompt.classed("fadeGlideIn", true);
    question.classed("fadeGlideIn", true);
    line.classed("fadeGlideIn", true);

    //playAudio(data.id, phrase);

    div_elements.push(function() {
        prompt.classed("hidden", false);
        setTimeout(() => line.classed("hidden", false), 300);
        setTimeout(() => question.classed("hidden", false), 300*2);
    });
}

function addTypeContinuation(data, data2, data3) {
    let story = d3.select("#story");

    let prompt = addTypeChallengePrompt(data);

    let line = addTypeLine(data2);

    let question = story.append("p");
    addMultipleChoiceAnswers(question, data3, function () {
        line.selectAll('[data-hidden="true"]').attr("data-hidden", undefined);
        questionFinished(question, prompt);
    });

    prompt.classed("hidden", true);
    question.classed("hidden", true);

    prompt.classed("fadeGlideIn", true);
    question.classed("fadeGlideIn", true);
    line.classed("fadeGlideIn", true);

    //playAudio(data.id, phrase);

    div_elements.push(function() {
        prompt.classed("hidden", false);
        setTimeout(() => line.classed("hidden", false), 300);
        setTimeout(() => question.classed("hidden", false), 300*2);
    });
}

function addTypeMatch(data) {
    let count = 0;
    let selected = undefined;
    let selected_item = undefined;

    let story = d3.select("#story");

    let words = [];
    for(let hint of data.fallbackHints) {
        words.push(hint.phrase);
        words.push(hint.translation);
    }

    let sort = [];
    for(let i = 0; i < words.length; i++)
        sort.push(i);
    shuffle(sort);

    let question = story.append("p");
    question.append("span").attr("class", "question").text(data.prompt);
    question.append("p").style("text-align", "center").selectAll("div").data(sort).enter()
        .append("button").attr("class", "word_match").text(d => words[d]).attr("data-status", "unselected")
        .on("click", function(d, i) {
            if(this.dataset.status === "right")
                return
            if(selected === undefined) {
                this.dataset.status = "selected";
                selected = d;
                selected_item = this;
            }
            else if(selected === d) {
                this.dataset.status = undefined;
                selected = undefined;
                selected_item = undefined;
            }
            else {
                if(Math.floor(selected/2) === Math.floor(d/2)) {
                    this.dataset.status = "right";
                    selected_item.dataset.status = "right";
                    count += 1;
                    selected = undefined;
                    selected_item = undefined;
                    if(count === words.length/2)
                        questionFinished(question);
                }
                else {
                    d3.select(this).attr("data-status", "wrong").transition().delay(1500).attr("data-status", undefined);
                    d3.select(selected_item).attr("data-status", "wrong").transition().delay(1500).attr("data-status", undefined);
                    selected = undefined;
                    selected_item = undefined;
                }
            }
        })

    question.classed("hidden", true);
    question.classed("fadeGlideIn", true);

    //playAudio(data.id, phrase);

    div_elements.push(function() {
        question.classed("hidden", false);
    });
}

function addTypeArrange(data, data2, data3) {
    let index = 0;
    let story = d3.select("#story");

    let prompt = addTypeChallengePrompt(data);

    let line = addTypeLine(data2);

    let question = story.append("p").style("text-align", "center");
    question.append("p").selectAll("div").data(data3.selectablePhrases).enter()
        .append("span").attr("class", "word_order")
        .text(d => d)
        .on("click", function(d, i) {
            if(data3.phraseOrder[i] === index) {
                this.dataset.status = "off";

                line.selectAll('[data-hidden="true"]').attr("data-hidden", function() { return this.dataset.end > data3.characterPositions[index] });

                index += 1;
                if(index === data3.selectablePhrases.length) {
                    playSoundRight();
                    questionFinished(question, prompt);
                }
            }
            else {
                if(this.dataset.status !== "off") {
                    d3.select(this).attr("data-status", "wrong").transition().delay(820).attr("data-status", undefined);
                    playSoundWrong();
                }
            }
        })

    prompt.classed("hidden", true);
    question.classed("hidden", true);

    prompt.classed("fadeGlideIn", true);
    question.classed("fadeGlideIn", true);
    line.classed("fadeGlideIn", true);

    //playAudio(data.id, phrase);

    div_elements.push(function() {
        prompt.classed("hidden", false);
        setTimeout(() => line.classed("hidden", false), 300);
        setTimeout(() => question.classed("hidden", false), 300*2);
    });
}

function addTypePointToPhrase(data, data1) {
    let story = d3.select("#story");

    let question = story.append("p");
    addTextWithTranslationX(question.append("span").attr("class", "question"), data.question);

    let line = d3.select(question.node().previousSibling);

    let phrase = question.append("p");//story.append("p");
    if(rtl)
        phrase.attr("data-rtl", true);
    let button_index = 0;
    for(let element of data.transcriptParts) {
        if(element.selectable) {
            phrase.append("div").attr("class", "word_button").datum(button_index)
                                 .text(element.text).on("click", function(d) {
                if(d3.select(this).attr("data-status"))
                   return
                if(d === data.correctAnswerIndex) {
                    phrase.selectAll("div").attr("data-status", "off");
                    d3.select(this).attr("data-status", "right");
                    playSoundRight();
                    questionFinished(question, undefined, () => {
                        line.classed("hidden", false);
                    });
                }
                else {
                    d3.select(this).attr("data-status", "wrong");
                    playSoundWrong();
                }
            })
            button_index += 1;
        }
        else
            phrase.append("span").text(element.text);
    }

    phrase.classed("hidden", true);
    question.classed("hidden", true);

    //playAudio(data.id, phrase);

    div_elements.push(function() {
        line.classed("hidden", true);
        phrase.classed("hidden", false);
        question.classed("hidden", false);
        fadeIn(phrase);
        fadeIn(question);
    });
}

/*              */

let index = 0;

function fadeIn(element) {
    element.style("opacity", 0).style("overflow", "hidden").style("height", "0px")
        .transition(1).style("opacity", 1).style("height", "auto").style("overflow", "");
}
function fadeOut(element) {
    element.style("overflow", "hidden").transition().style("height", "0px").remove();
}

function questionFinished(question, prompt, callback) {
    if(document.getElementById("button_next")) {
        document.getElementById("button_next").onclick = function () {
            document.getElementById("button_next").onclick = addNext;
            //fadeOut(question);
            question.classed("hidden", true)
            if (prompt)
                //fadeOut(prompt);
                prompt.classed("hidden", true);
            if(callback)
                callback();
            d3.select("#footer").attr("data-right", undefined);
            addNext();
        }
        document.getElementById("button_next").dataset.status = "active";
    }
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
function playSoundRight() {
    audio_right.pause();
    audio_right.currentTime = 0;
    audio_right.play();
    d3.select("#footer").attr("data-right", true)
}
function playSoundWrong() {
    audio_wrong.pause();
    audio_wrong.currentTime = 0;
    audio_wrong.play();
}

scroll_enabled = true;
function addNext() {
    let elements = story_json.elements;
    if(document.getElementById("button_next") && document.getElementById("button_next").dataset.status == "inactive")
        return;
    if(document.getElementById("button_next"))
        document.getElementById("button_next").dataset.status = "inactive";
    setProgress(index*100/elements.length);
    if(index == elements.length) {
        if(urlParams.get('test') === null) {
            setStoryDone(story_id);
            if(document.getElementById("button_next"))
                document.getElementById("button_next").onclick = function() { window.location.href = 'index.html?lang='+story_json.learningLanguage+"&lang_base="+story_json.fromLanguage};
        }
        else {
            if(document.getElementById("button_next"))
                document.getElementById("button_next").onclick = function() { window.location.href = 'editor_overview.html?lang='+story_json.learningLanguage+"&lang_base="+story_json.fromLanguage};
        }
        if(document.getElementById("button_next")) {
            document.getElementById("button_next").dataset.status = "active";
            document.getElementById("button_next").innerText = "finished";
        }

        return;
    }

    if(elements[index].type === "LINE") {
        addTypeLine(elements[index]);
    }
    else if(elements[index].type === "MULTIPLE_CHOICE")
        addTypeMultipleChoice(elements[index]);
    else if(elements[index].type === "CHALLENGE_PROMPT") {
        if(elements[index+2].type === "SELECT_PHRASE")
            addTypeSelectPhrase(elements[index], elements[index + 1], elements[index + 2]);
        else if(elements[index+2].type === "MULTIPLE_CHOICE")
            addTypeContinuation(elements[index], elements[index + 1], elements[index + 2]);
        else if(elements[index+2].type === "ARRANGE")
            addTypeArrange(elements[index], elements[index + 1], elements[index + 2]);
        index += 2;
    }
    else if(elements[index].type === "POINT_TO_PHRASE")
        addTypePointToPhrase(elements[index], elements[index-1]);

    else if(elements[index].type === "MATCH")
        addTypeMatch(elements[index])

    index += 1;
    if(scroll_enabled)
    document.documentElement.scrollTo({
        left: 0,
        top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        behavior: 'smooth'
    });
}

function addAll() {
    let elements = story_json.elements;
    for(let index = 0; index < elements.length; index++) {

        if (elements[index].type === "LINE") {
            addTypeLineElement(elements[index]);
        } else if (elements[index].type === "MULTIPLE_CHOICE")
            addTypeMultipleChoice(elements[index]);
        else if (elements[index].type === "CHALLENGE_PROMPT") {
            if (elements[index + 2].type === "SELECT_PHRASE")
                addTypeSelectPhrase(elements[index], elements[index + 1], elements[index + 2]);
            else if (elements[index + 2].type === "MULTIPLE_CHOICE")
                addTypeContinuation(elements[index], elements[index + 1], elements[index + 2]);
            else if (elements[index + 2].type === "ARRANGE")
                addTypeArrange(elements[index], elements[index + 1], elements[index + 2]);
            index += 2;
        } else if (elements[index].type === "POINT_TO_PHRASE")
            addTypePointToPhrase(elements[index], elements[index - 1]);

        else if (elements[index].type === "MATCH")
            addTypeMatch(elements[index])
    }
}

function addNext() {
    let elements = story_json.elements;
    if(document.getElementById("button_next") && document.getElementById("button_next").dataset.status == "inactive")
        return;
    if(document.getElementById("button_next"))
        document.getElementById("button_next").dataset.status = "inactive";
    setProgress(index*100/div_elements.length);
    if(index == div_elements.length) {
        if(urlParams.get('test') === null) {
            setStoryDone(story_id);
            if(document.getElementById("button_next"))
                document.getElementById("button_next").onclick = function() { window.location.href = 'index.html?lang='+story_json.learningLanguage+"&lang_base="+story_json.fromLanguage};
        }
        else {
            if(document.getElementById("button_next"))
                document.getElementById("button_next").onclick = function() { window.location.href = 'editor_overview.html?lang='+story_json.learningLanguage+"&lang_base="+story_json.fromLanguage};
        }
        if(document.getElementById("button_next")) {
            document.getElementById("button_next").dataset.status = "active";
            document.getElementById("button_next").innerText = "finished";
        }

        return;
    }

    div_elements[index]();

    index += 1;
    if(scroll_enabled)
        document.documentElement.scrollTo({
            left: 0,
            top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
            behavior: 'smooth'
        });
}

document.addEventListener("keydown", event => {
    if(isEditor)
        return
    if (event.code === "Enter" || event.code === "Space") {
        if(document.getElementById("button_next"))
            document.getElementById("button_next").onclick();
    }
});