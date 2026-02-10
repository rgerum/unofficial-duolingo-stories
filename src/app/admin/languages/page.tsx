import { sql } from "@/lib/db";
import LanguageList, { Language } from "./language_list";

async function language_list(): Promise<Language[]> {
  return (await sql`SELECT * FROM language ORDER BY id;`) as unknown as Language[];
}

export default async function Page({}) {
  let languages = await language_list();

  return (
    <>
      <LanguageList all_languages={languages} />
    </>
  );
}
