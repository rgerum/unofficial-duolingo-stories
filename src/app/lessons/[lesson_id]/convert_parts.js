const convert_parts = {
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

export function convertToComposeObject(input) {
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

  return results;
}
