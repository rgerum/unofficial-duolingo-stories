import {query_objs} from  "lib/db";
import {UserList} from "./users";


async function user_list() {
    return await query_objs(`
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
