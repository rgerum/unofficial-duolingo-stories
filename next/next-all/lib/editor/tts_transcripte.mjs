import jsyaml from "js-yaml"

let punctuation_chars = "\\\/¡!\"\'\`#$%&*,.:;<=>¿?@^_`{|}…"+
    "。、，！？；：（）～—·《…》〈…〉﹏……——"
//punctuation_chars = "\\\\¡!\"#$%&*,、，.。\\/:：;<=>¿?@^_`{|}…"

let regex_split_token = new RegExp(`([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​)[\\s${punctuation_chars}]*)`);
let regex_split_token2 = new RegExp(`([\\s${punctuation_chars}~]*(?:^|\\s|$|​)[\\s${punctuation_chars}~]*)`);
/*
function splitTextTokens(text, keep_tilde=true) {
    if(!text)
        return [];
    //console.log(text, text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*(?:^|\s|$)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/))
    if(keep_tilde)
        return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    //return text.split(regex_split_token)
    else
        return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
    //return text.split(regex_split_token2)
}
*/

export function splitTextTokens(text, keep_tilde=true) {
    if(!text)
        return [];
    //console.log(text, text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*(?:^|\s|$)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/))
    if(keep_tilde)
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
        return text.split(regex_split_token)
    //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…\]]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/)
    else
        //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
        return text.split(regex_split_token2)
    //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…~]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…~]*)/)
}

let data = `
letters:
    a: a
    b: b
    c: ts
    ĉ: cz
    d: d
    e: e
    f: f
    g: g
    ĝ: dż
    h: h
    ĥ: ch
    i: ij
    j: y
    ĵ: rz
    k: k
    l: l
    m: m
    n: n
    o: o
    p: p
    r: r
    s: s
    ŝ: sz
    t: t
    u: u
    ŭ: ł
    v: w
    z: z
fragments:
    tsx: cz
    gx: dż
    hx: ch
    yx: rz
    sx: sz
    ux: ł
    atsij: atssij
    ide\\b: ijde
    io\\b: ijo
    ioy\\b: ijoj
    ioyn\\b: ijojn
    feyo\\b: fejo
    feyoy\\b: feyoj
    feyoyn\\b: feyoj
    ^ekzij: ekzji
    tssijl: tssil
    ijuy: iuyy
    ijeh: ije
    sijlo: ssilo
    ^sij: syy
    tsij: tssij
    sij: ssij
    sssij: ssij
    rijpozij: ryypozyj
    zijs: zyjs
words:
    ok: ohk
    s-ro: sjijnjoro
    s-ino: sjijnjorijno
    ktp: ko-to-po
    k.t.p: ko-to-po
    atm: antałtagmeze
    ptm: posttagmeze
    bv: bonvolu
`
let text = "Ich better teste amion und einen hut"
export function transcribe_text(text, data) {
    data = jsyaml.load(data)
    console.log(data)

    let mapping = []
    for (let section in data) {
        console.log(section)
        if (section.toUpperCase() === "LETTERS") {
            let text2 = "";
            for (let i = 0; i < text.length; i++) {
                if (data[section][text[i]]) {
                    text2 += data[section][text[i]];
                    for(let j = 0; j < data[section][text[i]].length; j++)
                        mapping.push(i);
                }
                else {
                    text2 += text[i];
                    mapping.push(i);
                }
            }
            text = text2;
        }
        if (section.toUpperCase() === "FRAGMENTS") {
            for (let frag in data[section]) {
                let match = text.match(new RegExp(frag, "i"))
                while(match) {
                    text = text.replace(match = text.match(new RegExp(frag, "i")), data[section][frag]);
                    let new_indices = [];
                    for(let j = 0; j < data[section][frag].length; j++) {
                        if(j < match[0].length)
                            new_indices.push(match.index + j)
                        else
                            new_indices.push(match.index + match[0].length - 1)
                    }
                    mapping.splice(match.index, match[0].length, ...new_indices);
                    match = text.match(new RegExp(frag, "i"));
                }
            }
        }
        if (section.toUpperCase() === "WORDS") {
            let text2 = "";
            for (let word of splitTextTokens(text)) {
                if (data[section][word]) {
                    let new_indices = [];
                    for(let j = 0; j < data[section][word].length; j++) {
                        if(j < word.length)
                            new_indices.push(text2.length + j)
                        else
                            new_indices.push(text2.length + word.length - 1)
                    }
                    mapping.splice(text2.length, word.length, ...new_indices);

                    text2 += data[section][word];
                }
                else
                    text2 += word
            }
            text = text2;
        }
    }
    return [text, mapping];
}
//console.log(transcribe_text(text, data))
/*
letters:
    a: a
    b: b
    c: ts
    ĉ: cz
    d: d
    e: e
    f: f
    g: g
    ĝ: dż
    h: h
    ĥ: ch
    i: ij
    j: y
    ĵ: rz
    k: k
    l: l
    m: m
    n: n
    o: o
    p: p
    r: r
    s: s
    ŝ: sz
    t: t
    u: u
    ŭ: ł
    v: w
    z: z
fragments:
    tsx: cz
    gx: dż
    hx: ch
    yx: rz
    sx: sz
    ux: ł
    atsij: atssij
    ide\b: ijde
    io\b: ijo
    ioy\b: ijoj
    ioyn\b: ijojn
    feyo\b: fejo
    feyoy\b: feyoj
    feyoyn\b: feyoj
    ^ekzij: ekzji
    tssijl: tssil
    ijuy: iuyy
    ijeh: ije
    sijlo: ssilo
    ^sij: syy
    tsij: tssij
    sij: ssij
    sssij: ssij
    rijpozij: ryypozyj
    zijs: zyjs
words:
    ok: ohk
    s-ro: sjijnjoro
    s-ino: sjijnjorijno
    ktp: ko-to-po
    k.t.p: ko-to-po
    atm: antałtagmeze
    ptm: posttagmeze
    bv: bonvolu
 */