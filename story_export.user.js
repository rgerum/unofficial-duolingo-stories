// ==UserScript==
// @name         Story Export (Unofficial Duolingo Stories)
// @namespace    https://carex.uber.space/stories/
// @version      0.9.1
// @description  Converts official duolingostories to the format of the unoffical duolingo story project
// @author       Randriano
// @match        https://www.duolingo.com/stories/*
// @grant        none
// @require      https://d3js.org/d3.v5.min.js
// @run-at       document-start
// @downloadURL  https://carex.uber.space/stories/story_export.user.js
// ==/UserScript==

(function() {
    'use strict';


    function processData(data) {
        if(data.elements === undefined)
            return;

        let icons = {};

        function getTextAndHints(element) {
            let element_text = "";
            let translation = "";
            let last_start = 0;
            for(let hint of element.hintMap) {
                element_text += element.text.substr(last_start, hint.rangeFrom-last_start);
                translation += element.text.substr(last_start, hint.rangeFrom-last_start).replace(/\w+/g, "~");
                element_text += element.text.substr(hint.rangeFrom, hint.rangeTo-hint.rangeFrom+1).replace(/ /g, "~");
                translation += element.hints[hint.hintIndex].replace(/ /g, "~");
                last_start = hint.rangeTo+1;
            }
            element_text += element.text.substr(last_start);
            translation += element.text.substr(last_start).replace(/[ÀÈÌÒÙàèìòùÁÉÍÓÚÝáéíóúýÂÊÎÔÛâêîôûÃÑÕãñõÄËÏÖÜŸäëïöüŸçÇŒœßØøÅåÆæÞþÐð\w]+/g, "~");
            return [element_text, translation];
        }


        function getTextFromElement(element) {
            let [element_text, translation] = getTextAndHints(element.line.content);

            if(element.hideRangesForChallenge.length !== 0) {
                let range = element.hideRangesForChallenge[0]
                element_text = element_text.substr(0, range.start) + " * " + element_text.substr(range.end);
            }
            if(element.line.type === "PROSE") {
                return [element_text, translation];
            }
            if(element.line.type === "CHARACTER") {
                icons["Speaker"+element.line.characterId] = element.line.avatarUrl;
                return ["Speaker"+element.line.characterId+": "+element_text, textToSpaces("Speaker"+element.line.characterId+": ")+translation];
            }
        }
        function textToSpaces(text) {
            let spaces = "";
            for(let i = 0; i < text.length; i++)
                spaces += " ";
            return spaces;
        }
        let text = [];

        let [title, title_trans] = getTextAndHints( data.elements[0].line.content);

        text.push("title="+title);
        text.push("title_translation="+title_trans);
        text.push("title_base="+data.fromLanguageName);
        text.push("lang="+data.learningLanguage);
        text.push("lang_base="+data.fromLanguage);
        text.push("");
        text.push("image="+data.illustrations.active);
        text.push("image_done="+data.illustrations.gilded);
        text.push("image_locked="+data.illustrations.locked);
        text.push("");

        let properties = text;

        text = [];




        let last_elements = [];

        for(let element of data.elements) {
            console.log(element, element.type);
            if(element.type === "LINE") {
                if(last_elements.length) {
                    last_elements.push(element);
                    continue;
                }
                if(element.line.type === "TITLE")
                    continue
                let [element_text, element_trans] = getTextFromElement(element);
                text.push("> "+element_text);
                text.push("~ "+element_trans);
                text.push("");
                continue
            }
            if(element.type === "MULTIPLE_CHOICE") {
                if(last_elements.length !== 0) {
                    console.log("last_elements", last_elements);
                    text.push("[fill] "+getTextFromElement(last_elements[1])[0]);
                    text.push("~      "+getTextFromElement(last_elements[1])[1]);
                    text.push(last_elements[0].prompt.text);
                    for(let index in element.answers) {
                        let [element_text, translation] = getTextAndHints(element.answers[index]);
                        if(index == element.correctAnswerIndex) {
                            text.push("+ "+element_text);
                        }
                        else {
                            text.push("- "+element_text);
                        }
                        text.push("~ "+translation);
                    }
                    last_elements = [];
                }
                else {
                    text.push("[choice] "+element.question.text);
                    for(let index in element.answers) {
                        if(index == element.correctAnswerIndex) {
                            text.push("+ "+element.answers[index].text);
                        }
                        else {
                            text.push("- "+element.answers[index].text);
                        }
                    }
                }
                text.push("");
                continue
            }
            if(element.type === "CHALLENGE_PROMPT") {
                last_elements.push(element);
                continue
            }
            if(element.type === "SELECT_PHRASE") {
                text.push("[fill] "+getTextFromElement(last_elements[1])[0]);
                text.push("~      "+getTextFromElement(last_elements[1])[1]);
                text.push(last_elements[0].prompt.text);
                for(let index in element.answers) {
                    if(index == element.correctAnswerIndex) {
                        text.push("+ "+element.answers[index]);
                    }
                    else {
                        text.push("- "+element.answers[index]);
                    }
                }
                last_elements = [];
                text.push("");
                continue
            }
            if(element.type === "ARRANGE") {
                text.push("[order] "+getTextFromElement(last_elements[1])[0]);
                text.push(last_elements[0].prompt.text);
                let parts = []
                for(let index of element.phraseOrder) {
                    parts.push(element.selectablePhrases[index]);
                }
                text.push(parts.join("/"));
                text.push("");
                continue
            }
            if(element.type === "POINT_TO_PHRASE") {
                text.push("[click] "+element.question.text);
                let element_text = "";
                let selectable_index = 0;
                for(let index in element.transcriptParts) {
                    if(element.transcriptParts[index].selectable === true) {
                        if(selectable_index == element.correctAnswerIndex)
                            element_text += "[+"+element.transcriptParts[index].text+"]";
                        else
                            element_text += "["+element.transcriptParts[index].text+"]";
                        selectable_index += 1;
                    }
                    else
                        element_text += element.transcriptParts[index].text;
                }
                text.push(element_text);
                text.push("");
                continue
            }
            if(element.type === "TYPE_TEXT") {
                text.push("#[type] Type what you hear");
                text.push("#"+getTextFromElement(last_elements[1])[0]);
                text.push("#"+element.text);
                text.push("");
                last_elements = [];
                continue;
            }
            if(element.type === "MATCH") {
                text.push("[pairs] "+element.prompt);
                for(let line of element.fallbackHints)
                {
                    text.push(line.phrase + " - " + line.translation);
                }
                text.push("");
                continue
            }
            text.push("# unknown part "+JSON.stringify(element));
        }
        for(let icon in icons)
            properties.push("icon_"+icon+"="+icons[icon]);
        properties.push("");
        console.log(properties.join("\n"));
        console.log(text.join("\n"));

        let start_button = d3.select("body").append("div").text("get story text").style("position", "fixed").style("z-index", 10);
        start_button.on("click", function() {
            let textarea = d3.select("body").append("textarea").text(properties.join("\n")+"\n"+text.join("\n")).attr("style", "position: fixed; z-index: 10; width: 0; height: 100vh; top:0px; transition: 2s width").style("width", "calc(100vw - 20px)");
        });
    }

    (function(open) {
        XMLHttpRequest.prototype.open = function() {
            this.addEventListener("readystatechange", function() {

                if (this.readyState == XMLHttpRequest.DONE) {
                    if(this.responseURL.startsWith("https://stories.duolingo.com/api2")) {
                        let x = this.responseText;
                        window.x = x;
                        console.log(x);
                        console.log(JSON.parse(x));
                        processData(JSON.parse(x));
                    }
                    console.log(this.readyState, this.responseURL);
//                console.log(this.responseText);
                }
            }, false);
            open.apply(this, arguments);
        };
    })(XMLHttpRequest.prototype.open);

    window.d3 = d3;
    console.log("Tampermokey 0.1");

    function eventFire(el, etype){
        if(el === null)
            return;
        if (el.fireEvent) {
            el.fireEvent('on' + etype);
        } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
        }
    }

})();