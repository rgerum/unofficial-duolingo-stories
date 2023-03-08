import query from "../../../../lib/db"


export default async function story(req, res) {
    const { story_id } = req.query

    let answer = await get_story(story_id);

    if(answer === undefined)
        return res.status(404).test("Error not found");

    return res.json(answer);
}

export async function get_story(story_id) {
    let res = await query(`SELECT l1.short AS fromLanguage, l2.short AS learningLanguage, 
              l1.name AS fromLanguageLong, l2.name AS learningLanguageLong, 
              l1.rtl AS fromLanguageRTL, l2.rtl AS learningLanguageRTL,
              story.id, story.json 
              FROM story 
              JOIN course c on story.course_id = c.id 
              LEFT JOIN language l1 ON l1.id = c.fromLanguage
              LEFT JOIN language l2 ON l2.id = c.learningLanguage 
              WHERE story.id = ?;`, story_id);
    if (res.length === 0) {
        //result.sendStatus(404);
        return
    }
    let data = JSON.parse(res[0]["json"]);
    data.id = res[0]["id"];

    data.fromLanguage = res[0]["fromLanguage"];
    data.fromLanguageLong = res[0]["fromLanguageLong"];
    data.fromLanguageRTL = res[0]["fromLanguageRTL"];

    data.learningLanguage = res[0]["learningLanguage"];
    data.learningLanguageLong = res[0]["learningLanguageLong"];
    data.learningLanguageRTL = res[0]["learningLanguageRTL"];

    return data;
}