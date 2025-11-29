import { sql } from "@/lib/db";
import LanguageList from "./language_list";

async function language_list() {
  return await sql`SELECT * FROM language ORDER BY id;`;
}

export default async function Page({}) {
  let languages = await language_list();

  return (
    <>
      <LanguageList all_languages={languages} />
    </>
  );
}
