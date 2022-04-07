// ==UserScript==
// @name     DuolingoImport
// @version  1
// @include  https*duolingo*
// @grant    none
// ==/UserScript==

function fetch_post(url, data) {
    /** like fetch but with post instead of get */
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

console.log("grease monkey 2");
async function getStories(learningLanguage, fromLanguage) {
    console.log("grease monkey 2xxx");
    data = await fetch(`https://stories.duolingo.com/api2/stories?crowns=163&filterMature=false&fromLanguage=${fromLanguage}&illustrationFormat=svg&learningLanguage=${learningLanguage}&masterVersions=false&proposed=false&setSize=4&unlockingMechanism=crowns&_=1636940908268`);
    json = await data.json();
    console.log("json", json);

    data = await fetch_post(`http://127.0.0.1:5000/store?id=_stories`, {json: JSON.stringify(json, null, 2)});
    txt = await data.text();
    console.log("response", txt);

    for(set_index in json.sets) {
        let set = json.sets[set_index];
        if(set < 15)
            continue
        for(story_index in set) {
            let story = set[story_index];
            console.log(set_index, story_index, story.id);
            data = await fetch(`https://stories.duolingo.com/api2/stories/${story.id}?crowns=173&debugShowAllChallenges=false&illustrationFormat=svg&isDesktop=true&masterVersion=false&mode=read&supportedElements=ARRANGE,CHALLENGE_PROMPT,DUO_POPUP,FREEFORM_WRITING,FREEFORM_WRITING_EXAMPLE_RESPONSE,FREEFORM_WRITING_PROMPT,HEADER,HINT_ONBOARDING,LINE,MATCH,MULTIPLE_CHOICE,POINT_TO_PHRASE,SELECT_PHRASE,SUBHEADING,TYPE_TEXT&_=1640882394614`);
            let json2 = await data.json();
            console.log("json2", json2);

            data = await fetch_post(`http://127.0.0.1:5000/store?id=${story.id}`, {json: JSON.stringify(json2, null, 2)});
            txt = await data.text();
            console.log("response", txt);
            //break
        }
        //break
    }
    //console.log(json.sets[0][0].id);
}
getStories("es", "en");
getStories("fr", "en");
window.getStories = getStories
document.getStories = getStories
//https://stories.duolingo.com/api2/stories/es-en-buenos-dias?crowns=163&debugShowAllChallenges=false&illustrationFormat=svg&isDesktop=true&masterVersion=false&mode=read&supportedElements=ARRANGE,CHALLENGE_PROMPT,FREEFORM_WRITING,HEADER,HINT_ONBOARDING,LINE,MATCH,MULTIPLE_CHOICE,POINT_TO_PHRASE,SELECT_PHRASE,SUBHEADING,TYPE_TEXT&_=1636940601358