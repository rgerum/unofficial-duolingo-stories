import {useInput, useDataFetcher, useDataFetcher2, useEventListener} from '../js/hooks.js'
import {IndexContent, Login, useUsername, Flag, Spinner} from '../dist/index_react.js'
import {Story} from '../dist/story_react.js'
import {getStoriesEditor, setPublic, getCourses, getStory} from "../js/api_calls.js";
import {processStoryFile, reloadAudioMap, updateAudioLinks, generate_all_audio} from "../js/syntax_parser.js";
import {get_login} from "../js/login.js";
import {getLexicon} from "../js/api_calls.js";
import {fetch_post} from "../js/includes.js";

const urlParams = new URLSearchParams(window.location.search);

/* LOGIN */


async function button_logout() {
    await logout();
    check_login();
}

async function login_button() {
    let success = await login(inputs_to_dict({username: "#username", password: "#password"}));
    if(success == false) {
        document.getElementById("login_status").innerText = "Error: username or password is wrong.";
    }
    else {
        document.getElementById("login_status").innerHTML = "Successfully logged in. Go to the <a href='index.html'>overview</a>.";
        check_login();
    }
}
async function check_login() {
    let login = await get_login();
    console.log("login", login);
    if(login === undefined) {
        document.getElementById("login_form").style.display = "block";
        document.getElementById("loggedin").style.display = "none";
    }
    else {
        document.getElementById("login_form").style.display = "none";
        document.getElementById("loggedin").style.display = "block";
        //document.getElementById("button_editor").style.display = login.role != 0 ? "inline-block" : "none";
        document.getElementById("display_username").innerText = login.username;
    }
}
check_login();

/* EDITOR */

var story_json = undefined;
var langTools = ace.require("ace/ext/language_tools");
var editor = ace.edit("editor");

editor.session.setMode("ace/mode/javascript-custom");
editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true
});
editor.setTheme("ace/theme/dracula");

var myCompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
        var wordList = ["gh"];
        callback(null, wordList.map(function(word) {
            return {
                caption: word,
                value: word
            };
        }));
    }
};
langTools.addCompleter(myCompleter);

editor.session.setUseWrapMode(true);
editor.resize();

editor.commands.addCommand({
    name: 'compile',
    bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
    exec: function(editor) {
        updateStoryDisplay();
    },
    readOnly: true // false if this command should not apply in readOnly mode
});

editor.commands.addCommand({
    name: 'save',
    bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
    exec: function(editor) {
        saveStory();
    },
    readOnly: true // false if this command should not apply in readOnly mode
});

editor.commands.addCommand({
    name: 'tilde',
    bindKey: {win: 'Shift-Space',  mac: 'Shift-Space'},
    exec: function(editor) {
        editor.insert("~")
    },
    readOnly: true // false if this command should not apply in readOnly mode
});

editor.commands.addCommand({
    name: 'speaker',
    bindKey: {win: '>',  mac: '>'},
    exec: function(editor) {
        if(rtl)
            editor.insert("\u2067")
        editor.insert(">")
    },
    readOnly: true // false if this command should not apply in readOnly mode
});
/*
editor.commands.addCommand({
    name: 'accent',
    bindKey: {win: '*',  mac: '*'},
    exec: function(editor) {
        //editor.navigateLeft();
        editor.insert("́")
        //editor.navigateRight();
    },
    readOnly: true // false if this command should not apply in readOnly mode
});
*/
let dirty = false;
editor.getSession().on('change', function() {
    dirty = true;
});

let story = undefined;
story_id = undefined;
let languages_ids = undefined;

async function loadStory(name, name2) {
    if(lexicon === undefined)
        lexicon = await getLexicon(urlParams.get('lang'));

    languages_ids = await getLanguages();
    rtl = language_data[urlParams.get('lang')]["rtl"];
    console.log("RTL", rtl, urlParams.get('lang'), language_data[urlParams.get('lang')], language_data[urlParams.get('lang')]["rtl"]);
    console.log(name, name2)
    if(!name && !name2) {
        story = `title=...
title_base=...
lang=${urlParams.get('lang')}
lang_base=${urlParams.get('lang_base') || "en"}
`;
    }
    else if(!name) {
        //let response = await fetch(name+".txt");
        let response = await fetch(`${backend_stories}get_story.php?id=${name2}`);
        let data = await response.json();
        let text = data[0]["text"];
        text = text.replace(/lang=.*/, `lang=${urlParams.get('lang')}`)
        text = text.replace(/lang_base=.*/, `lang_base=${urlParams.get('lang_base')}`)
        if(rtl)
            text = text.replace(/>/g, "\u2067>").replace(/\u2067\u2067>/g, "\u2067>")
        console.log(text);
        window.text = text;
        story = text;
    }
    else {
        //let response = await fetch(name+".txt");
        let response = await fetch(`${backend_stories}get_story.php?id=${name}`);
        let data = await response.json();
        story_id = data[0]["id"];
        story = data[0]["text"];

        console.log("data", data[0]);
        if(data[0]["author"] == 1)
            document.getElementById("button_save").style.display = "none";

        await reloadAudioMap();
    }
    editor.setValue(story);
    dirty = false;
    isEditor = true;
    updateStoryDisplay();
}

loadStory(urlParams.get('story'), urlParams.get('import'))

export function updateStoryDisplay() {
    story = editor.getValue();
    let story_json = processStoryFile(story);
    window.story_json = story_json;
    loadAudios(story_json);
    console.log(story_json)
    ReactDOM.render( /*#__PURE__*/React.createElement(Story, {story_json: story_json, editor: true}), document.getElementById('story'));
    return story_json;
    index = 0;
    d3.select("#story").selectAll("*").remove();
    //addTitle();
    addAll();
    d3.selectAll(".hidden").classed("hidden", false);
    if(0) {
        while (index < story_json.elements.length) {
            //document.getElementById("button_next").dataset.status = "active";
            addNext();
        }
    }
}
window.updateStoryDisplay = updateStoryDisplay;
updateStoryDisplay();

async function saveStory() {
    let story_json = updateStoryDisplay();
    story_json = updateAudioLinks(story_json);

    document.getElementById("button_save").getElementsByTagName("img")[0].style.display = "inline-block";
    let data = {
        "name": story_json.elements[0].line.content.text,
        "name_base": story_json.fromLanguageName,
        "lang": language_data[story_json.learningLanguage].id,
        "lang_base": language_data[story_json.fromLanguage].id,
        "xp": story_json.story_properties["xp"],
        "image": story_json.story_properties["image"],
        "image_done": story_json.story_properties["image_done"],
        "image_locked": story_json.story_properties["image_locked"],
        "discussion": story_json.story_properties["discussion"],
        "duo_id": story_json.story_properties["duo_id"],
        "cefr": story_json.story_properties["cefr"],
        "set_id": story_json.story_properties["set_id"],
        "set_index": story_json.story_properties["set_index"],
        "text": editor.getValue(),
        "change_date": new Date().now(),
        "json": JSON.stringify(story_json),
    };
    if(story_id !== undefined)
        data.id = story_id;
    console.log("save", data);
    let x = await fetch_post(backend_stories+"set_story.php", data);
    if(x.status !== 200) {
        check_login();
        alert("Story could not be saved. Maybe you are not logged in?")
        document.getElementById("button_save").getElementsByTagName("img")[0].style.display = "none";
        return;
    }
    x = await x.json();
    x = x[0];
    console.log("saved", x);
    story_id = x.id;
    dirty = false;
    document.getElementById("button_save").getElementsByTagName("img")[0].style.display = "none";
}
window.saveStory = saveStory;

isEditor = true;
window.hideWarning = false;
window.addEventListener('beforeunload', (event) => {
    if (dirty) {
        if(!confirm("You have unsaved changed, do you really want to leave the editor?")) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

});

async function generateAudio() {
    if(confirm("Do you want to generate .mp3 files for the current story?")) {
        document.getElementById("button_audio").getElementsByTagName("img")[0].style.display = "inline-block";
        let story_json = updateStoryDisplay();
        let text = await generate_all_audio(story_json);
        if(text === "") {
            alert("An error occurred.");
        }
        document.getElementById("button_audio").getElementsByTagName("img")[0].style.display = "none";
    }
}
window.generateAudio = generateAudio;

function test() {
    if(story_id === undefined)
        alert("The story can only be tested if it has been saved for the first time.")
    else
        location.href = 'story.html?story='+story_id+'&lang='+urlParams.get('lang')+'&lang_base='+urlParams.get('lang_base')+"&test=1&editor=1";
}
window.test = test;
