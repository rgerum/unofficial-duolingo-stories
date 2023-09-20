import { query_objs } from "lib/db";
import LanguageList from "./language_list";

async function language_list() {
  return await query_objs(`SELECT * FROM language;`);
}

export default async function Page({}) {
  let languages = await language_list();

  return (
    <>
      <LanguageList users={languages} />
    </>
  );
}
