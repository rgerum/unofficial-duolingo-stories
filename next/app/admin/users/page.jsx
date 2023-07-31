import query from  "lib/db";
import {UserList} from "./users";



async function query_obj(q, args) {
    let res = await query(q, args);
    return res.map(d => {return {...d}});
}

export async function user_list() {
    return await query_obj(`
SELECT
user.id,
user.username,
user.role,
user.email,
user.regdate,
user.activated,
user.admin,
COUNT(story.id) AS count
FROM user
LEFT JOIN story ON story.author = user.id
GROUP BY user.id;
`);
}

export default async function Page({}) {
    let users = await user_list();

    return <>
            <UserList users={users} />
    </>
}
