import {language_list} from "pages/api/admin/set_language";
import LanguageList from "./language_list";

export default async function Page({}) {
    let languages = await language_list();

    return <>
            <LanguageList users={languages} />
    </>
}
