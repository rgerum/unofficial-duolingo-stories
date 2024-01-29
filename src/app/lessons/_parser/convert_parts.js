import setHideRanges from "./getHideRanges";

const convert_parts = {
  words: (line, index, current_result) => {
    if (current_result.words === undefined) {
      current_result.words = [];
    }
    current_result.words.push(line.substring(1).trim());
  },
  fill_choice: (line, index, current_result) => {
    if (current_result.sentence1 === undefined) {
      current_result.sentence1 = {
        text: "",
      };
      current_result.choice = {
        answers: [],
        right_answer: -1,
      };
    }
    if (line.startsWith(">")) {
      current_result.sentence1.text = line.substring(1).trim();
      setHideRanges(current_result.sentence1);
    }
    if (line.startsWith("-")) {
      current_result.choice.answers.push(line.substring(1).trim());
    }
    if (line.startsWith("+")) {
      current_result.choice.answers.push(line.substring(1).trim());
      current_result.choice.right_answer =
        current_result.choice.answers.length - 1;
    }
  },
  compose: (line, index, current_result) => {
    if (!current_result.sentence1) {
      current_result.sentence1 = {
        text: "",
        words: [],
        distractors: [],
      };
      current_result.sentence2 = {
        text: "",
        words: [],
        distractors: [],
      };
    }
    if (index === 1) {
      // Handle the first sentence
      current_result.sentence1.text = line.substring(1);
    } else if (index === 2) {
      // Handle the words and distractors
      const parts = line.substring(1).split(";");
      current_result.sentence1.words = parts[0].split(",").map((s) => s.trim());
      if (parts.length > 1) {
        current_result.sentence1.distractors = parts[1]
          .split(",")
          .map((s) => s.trim());
      }
    } else if (index === 3) {
      // Handle the second sentence
      current_result.sentence2.text = line.substring(1);
    } else if (index === 4) {
      // Handle the words and distractors
      const parts = line.substring(1).split(";");
      current_result.sentence2.words = parts[0].split(",").map((s) => s.trim());
      if (parts.length > 1) {
        current_result.sentence2.distractors = parts[1]
          .split(",")
          .map((s) => s.trim());
      }
    }
  },
  match: (line, index, current_result) => {
    if (current_result.pairs === undefined) {
      current_result.pairs = [];
    }
    const pos = line.indexOf("<>");
    if (pos !== -1) {
      current_result.pairs.push({
        left: line.substring(1, pos).trim(),
        right: line.substring(pos + 2).trim(),
      });
    }
  },
};

export default function convertToComposeObject(input) {
  // Splitting the input string into lines
  const lines = input.split("\n");

  // Creating the object with a type property
  const results = [];
  let current_result = {};
  let index = 0;

  // Processing each line
  lines.forEach((line) => {
    line = line.trim();
    if (line.length === 0) return;
    index = index + 1;
    if (line.startsWith("[") && line.endsWith("]")) {
      // Handle the type line (e.g., [compose])
      index = 0;
      current_result = { type: line.substring(1, line.length - 1) };
      results.push(current_result);
    } else if (convert_parts[current_result.type]) {
      convert_parts[current_result.type](line, index, current_result);
    }
  });

  const words = results.filter((r) => r.type === "words")[0].words;
  const word_dict = {};
  for (let word of words) {
    word_dict[word] = 0;
  }
  for (let part of results) {
    if (part.type === "compose") {
      for (let word of tokenize(part.sentence1.text)) {
        if (!extendedWordChars.test(word)) continue;
        if (
          word_dict[word] === undefined &&
          word_dict[word.toLowerCase()] !== undefined
        ) {
          word = word.toLowerCase();
        }
        word_dict[word] = word_dict[word] + 1;
      }
    }
  }

  return results;
}

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
