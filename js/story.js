backend = "https://carex.uber.space/stories/backend/"
backend_stories = backend+"stories/"
backend_audio = "https://carex.uber.space/stories/audio/"

isEditor = false;

story = undefined;
story_id = undefined;
audio_map = undefined;
audio_objects = undefined;
audio_right = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3");
audio_wrong = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3");
audio_finished = new Audio("https://d35aaqx5ub95lt.cloudfront.net/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3");
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

async function loadStory(name) {
    let language_data = await getLanguageNames();

    story_json = await getStoryJSON(name)
    rtl = language_data[story_json.learningLanguage]["rtl"];

    if(document.getElementById("button_next")) {
        document.getElementById("button_next").dataset.status = "active";
    }
    document.getElementById("license_language").innerText = language_data[story_json.learningLanguage].name;

    if(story_json.discussion)
        d3.select("#button_discuss").style("display", "inline")
            .on("click", _=>{window.open(story_json.discussion);})

    story_id = parseInt(name);

    loadAudios();

    addAll();

    d3.select("#spinner").style("display", "none");

    addNext();

    return
    /*

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
    d3.select("#spinner").style("display", "none");
    addNext();

     */
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


function addTextWithTranslation(dom, content, hideRangesForChallenge, transcriptParts) {
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

function addSpeaker(line) {
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

function playAudio(phrase, content) {
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

function addLoudspeaker(bubble, content) {
    if(content.audio !== undefined && audio_objects[content.audio.url] !== undefined) {
        let loudspeaker = bubble.append("img").attr("src", "https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg")
            .attr("width", "28px").attr("class", "loudspeaker")
            .on("click", function() { playAudio(bubble, content)});
    }
}


function addSpeechLine(data) {
    let phrase, bubble;
    if(data.line.type === "TITLE") {
        let story = d3.select("#story");
        phrase = story.append("p").attr("class", "title");
        bubble = phrase.append("span").attr("class", "title")
    }
    else
        [phrase, bubble] = addSpeaker(data.line);

    phrase.classed("hidden", true);

    if(rtl)
        phrase.attr("data-rtl", true);

    addLoudspeaker(bubble, data.line.content);

    addTextWithTranslation(bubble, data.line.content, data.hideRangesForChallenge);

    if(isEditor && data.line.content.audio && data.line.content.audio.ssml) {
        let id = data.line.content.audio.ssml.id;
        let ssml = bubble.append("p").attr("class", "ssml");
        ssml.append("span").attr("class", "ssml_speaker").text(data.line.content.audio.ssml.speaker);
        ssml.append("span").text(data.line.content.audio.ssml.text);
        ssml.append("span").attr("class", "ssml_speaker").text("#"+data.line.content.audio.ssml.id);
        ssml.append("span").attr("class", "audio_reload").attr("id", "audio_reload"+data.line.content.audio.ssml.id)
            .on("click", () => generate_audio_line(id));
    }

    return phrase;
}

function addMultipleChoiceAnswers(question, data, finishedCallback) {
    // callback when one of the answers was selected
    function selectAnswer(i) {
        // check if it is a valid element
        let element = answer_nodes[i]
        if(!element || d3.select(element).attr("data-off"))
            return

        // is it the correct answer?
        if(i === data.correctAnswerIndex) {
            // deactivate the other inputs
            answers.attr("data-off", true)
            // set the clicked input to "right"
            d3.select(element).attr("data-right", true)
            // remove the keydown event
            document.selectAnswer = undefined;
            // call the finished callback
            if(finishedCallback)
                finishedCallback()
            // play the sound
            playSoundRight();
        }
        else {
            // deactivate it and set it to "x"
            d3.select(element).attr("data-off", true)
            d3.select(element).attr("data-false", true)
            // play the sound
            playSoundWrong();
        }
    }

    // add the answer group and add the items
    let answers = question.append("ul").attr("class", "multiple_choice_ul")
        // add the li items
        .selectAll("li").data(data.answers).enter().append("li")
        .attr("class", "multiple_choice_li")
        // add the click callback
        .on("click", (d, i) => selectAnswer(i))
        // add the text
        .each(function(d, i) {
            let p = d3.select(this);
            p.append("button").attr("class", "multiple_choice_checkbox").text(" ")
            addTextWithTranslation(p.append("div").attr("class", "multiple_choice_answer_text"), d);
        })
    let answer_nodes = answers.nodes();
    // return the callback function
    return selectAnswer;
}

function addButtonAnswers(question, data3, finishedCallback) {
    function selectAnswer(i) {
        let element = answer_nodes[i];
        if(!element || answer_nodes[i].dataset.status)
            return;

        if(i === data3.correctAnswerIndex) {
            for(let ii = 0; ii < answer_nodes.length; ii++) {
                if(ii !== i)
                    answer_nodes[ii].dataset.status = "off";
            }
            element.dataset.status = "right";
            // finish the question
            document.selectAnswer = undefined;
            // call the finished callback
            if(finishedCallback)
                finishedCallback()
            playSoundRight();
        }
        else {
            element.dataset.status = "inactive";
            playSoundWrong();
        }
    }

    let answers = question.append("p")
        .selectAll("button").data(data3.answers).enter().append("button").attr("class", "answer")
        .on("click", function(d, i) { selectAnswer(i);})
        .each(function(d, i) {
            let p = d3.select(this);
            d.hintMap = [];
            addTextWithTranslation(p.attr("class", "answer_button"), d);
        })
    let answer_nodes = answers.nodes();
}

function addChallengePrompt(data) {
    let story = d3.select("#story");
    let question = story.append("p")
        .classed("hidden", true)
        .classed("fadeGlideIn", true);
    addTextWithTranslation(question.append("span").attr("class", "question"), data.prompt);
    return question;
}

/* the elements */

function addTypeLineElement(data) {
    // add a normal speech line
    let phrase = addSpeechLine(data).classed("fadeGlideIn", true);

    // add start call
    div_elements.push(function() {
        // show the line
        phrase.classed("hidden", false);

        // play the audio
        if(!isEditor)
            playAudio(phrase, data.line.content);

        // directly allow to click the next button
        if(document.getElementById("button_next"))
            document.getElementById("button_next").dataset.status = "active";
    });
    return phrase;
}

function addTypeMultipleChoice(data) {
    // add the parent element
    let question = d3.select("#story").append("p").classed("hidden", true).classed("fadeGlideIn", true);
    // add the question text
    addTextWithTranslation(question.append("span").attr("class", "question"), data.question);
    // add the answers
    let selectAnswer = addMultipleChoiceAnswers(question, data, ()=> questionFinished(question));

    // add start call
    div_elements.push(function() {
        // on start, show the question
        question.classed("hidden", false);
        fadeIn(question);
        // and accept key events
        document.selectAnswer = selectAnswer;
    });
}

function addTypeSelectPhrase(data, data2, data3) {
    // add the question
    let prompt = addChallengePrompt(data);
    // add the speech line
    let line = addSpeechLine(data2);
    // add the answers
    let answers = d3.select("#story").append("p").attr("class", "hidden fadeGlideIn");
    let selectAnswer = addButtonAnswers(answers, data3, () => {
        // show the filled in text
        line.selectAll('[data-hidden="true"]').attr("data-hidden", undefined);
        questionFinished(answers, prompt);
    })

    line.classed("fadeGlideIn", true);

    div_elements.push(function() {
        prompt.classed("hidden", false);
        document.selectAnswer = selectAnswer;

        setTimeout(() => {
            line.classed("hidden", false);
            if(!isEditor)
                playAudio(line, data2.line.content);
        }, 300);
        setTimeout(() => answers.classed("hidden", false), 300*2);
    });
}

function addTypeContinuation(data, data2, data3) {
    // add the question
    let prompt = addChallengePrompt(data);
    // add the speech line
    let line = addSpeechLine(data2);

    let answers = d3.select("#story").append("p").attr("class", "hidden fadeGlideIn");
    let selectAnswer = addMultipleChoiceAnswers(answers, data3, function () {
        line.selectAll('[data-hidden="true"]').attr("data-hidden", undefined);
        questionFinished(answers, prompt);
    });

    line.classed("fadeGlideIn", true);

    div_elements.push(function() {
        prompt.classed("hidden", false);
        setTimeout(() => {
            line.classed("hidden", false);
            if(!isEditor)
                playAudio(line, data2.line.content);
        }, 300);
        setTimeout(() => answers.classed("hidden", false), 300*2);
        document.selectAnswer = selectAnswer;
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

    let prompt = addChallengePrompt(data);

    let line = addSpeechLine(data2);

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


    question.classed("hidden", true);

    question.classed("fadeGlideIn", true);
    line.classed("fadeGlideIn", true);

    //playAudio(data.id, phrase);

    div_elements.push(function() {
        prompt.classed("hidden", false);
        setTimeout(() => {
            line.classed("hidden", false);
            if(!isEditor)
                playAudio(line, data2.line.content);
        }, 300);
        setTimeout(() => question.classed("hidden", false), 300*2);
    });
}

function addTypePointToPhrase(data, data1) {
    let story = d3.select("#story");

    let question = story.append("p");
    addTextWithTranslation(question.append("span").attr("class", "question"), data.question);

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

function addStoryFinish() {
    let page = d3.select("#main").append("div").attr("class", "page_finished").append("div");
    let image = page.append("div").attr("class", "finished_image_container");
    let stars = image.append("div");
    stars.append("div").attr("class", "star1")
    stars.append("div").attr("class", "star2")
    stars.append("div").attr("class", "star3")
    image = image.append("div").attr("class", "finished_image");
    image.append("img").attr("src", story_json.illustrations.active);
    image.append("img").attr("src", story_json.illustrations.gilded).attr("class", "image_golden");
    page.append("h2").text("Story complete!");
    page.append("p").text(`You finished "${story_json.fromLanguageName}"`);
    d3.select("#header").style("display", "none")
    audio_finished.play();
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

/**
 * Add all the story elements to the DOM
 */
function addAll() {
    let elements = story_json.elements;
    // iterate over all the elements of the story
    for(let index = 0; index < elements.length; index++) {
        // a normal text line
        if (elements[index].type === "LINE") {
            addTypeLineElement(elements[index]);
        }
        // a multiple choice question
        else if (elements[index].type === "MULTIPLE_CHOICE")
            addTypeMultipleChoice(elements[index]);
        // a question consisting of multiple elements
        else if (elements[index].type === "CHALLENGE_PROMPT") {
            // a select the right phrase question
            if (elements[index + 2].type === "SELECT_PHRASE")
                addTypeSelectPhrase(elements[index], elements[index + 1], elements[index + 2]);
            // a continuation question
            else if (elements[index + 2].type === "MULTIPLE_CHOICE")
                addTypeContinuation(elements[index], elements[index + 1], elements[index + 2]);
            // a bring the words in the right order question
            else if (elements[index + 2].type === "ARRANGE")
                addTypeArrange(elements[index], elements[index + 1], elements[index + 2]);
            // advance the index because these elements belong together
            index += 2;
        }
        // a click on the right word question
        else if (elements[index].type === "POINT_TO_PHRASE")
            addTypePointToPhrase(elements[index], elements[index - 1]);
        // a match the pairs question
        else if (elements[index].type === "MATCH")
            addTypeMatch(elements[index])
    }
}

/**
 * The user has clicked on the "continue" button
 */
function addNext() {
    let button = document.getElementById("button_next");
    // only if the button is active
    if(button && button.dataset.status === "inactive")
        return;
    // set the button to inactive
    if(button)
        button.dataset.status = "inactive";

    // advance the progress bar
    setProgress(index*100/div_elements.length);

    // if we have reached the last element
    if(index === div_elements.length) {
        // if this is not just a test
        if(urlParams.get('test') === null) {
            // store in the database that the story was done
            setStoryDone(story_id);
        }
        // the button loads now back to the previous page
        if(button)
            button.onclick = function() { goBack(); };
        // add the story finished page
        addStoryFinish();
        if(button) {
            button.dataset.status = "active";
        }
        // scroll to the finished page
        scroll();

        return;
    }
    // execute the command to show the next part
    div_elements[index]();
    // advance the index
    index += 1;
    // and scroll to the new question
    scroll();
}

document.selectAnswer = undefined;
document.addEventListener("keydown", event => {
    if(isEditor)
        return
    if (event.code === "Enter" || event.code === "Space") {
        if(document.getElementById("button_next"))
            document.getElementById("button_next").onclick();
    }
    if (event.key >= "1" || event.key <= "9") {
        if(document.selectAnswer)
            document.selectAnswer(parseInt(event.key)-1);
    }
});

function goBack() {
    if(urlParams.get('test') === null) {
        window.location.href = 'index.html?lang='+story_json.learningLanguage+"&lang_base="+story_json.fromLanguage;
    }
    else
        window.location.href = 'editor_overview.html?lang='+story_json.learningLanguage+"&lang_base="+story_json.fromLanguage;
}

function quit() {
    if(confirm("Are you sure you want to quit? Your progress in this story will be lost.")) {
        goBack();
    }
}

function scroll() {
    if(scroll_enabled)
        document.documentElement.scrollTo({
            left: 0,
            top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
            behavior: 'smooth'
        });
}