const processStoryFile = require('./syntax_parser');

language_data = undefined;
isEditor = false;
audio_map = undefined;
test('empty', () => {
    let story_json = processStoryFile(`
    `);
    expect(story_json.elements.length).toBe(0);
});

test('title', () => {
    let story_json = processStoryFile(`
title=Das~Examen
title_translation=the~exam
    `);
    expect(story_json.elements).toStrictEqual([
            {
                "hideRangesForChallenge": [],
                "line": {
                    "content": {
                        "audio": {},
                        "hintMap": [{"hintIndex": 0, "rangeFrom": 0, "rangeTo": 9}],
                        "hints": ["the exam"],
                        "text": "Das Examen"
                    },
                    "type": "TITLE"
                },
                "trackingProperties": {
                    "line_index": 0
                },
                "type": "LINE"
            }
    ]);
});


test('single line', () => {
    let story_json = processStoryFile(`
# this is a test for a single line   
> Speaker: I test this script.
    `);
    expect(story_json.elements).toStrictEqual([
        {
            "hideRangesForChallenge": [],
            "line": {
                "avatarUrl": undefined,
                "characterId": "Speaker",
                "content": {
                    "audio": {},
                    "hintMap": [],
                    "hints": [],
                    "text": "I test this script."
                },
                "type": "CHARACTER"
            },
            "trackingProperties": {
                "line_index": 1
            },
            "type": "LINE"
        }
    ]);

    story_json = processStoryFile(`
> I test this script.
    `);
    expect(story_json.elements.length).toBe(1);
    line = story_json.elements[0].line;
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
    expect(story_json.elements.length).toBe(1);
    line = story_json.elements[0].line;
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
> Speaker: I~test this|script{schkript}.
~ Speaker: Itest th~is script. 
    `);
    expect(story_json.elements.length).toBe(1);
    let line = story_json.elements[0].line;
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
# comment 
    `);
    expect(story_json.elements.length).toBe(1);
    line = story_json.elements[0].line;
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
    expect(story_json.elements.length).toBe(1);
    line = story_json.elements[0].line;
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
    expect(story_json.elements.length).toBe(1);
    line = story_json.elements[0];
    expect(line.type).toBe("ERROR");

});


test('question choice', () => {
    let story_json = processStoryFile(`
[choice] Lonneke thinks that she maybe won’t rent the room again later.
+ Yes, that’s true.
- No, that’s not true.
    `);
    expect(story_json.elements.length).toBe(1);
    let element = story_json.elements[0];
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
    expect(story_json.elements).toStrictEqual([
        {
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
        },
        {
            "hideRangesForChallenge": {
                "end": 19,
                "start": 4
            },
            "line": {
                "avatarUrl": undefined,
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
        },
        {
            "answers": [
                {
                    "hintMap": [
                        {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 4},
                        {"hintIndex": 1, "rangeFrom": 6, "rangeTo": 9},
                        {"hintIndex": 2, "rangeFrom": 11, "rangeTo": 15}
                    ],
                    "hints": ["since", "two", "months"],
                    "text": "sinds twee maand"
                },
                {
                    "hintMap": [
                        {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 4},
                        {"hintIndex": 1, "rangeFrom": 6, "rangeTo": 8},
                        {"hintIndex": 2, "rangeFrom": 10, "rangeTo": 14}
                    ],
                    "hints": ["for", "a", "month"],
                    "text": "vanaf een maand"
                },
                {
                    "hintMap": [
                        {"hintIndex": 0, "rangeFrom": 0, "rangeTo": 4},
                        {"hintIndex": 1, "rangeFrom": 6, "rangeTo": 8},
                        {"hintIndex": 2, "rangeFrom": 10, "rangeTo": 14}
                    ],
                    "hints": ["since", "one", "month"],
                    "text": "sinds een maand"
                }
            ],
            "correctAnswerIndex": 2,
            "trackingProperties": {
                "challenge_type": "select-phrases",
                "line_index": 1
            },
            "type": "SELECT_PHRASE"
        }
    ]);

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
    let element = story_json.elements[0];
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
    element = story_json.elements[1];
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
    let story_json = processStoryFile(`
[order] Jan: *?
~            With or without milk?
Tap what you hear
Met/of/zonder/melk
    `);
    expect(story_json.elements).toStrictEqual([
        {
            "prompt": {
                "hintMap": [],
                "hints": [],
                "text": "Tap what you hear"
            },
            "trackingProperties": {
                "challenge_type": "arrange",
                "line_index": 1
            },
            "type": "CHALLENGE_PROMPT"
        },
        {
            "hideRangesForChallenge": {
                "end": 18,
                "start": 0
            },
            "line": {
                "avatarUrl": undefined,
                "characterId": "Jan",
                "content": {
                    "audio": {},
                    "hintMap": [{"hintIndex": 0, "rangeFrom": 0, "rangeTo": 2}, {"hintIndex": 1, "rangeFrom": 4, "rangeTo": 5}, {"hintIndex": 2, "rangeFrom": 7, "rangeTo": 12}, {"hintIndex": 3, "rangeFrom": 14, "rangeTo": 17}],
                    "hints": ["With", "or", "without", "milk"],
                    "text": "Met of zonder melk?"
                },
                "type": "CHARACTER"
            },
            "trackingProperties": {
                "line_index": 1
            },
            "type": "LINE"
        },
        {
            "characterPositions": [3, 6, 13, 18], "phraseOrder": [1, 0, 2, 3], "selectablePhrases": ["of", "Met", "zonder", "melk"],
            "trackingProperties": {
                "challenge_type": "arrange",
                "line_index": 1
            },
            "type": "ARRANGE"
        }
    ]);
});

test('click', () => {
    let story_json = processStoryFile(`
[click] Click on the option meaning "tired".
> Marian: [Ik] ben [+moe] Jan. Ik [werk] [veel].
~ ~:      I am tired ~. I work a~lot.
    `);
    let element = story_json.elements[0];
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
    element = story_json.elements[1];
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


test('pair', () => {
    let story_json = processStoryFile(`
[pairs] Tap the pairs

with - met
at home - thuis
wife - vrouw
darling - schatje
salt - zout
    `);
    expect(story_json.elements).toStrictEqual([
        {
            "fallbackHints": [
                {"phrase": "with", "translation": "met"}, {"phrase": "at home", "translation": "thuis"}, {"phrase": "wife", "translation": "vrouw"}, {"phrase": "darling", "translation": "schatje"}, {"phrase": "salt", "translation": "zout"}
            ],
            "prompt": "Tap the pairs",
            "trackingProperties": {
                "challenge_type": "match",
                "line_index": 1
            },
            "type": "MATCH"
        }
    ]);
});