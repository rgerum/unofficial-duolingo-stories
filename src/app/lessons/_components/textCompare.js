const { diffChars, diffWords, Diff } = require("diff");

let original = "Mi nombre es go Richard.";
let input = "!mi numbré es ĝo Richard";

var extendedWordChars =
  /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
function tokenize(value) {
  // All whitespace symbols except newline group into one token, each newline - in separate token
  var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

  for (var i = 0; i < tokens.length - 1; i++) {
    // If we have an empty string in the next field and we have only word chars before and after, merge
    if (
      !tokens[i + 1] &&
      tokens[i + 2] &&
      extendedWordChars.test(tokens[i]) &&
      extendedWordChars.test(tokens[i + 2])
    ) {
      tokens[i] += tokens[i + 2];
      tokens.splice(i + 1, 2);
      i--;
    }
  }

  //tokens = tokens.filter((token) => token.length > 0);
  return tokens;
}

const myDiff = new Diff();
myDiff.tokenize = (value) => {
  return value.split(/([\s.!?"-]+)/);
};
myDiff.equals = (left, right) => {
  return left.toLowerCase() === right.toLowerCase();
};

//function textCompare(original, input) {
export default function textCompare(original, input) {
  const parts = diffWords(input.trim(), original.trim(), {
    ignoreCase: true,
  });
  const parts2 = [];
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    if (part.value === "") {
      continue;
    }
    if (part.added || part.removed) {
      const tokens = tokenize(part.value);
      for (let j = 0; j < tokens.length; j++) {
        if (tokens[j] === "") {
          continue;
        }
        parts2.push({
          value: tokens[j],
          added: part.added,
          removed: part.removed,
        });
      }
    } else {
      parts2.push(part);
    }
  }

  let all = "";
  let correted1 = [];
  let correted2 = [];
  let count = 0;

  for (let i = 0; i < parts2.length; i++) {
    let part = parts2[i];
    let next = parts2[i + 1];

    if (part.removed && next && next.added) {
      let all_part = "";
      let change_count = 0;
      let cor1 = [];
      let cor2 = [];
      diffChars(part.value, next.value, { ignoreCase: true }).forEach(
        (part) => {
          if (part.removed) {
            cor1.push({ text: part.value, added: true });
            all_part += "[" + part.value + "]";
          }
          if (part.added) {
            cor2.push({ text: part.value, removed: true });
            all_part += "(" + part.value + ")";
          }
          if (!part.added && !part.removed) {
            cor1.push({ text: part.value, added: false, removed: false });
            cor2.push({ text: part.value, added: false, removed: false });
            all_part += part.value;
          }

          if (part.added) change_count += part.value.length;
        },
      );
      if (change_count <= 1) {
        correted1 = correted1.concat(cor1);
        correted2 = correted2.concat(cor2);
        all += all_part;
      } else {
        correted1.push({ text: part.value, added: true });
        correted2.push({ text: next.value, removed: true }); //correted2.push(part.value);
        all += "[" + part.value + "]";
        all += "(" + next.value + ")";
        count += 1;
      }
      i++;
      continue;
    }

    if (part.removed && part.value.match(/^\W*$/)) {
      //part.value = "";
      //part.removed = false;
    }
    if (part.added) {
      if (part.added && part.value.match(/^\W*$/)) {
        all += "[" + part.value + "]";
        correted2.push({ text: part.value });
      } else {
        all += "[" + part.value + "]";
        correted2.push({ text: part.value, removed: true });
      }
    }
    if (part.removed) {
      all += "(" + part.value + ")";
      correted1.push({ text: part.value, added: true }); //correted2.push(part.value);
    }
    if (!part.added && !part.removed) {
      all += part.value;
      if (part.value !== "") {
        correted1.push({ text: part.value });
        correted2.push({ text: part.value });
      }
    }
    //all += " "
  }
  return { text: all, error_count: count, correted2, correted1 };
}
//console.log(tokenize("Hello!"));
//console.log(textCompare(original, input));
//console.log(textCompare("Hello! Me not", "hallo! You not"));
