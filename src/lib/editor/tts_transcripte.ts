import jsyaml from "js-yaml";

let punctuation_chars =
  "\\/¡!\"'`#$%&*,.:;<=>¿?@^_`{|}…" + "。、，！？；：（）～—·《…》〈…〉﹏……——";
//punctuation_chars = "\\\\¡!\"#$%&*,、，.。\\/:：;<=>¿?@^_`{|}…"

let regex_split_token = new RegExp(
  `([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​)[\\s${punctuation_chars}]*)`,
);
let regex_split_token2 = new RegExp(
  `([\\s${punctuation_chars}~]*(?:^|\\s|$|​)[\\s${punctuation_chars}~]*)`,
);
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

export function splitTextTokens(
  text: string,
  keep_tilde: boolean = true,
): string[] {
  if (!text) return [];
  //console.log(text, text.split(/([\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*(?:^|\s|$)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/))
  if (keep_tilde)
    //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    return text.split(regex_split_token);
  //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…\]]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…]*)/)
  //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
  else return text.split(regex_split_token2);
  //return text.split(/([\s\\¡!"#$%&*,、，.。\/:：;<=>¿?@^_`{|}…~]*(?:^|\s|$|​)[\s\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}…~]*)/)
}

let data = `
mode:
    ipa: true
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
    tsx: cz:ipa
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
`;
data = `
# es-MX-GerardoNeural
# jan~[[lape~uta~sona~ike]] li lon tomo

# lines with # are ignored

# here you can add single letters that should be replaced    
LETTERS:
    ä: ä
# here you can add parts of words to be replaced. You can use valid regular expressions (regex) here
FRAGMENTS:
    (\\[[^\\]]*?)(kepeken)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(sitelen)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(kalama)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(kulupu)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(pakala)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(palisa)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(pimeja)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(sijelo)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(sinpin)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(soweli)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(akesi)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(alasa)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(kiwen)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(linja)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(lukin)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(monsi)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(nanpa)([^\\]]*?\\]): N
    (\\[[^\\]]*?)(nasin)([^\\]]*?\\]): N
    (\\[[^\\]]*?)(pilin)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(tenpo)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(utala)([^\\]]*?\\]): U
    (\\[[^\\]]*?)(anpa)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(ante)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(awen)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(esun)([^\\]]*?\\]): E
    (\\[[^\\]]*?)(insa)([^\\]]*?\\]): I
    (\\[[^\\]]*?)(jaki)([^\\]]*?\\]): J
    (\\[[^\\]]*?)(jelo)([^\\]]*?\\]): J
    (\\[[^\\]]*?)(kala)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(kama)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(kasi)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(kili)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(kule)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(kute)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(lape)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(laso)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(lawa)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(lete)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(lili)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(lipu)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(loje)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(luka)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(lupa)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(mama)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(mani)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(meli)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(mije)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(moku)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(moli)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(musi)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(mute)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(nasa)([^\\]]*?\\]): N
    (\\[[^\\]]*?)(nena)([^\\]]*?\\]): N
    (\\[[^\\]]*?)(nimi)([^\\]]*?\\]): N
    (\\[[^\\]]*?)(noka)([^\\]]*?\\]): N
    (\\[[^\\]]*?)(olin)([^\\]]*?\\]): O
    (\\[[^\\]]*?)(open)([^\\]]*?\\]): O
    (\\[[^\\]]*?)(pali)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(pana)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(pini)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(pipi)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(poka)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(poki)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(pona)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(sama)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(seli)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(selo)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(seme)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(sewi)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(sike)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(sina)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(sona)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(suli)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(suno)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(supa)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(suwi)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(taso)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(tawa)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(telo)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(toki)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(tomo)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(unpa)([^\\]]*?\\]): U
    (\\[[^\\]]*?)(walo)([^\\]]*?\\]): W
    (\\[[^\\]]*?)(waso)([^\\]]*?\\]): W
    (\\[[^\\]]*?)(wawa)([^\\]]*?\\]): W
    (\\[[^\\]]*?)(weka)([^\\]]*?\\]): W
    (\\[[^\\]]*?)(wile)([^\\]]*?\\]): W
    (\\[[^\\]]*?)(ala)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(ale)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(anu)([^\\]]*?\\]): A
    (\\[[^\\]]*?)(ijo)([^\\]]*?\\]): I
    (\\[[^\\]]*?)(ike)([^\\]]*?\\]): I
    (\\[[^\\]]*?)(ilo)([^\\]]*?\\]): I
    (\\[[^\\]]*?)(jan)([^\\]]*?\\]): J
    (\\[[^\\]]*?)(ken)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(kon)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(len)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(lon)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(mun)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(ona)([^\\]]*?\\]): O
    (\\[[^\\]]*?)(pan)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(sin)([^\\]]*?\\]): S
    (\\[[^\\]]*?)(tan)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(uta)([^\\]]*?\\]): U
    (\\[[^\\]]*?)(wan)([^\\]]*?\\]): W
    (\\[[^\\]]*?)(en)([^\\]]*?\\]): E
    (\\[[^\\]]*?)(jo)([^\\]]*?\\]): J
    (\\[[^\\]]*?)(ko)([^\\]]*?\\]): K
    (\\[[^\\]]*?)(la)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(li)([^\\]]*?\\]): L
    (\\[[^\\]]*?)(ma)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(mi)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(mu)([^\\]]*?\\]): M
    (\\[[^\\]]*?)(ni)([^\\]]*?\\]): N
    (\\[[^\\]]*?)(pi)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(pu)([^\\]]*?\\]): P
    (\\[[^\\]]*?)(tu)([^\\]]*?\\]): T
    (\\[[^\\]]*?)(~| )([^\\]]*?\\]): ""
    \\\\n:  " "
    \\~: " "
    \\[: " "
    \\]: " "
    z+: " "
    \\(: " "
    \\): " "
    \\+: " "
# whole words that should be replaced
WORDS:
    a: a{a:ipa}
    akesi: akesi{akesi:ipa}
    ala: ala{ala:ipa}
    alasa: alasa{alasa:ipa}
    ale: ale{ale:ipa}
    ali: ali{ali:ipa}
    anpa: anpa{anpa:ipa}
    ante: ante{ante:ipa}
    anu: anu{anu:ipa}
    awen: awen{awen:ipa}
    e: e{e:ipa}
    en: en{en:ipa}
    epiku: epiku{epiku:ipa}
    esun: esun{esun:ipa}
    ijo: ijo{ijo:ipa}
    ike: ike{ike:ipa}
    ilo: ilo{ilo:ipa}
    insa: insa{insa:ipa}
    jaki: jaki{jaki:ipa}
    jan: jan{jan:ipa}
    jasima: jasima{jasima:ipa}
    jelo: jelo{jelo:ipa}
    jo: jo{jo:ipa}
    kala: kala{kala:ipa}
    kalama: kalama{kalama:ipa}
    kama: kama{kama:ipa}
    kasi: kasi{kasi:ipa}
    ken: ken{ken:ipa}
    kepeken: kepeken{kepeken:ipa}
    kijetesantakalu: kijetesantakalu{kijetesantakalu:ipa}
    kili: kili{kili:ipa}
    kin: kin{kin:ipa}
    kipisi: kipisi{kipisi:ipa}
    kiwen: kiwen{kiwen:ipa}
    ko: ko{ko:ipa}
    kokosila: kokosila{kokosila:ipa}
    kon: kon{kon:ipa}
    kule: kule{kule:ipa}
    kulupu: kulupu{kulupu:ipa}
    kute: kute{kute:ipa}
    la: la{la:ipa}
    lanpan: lanpan{lanpan:ipa}
    lape: lape{lape:ipa}
    laso: laso{laso:ipa}
    lawa: lawa{lawa:ipa}
    leko: leko{leko:ipa}
    len: len{len:ipa}
    lete: lete{lete:ipa}
    li: li{li:ipa}
    lili: lili{lili:ipa}
    linja: linja{linja:ipa}
    lipu: lipu{lipu:ipa}
    loje: loje{loje:ipa}
    lon: lon{lon:ipa}
    luka: luka{luka:ipa}
    lukin: lukin{lukin:ipa}
    lupa: lupa{lupa:ipa}
    ma: ma{ma:ipa}
    mama: mama{mama:ipa}
    mani: mani{mani:ipa}
    meli: meli{meli:ipa}
    meso: meso{meso:ipa}
    mi: mi{mi:ipa}
    mije: mije{mije:ipa}
    misikeke: misikeke{misikeke:ipa}
    moku: moku{moku:ipa}
    moli: moli{moli:ipa}
    monsi: monsi{monsi:ipa}
    monsuta: monsuta{monsuta:ipa}
    mu: mu{mu:ipa}
    mun: mun{mun:ipa}
    musi: musi{musi:ipa}
    mute: mute{mute:ipa}
    namako: namako{namako:ipa}
    nanpa: nanpa{nanpa:ipa}
    nasa: nasa{nasa:ipa}
    nasin: nasin{nasin:ipa}
    nena: nena{nena:ipa}
    ni: ni{ni:ipa}
    nimi: nimi{nimi:ipa}
    noka: noka{noka:ipa}
    o: o{o:ipa}
    oko: oko{oko:ipa}
    olin: olin{olin:ipa}
    ona: ona{ona:ipa}
    open: open{open:ipa}
    pakala: pakala{pakala:ipa}
    pali: pali{pali:ipa}
    palisa: palisa{palisa:ipa}
    pan: pan{pan:ipa}
    pana: pana{pana:ipa}
    pi: pi{pi:ipa}
    pilin: pilin{pilin:ipa}
    pimeja: pimeja{pimeja:ipa}
    pini: pini{pini:ipa}
    pipi: pipi{pipi:ipa}
    poka: poka{poka:ipa}
    poki: poki{poki:ipa}
    pona: pona{pona:ipa}
    pu: pu{pu:ipa}
    sama: sama{sama:ipa}
    seli: seli{seli:ipa}
    selo: selo{selo:ipa}
    seme: seme{seme:ipa}
    sewi: sewi{sewi:ipa}
    sijelo: sijelo{sijelo:ipa}
    sike: sike{sike:ipa}
    sin: sin{sin:ipa}
    sina: sina{sina:ipa}
    sinpin: sinpin{sinpin:ipa}
    sitelen: sitelen{sitelen:ipa}
    soko: soko{soko:ipa}
    sona: sona{sona:ipa}
    soweli: soweli{soweli:ipa}
    suli: suli{suli:ipa}
    suno: suno{suno:ipa}
    supa: supa{supa:ipa}
    suwi: suwi{suwi:ipa}
    tan: tan{tan:ipa}
    taso: taso{taso:ipa}
    tawa: tawa{tawa:ipa}
    telo: telo{telo:ipa}
    tenpo: tenpo{tenpo:ipa}
    toki: toki{toki:ipa}
    tomo: tomo{tomo:ipa}
    tonsi: tonsi{tonsi:ipa}
    tu: tu{tu:ipa}
    unpa: unpa{unpa:ipa}
    uta: uta{uta:ipa}
    utala: utala{utala:ipa}
    walo: walo{walo:ipa}
    wan: wan{wan:ipa}
    waso: waso{waso:ipa}
    wawa: wawa{wawa:ipa}
    weka: weka{weka:ipa}
    wile: wile{wile:ipa}
    n: n{n:ipa}
    ku: ku{ku:ipa}
`;
let text = "Ich better testetsx amion und einen hut";
interface TranscribeConfig {
  [section: string]: {
    [key: string]: string;
  };
}

export function transcribe_text(
  text: string,
  dataYaml: string,
): [string, number[]] {
  const config = jsyaml.load(dataYaml) as TranscribeConfig;

  const mapping: number[] = [];
  for (const section in config) {
    if (section.toUpperCase() === "MODE") {
      // Mode section handling - ipa flag not used currently
    }
    if (section.toUpperCase() === "LETTERS") {
      let text2 = "";
      const sectionData = config[section];
      for (let i = 0; i < text.length; i++) {
        if (sectionData[text[i]]) {
          text2 += sectionData[text[i]];
          for (let j = 0; j < sectionData[text[i]].length; j++) mapping.push(i);
        } else {
          text2 += text[i];
          mapping.push(i);
        }
      }
      text = text2;
    }
    if (section.toUpperCase() === "FRAGMENTS") {
      const sectionData = config[section];
      for (const frag in sectionData) {
        let match: (RegExpMatchArray & { index?: number }) | null = text.match(
          new RegExp(frag, "i"),
        );
        let counter = 0;
        while (match && match.index !== undefined && counter < 100) {
          let matchIndex = match.index;
          if (match.length >= 3) {
            matchIndex = match.index + match[1].length;
            match = [match[2]] as RegExpMatchArray;
            (match as RegExpMatchArray & { index: number }).index = matchIndex;
          }
          text =
            text.substring(0, matchIndex) +
            sectionData[frag] +
            text.substring(matchIndex + match[0].length);
          const new_indices: number[] = [];
          for (let j = 0; j < sectionData[frag].length; j++) {
            if (j < match[0].length) new_indices.push(matchIndex + j);
            else new_indices.push(matchIndex + match[0].length - 1);
          }
          mapping.splice(matchIndex, match[0].length, ...new_indices);
          match = text.match(new RegExp(frag, "i"));
          counter += 1;
        }
      }
    }
    if (section.toUpperCase() === "WORDS") {
      let text2 = "";
      const sectionData = config[section];
      for (const word of splitTextTokens(text)) {
        if (sectionData[word]) {
          const new_indices: number[] = [];
          for (let j = 0; j < sectionData[word].length; j++) {
            if (j < word.length) new_indices.push(text2.length + j);
            else new_indices.push(text2.length + word.length - 1);
          }
          mapping.splice(text2.length, word.length, ...new_indices);

          text2 += sectionData[word];
        } else text2 += word;
      }
      text = text2;
    }
  }
  let match = text.match(/(\w*)\{(\w*):ipa\}/);
  let counter = 0;
  while (match && counter < 10) {
    //console.log(match);
    text = text.replace(
      match[0],
      `<phoneme alphabet="ipa" ph="${match[1]}">${match[2]}</phoneme>`,
    );
    match = text.match(/(\w*)\{(\w*):ipa\}/);
    counter += 1;
  }
  //console.log(match);
  //if(ipa)
  return [text, mapping];
}
//console.log(transcribe_text("jan~[[lape~uta~sona~ike]] li lon tomo", data))
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
/*
let words = "a akesi ala alasa ale anpa ante anu awen e en esun ijo ike ilo insa jaki jan jelo jo kala kalama kama kasi ken kepeken kili kiwen ko kon kule kulupu kute la lape laso lawa len lete li lili linja lipu loje lon luka lukin lupa ma mama mani meli mi mije moku moli monsi mu mun musi mute nanpa nasa nasin nena ni nimi noka o olin ona open pakala pali palisa pan pana pi pilin pimeja pini pipi poka poki pona pu sama seli selo seme sewi sijelo sike sin sina sinpin sitelen sona soweli suli suno supa suwi tan taso tawa telo tenpo toki tomo tu unpa uta utala walo wan waso wawa weka wile"
for(let word of words.split(" ").sort((a, b) => b.length - a.length)) {
    //console.log(word)
    if(word.length > 1)
        //console.log(`    (\\[[^\\]]*?)(${word})([^\\]]*?\\]): ${word.substring(0, 1).toUpperCase()}`)
}
*/
