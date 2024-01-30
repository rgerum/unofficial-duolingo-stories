import fs from "fs/promises";
import convertToComposeObject from "../../_parser/convert_parts";
import Preview from "../../_components/preview";
import Part from "../../_components/exercise";

export default async function Page() {
  const input = await fs.readFile(
    "src/app/lessons/[lesson_id]/lesson_start.txt",
    "utf8",
  );
  const { results: elements, word_dict } = convertToComposeObject(input, true);

  const levels = [];
  for (let j = 0; j < 2; j++) {
    const level = [];
    for (let i = 0; i < elements.length; i++) {
      const elem = JSON.parse(JSON.stringify(elements[i]));
      if (elements[i].type === "compose") {
        if (j === 0) {
          elem.level = 1 + (i % 2);
        }
        if (j === 1) {
          elem.level = 2 + (i % 2);
        }

        level.push(elem);
      }
      if (elem.type === "fill_choice") {
        level.push(elem);
      }
    }
    levels.push(level);
  }

  return (
    <>
      <Preview elements={elements} />
      <hr />
      <div>Level 1</div>
      {levels[0].map((part, i) => (
        <Part key={i} data={part} active={10} />
      ))}
      <div>Level 2</div>
      {levels[1].map((part, i) => (
        <Part key={i} data={part} active={10} />
      ))}
    </>
  );
}
