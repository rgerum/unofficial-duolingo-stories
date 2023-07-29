import {user_list} from "pages/api/admin/set_user_activate";
import {UserList} from "./users";


export default async function Page({}) {
    let users = await user_list();

    return <>
            <UserList users={users} />
    </>
}
