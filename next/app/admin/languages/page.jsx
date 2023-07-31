import query from  "lib/db";
import LanguageList from "./language_list";

async function query_obj(q, args) {
    let res = await query(q, args);
    return res.map(d => {return {...d}});
}

export async function language_list() {
    return await query_obj(`SELECT * FROM language;`);
}


export default async function Page({}) {
    let languages = await language_list();

    return <>
            <LanguageList users={languages} />
    </>
}
