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

});
