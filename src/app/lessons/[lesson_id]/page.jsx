import convertToComposeObject from "../_parser/convert_parts";
import textCompare from "../_components/textCompare";
import { CardCorrect, CardFalse } from "../_components/parts/card";
import TextCorrected from "../_components/parts/text_corrected";
import fs from "fs/promises";
import LessonParent from "./lesson_parent";

export default async function Page() {
  const input = await fs.readFile(
    "src/app/lessons/[lesson_id]/lesson_start2.txt",
    "utf8",
  );
  let elements = convertToComposeObject(input);

  if (0) {
    let aa = [
      textCompare("My name is Carlo.", "my text is Carlos"),
      textCompare("Hello!", "hallo this"),
      textCompare("Hello!", "hallo"),
      textCompare("Hello my a name!", "Hello name and not"),
    ];

    return (
      <>
        {aa.map((a) => (
          <>
            <CardFalse>
              <TextCorrected parts={a.correted1} />{" "}
            </CardFalse>
            <CardCorrect>
              <TextCorrected parts={a.correted2} />{" "}
            </CardCorrect>
          </>
        ))}
      </>
    );
  }

  return <LessonParent elements={elements} />;
}
