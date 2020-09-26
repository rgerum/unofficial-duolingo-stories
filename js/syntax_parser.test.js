const processStoryFile = require('./syntax_parser');

language_data = undefined;
isEditor = false;
audio_map = undefined;
test('empty', () => {
    let story_json = processStoryFile(`
    `);
    expect(story_json.elements.length).toBe(1);
});

test('title', () => {
    let story_json = processStoryFile(`
title=Das~Examen
title_translation=the~exam
    `);
    let line = story_json.elements[0].line;
    expect(line.type).toBe("TITLE");
    expect(line.content).toStrictEqual({
        text: 'Das Examen',
        hints: [ 'the exam' ],
        hintMap: [ { hintIndex: 0, rangeFrom: 0, rangeTo: 9 } ],
        audio: {}
    });
});


test('single line', () => {
    let story_json = processStoryFile(`
> Speaker: I test this script.
    `);
    let line = story_json.elements[1].line;
    expect(line.type).toBe("CHARACTER");
    expect(line.characterId).toBe("Speaker");
    expect(line.content).toStrictEqual({
        "audio": {},
        "hintMap": [],
        "hints": [],
        "text": "I test this script."
    });

    story_json = processStoryFile(`
> I test this script.
    `);
    line = story_json.elements[1].line;
    expect(line.type).toBe("PROSE");
    expect(line.content).toStrictEqual({
        "audio": {},
        "hintMap": [],
        "hints": [],
        "text": "I test this script."
    });

    story_json = processStoryFile(`
> I test: this script.
    `);
    line = story_json.elements[1].line;
    expect(line.type).toBe("PROSE");
    expect(line.content).toStrictEqual({
        "audio": {},
        "hintMap": [],
        "hints": [],
        "text": "I test: this script."
    });
});

test('line translation', () => {
    let story_json = processStoryFile(`
> Speaker: I~test this|script.
~ Speaker: Itest th~is script. 
    `);
    let line = story_json.elements[1].line;
    expect(line.type).toBe("CHARACTER");
    expect(line.characterId).toBe("Speaker");
    expect(line.content).toStrictEqual({
        "audio": {},
        "hintMap": [
            {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 5},
            {"hintIndex": 1, "rangeFrom": 7, "rangeTo": 10},
            {"hintIndex": 2, "rangeFrom": 12, "rangeTo": 17}
        ],
        "hints": ["Itest", "th is", "script"],
        "text": "I test this​script."
    });

    story_json = processStoryFile(`
> Speaker: I~test this|script.
~ Itest th~is script. 
    `);
    line = story_json.elements[1].line;
    expect(line.type).toBe("CHARACTER");
    expect(line.characterId).toBe("Speaker");
    expect(line.content).toStrictEqual({
        "audio": {},
        "hintMap": [
            {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 5},
            {"hintIndex": 1, "rangeFrom": 7, "rangeTo": 10},
            {"hintIndex": 2, "rangeFrom": 12, "rangeTo": 17}
        ],
        "hints": ["Itest", "th is", "script"],
        "text": "I test this​script."
    });

    story_json = processStoryFile(`
> I test this script.
~
    `);
    line = story_json.elements[1].line;
    expect(line.type).toBe("PROSE");
    expect(line.content).toStrictEqual({
        "audio": {},
        "hintMap": [],
        "hints": [],
        "text": "I test this script."
    });

    story_json = processStoryFile(`
~
    `);
    line = story_json.elements[1];
    expect(line.type).toBe("ERROR");

});


test('question choice', () => {
    let story_json = processStoryFile(`
[choice] Lonneke thinks that she maybe won’t rent the room again later.
+ Yes, that’s true.
- No, that’s not true.
    `);
    let element = story_json.elements[1];
    expect(element).toStrictEqual({
        type: 'MULTIPLE_CHOICE',
        question: {
            text: 'Lonneke thinks that she maybe won’t rent the room again later.',
            hints: [],
            hintMap: []
        },
        answers: [
            { text: 'Yes, that’s true.', hints: [], hintMap: [] },
            { text: 'No, that’s not true.', hints: [], hintMap: [] }
        ],
        correctAnswerIndex: 0,
        trackingProperties: { line_index: 1, challenge_type: 'multiple-choice' }
    });
});

test('fill', () => {
    let story_json = processStoryFile(`
[fill] Lonneke: Ja, *.
~ ~: Ja. *.
Choose the best answer:
- sinds twee maand
~ since two months
- vanaf een maand
~ for a month
+ sinds een maand
~ since one month
    `);
    let element = story_json.elements[1];
    expect(element).toStrictEqual({
        "prompt": {
            "hintMap": [],
            "hints": [],
            "text": "Choose the best answer:"
        },
        "trackingProperties": {
            "challenge_type": "select-phrases",
            "line_index": 1
        },
        "type": "CHALLENGE_PROMPT"
    });
    element = story_json.elements[2];
    expect(element).toStrictEqual({
        "hideRangesForChallenge": {
            "end": 19,
            "start": 4
        },
        "line": {
            "characterId": "Lonneke",
            "content": {
                "audio": {},
                "hintMap": [
                    {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 1},
                    {"hintIndex": 1, "rangeFrom": 4, "rangeTo": 8},
                    {"hintIndex": 2, "rangeFrom": 10, "rangeTo": 12},
                    {"hintIndex": 3, "rangeFrom": 14, "rangeTo": 18}
                ],
                "hints": ["Ja", "since", "one", "month"],
                "text": "Ja, sinds een maand."
            },
            "type": "CHARACTER"
        },
        "trackingProperties": {
            "line_index": 1
        },
        "type": "LINE"
    });
});

test('next', () => {
    let story_json = processStoryFile(`
[next] Ze drinkt *.
~ ~She drinks her coffee.
What comes next?
- haar melk
+ haar koffie
- haar boek
    `);
    let element = story_json.elements[1];
    expect(element).toStrictEqual({
        "prompt": {
            "hintMap": [],
            "hints": [],
            "text": "What comes next?"
        },
        "trackingProperties": {
            "challenge_type": "continuation",
            "line_index": 1
        },
        "type": "CHALLENGE_PROMPT"
    });
    element = story_json.elements[2];
    expect(element).toStrictEqual({
        "hideRangesForChallenge": {
            "end": 21,
            "start": 10
        },
        "line": {
            "content": {
                "audio": {},
                "hintMap": [
                    {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 1},
                    {"hintIndex": 1, "rangeFrom": 3, "rangeTo": 8},
                    {"hintIndex": 2, "rangeFrom": 10, "rangeTo": 13},
                    {"hintIndex": 3, "rangeFrom": 15, "rangeTo": 20}
                ],
                "hints": [" She", "drinks", "her", "coffee"],
                "text": "Ze drinkt haar koffie."
            },
            "type": "PROSE"
        },
        "trackingProperties": {
            "line_index": 1
        },
        "type": "LINE"
    });
});

test('order', () => {
    return
    let story_json = processStoryFile(`
[order] Jan: *?
~            With or without milk?
Tap what you hear
Met/of/zonder/melk
    `);
    let element = story_json.elements[1];
    expect(element).toStrictEqual({
        "prompt": {
            "hintMap": [],
            "hints": [],
            "text": "What comes next?"
        },
        "trackingProperties": {
            "challenge_type": "continuation",
            "line_index": 1
        },
        "type": "CHALLENGE_PROMPT"
    });
    element = story_json.elements[2];
    expect(element).toStrictEqual({
        "hideRangesForChallenge": {
            "end": 21,
            "start": 10
        },
        "line": {
            "content": {
                "audio": {},
                "hintMap": [
                    {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 1},
                    {"hintIndex": 1, "rangeFrom": 3, "rangeTo": 8},
                    {"hintIndex": 2, "rangeFrom": 10, "rangeTo": 13},
                    {"hintIndex": 3, "rangeFrom": 15, "rangeTo": 20}
                ],
                "hints": [" She", "drinks", "her", "coffee"],
                "text": "Ze drinkt haar koffie."
            },
            "type": "PROSE"
        },
        "trackingProperties": {
            "line_index": 1
        },
        "type": "LINE"
    });
});

test('click', () => {
    let story_json = processStoryFile(`
[click] Click on the option meaning "tired".
> Marian: [Ik] ben [+moe] Jan. Ik [werk] [veel].
~ ~:      I am tired ~. I work a~lot.
    `);
    let element = story_json.elements[1];
    expect(element).toStrictEqual({
        "hideRangesForChallenge": [],
        "line": {
            "avatarUrl": undefined,
            "characterId": "Marian",
            "content": {
                "audio": {},
                "hintMap": [
                    {"hintIndex": 0, "rangeFrom": 3, "rangeTo": 5},
                    {"hintIndex": 1, "rangeFrom": 7, "rangeTo": 9},
                    {"hintIndex": 2, "rangeFrom": 11, "rangeTo": 13},
                    {"hintIndex": 3, "rangeFrom": 19, "rangeTo": 22},
                    {"hintIndex": 4, "rangeFrom": 24, "rangeTo": 27},
                    {"hintIndex": 5, "rangeFrom": 29, "rangeTo": 28}
                ],
                "hints": ["I", "am", "tired", "I", "work", "a lot"],
                "text": "Ik ben moe Jan. Ik werk veel."
            },
            "type": "CHARACTER"
        },
        "trackingProperties": {
            "line_index": 1
        },
        "type": "LINE"
    });
    element = story_json.elements[2];
    expect(element).toStrictEqual({
        "correctAnswerIndex": 1,
        "question": {
            "hintMap": [],
            "hints": [],
            "text": "Click on the option meaning \"tired\"."
        },
        "trackingProperties": {
            "challenge_type": "point-to-phrase",
            "line_index": 1
        },
        "transcriptParts": [
            {"selectable": true, "text": "Ik"},
            {"selectable": false, "text": " "},
            {"selectable": false, "text": "ben"},
            {"selectable": false, "text": " "},
            {"selectable": true, "text": "moe"},
            {"selectable": false, "text": " "},
            {"selectable": false, "text": "Jan"},
            {"selectable": false, "text": ". "},
            {"selectable": false, "text": "Ik"},
            {"selectable": false, "text": " "},
            {"selectable": true, "text": "werk"},
            {"selectable": false, "text": " "},
            {"selectable": true, "text": "veel"},
            {"selectable": false, "text": "."},
            {"selectable": false, "text": ""}
        ],
        "type": "POINT_TO_PHRASE"
    });
});