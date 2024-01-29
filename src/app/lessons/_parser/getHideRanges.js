export default function setHideRanges(content) {
  let pos_br = content.text.indexOf("\\n");
  while (pos_br !== -1) {
    hintsShift(content, pos_br);
    content.text =
      content.text.substring(0, pos_br) +
      "\n" +
      content.text.substring(pos_br + 1);
    pos_br = content.text.indexOf("\\n");
  }
  //content.text = content.text.replace(/\\n/g, "\n");
  const hideRanges = [];

  let last_pos = 0;
  while (true) {
    // find brackets that are not doubled
    let pos1 = regexIndexOf(
      content.text.substring(last_pos),
      /(?<!\[)\[(?!\[)/,
    );
    let pos2 = regexIndexOf(
      content.text.substring(last_pos),
      /(?<!\])\](?!\])/,
    );

    if (pos1 !== -1 && pos2 !== -1) {
      pos1 += last_pos;
      pos2 += last_pos;
      last_pos = pos2 + 1;
      hintsShift(content, pos1);
      hintsShift(content, pos2 - 1);
      //[pos1, pos2] = removeDoubleBrackets(content, [pos1, pos2]);
      hideRanges.push({ start: pos1, end: pos2 - 1 });
    } else break;
  }
  content.hideRanges = hideRanges;

  ///removeDoubleBrackets(content, []);
  return [];
}

function hintsShift(content, pos) {
  if (content.hintMap) {
    for (let i in content.hintMap) {
      if (content.hintMap[i].rangeFrom > pos) content.hintMap[i].rangeFrom -= 1;
      if (content.hintMap[i].rangeTo >= pos) content.hintMap[i].rangeTo -= 1;
    }
  }
  content.text =
    content.text.substring(0, pos) + content.text.substring(pos + 1);
}

function regexIndexOf(string, regex, startpos) {
  var indexOf = string.substring(startpos || 0).search(regex);
  return indexOf >= 0 ? indexOf + (startpos || 0) : indexOf;
}
function removeDoubleBrackets(content, pos) {
  for (let char of [/(?<!\[)\[(?!\[)/, /(?<!\])\](?!\])/, /\[\[/, /\]\]/]) {
    let pos1 = regexIndexOf(content.text, char);
    while (pos1 !== -1) {
      for (let i = 0; i < pos.length; i++) if (pos[i] > pos1) pos[i] -= 1;
      hintsShift(content, pos1);
      pos1 = regexIndexOf(content.text, char);
    }
  }
  return pos;
}
