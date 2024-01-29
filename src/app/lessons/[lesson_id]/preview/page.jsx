import fs from "fs/promises";
import convertToComposeObject from "../../_parser/convert_parts";
import Preview from "../../_components/preview";

export default async function Page() {
  const input = await fs.readFile(
    "src/app/lessons/[lesson_id]/lesson_start.txt",
    "utf8",
  );
  const elements = convertToComposeObject(input);

  return (
    <>
      <Preview elements={elements} />
    </>
  );
}
