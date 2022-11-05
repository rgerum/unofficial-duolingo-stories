import React from 'react';
import {useSuspendedDataFetcher} from "./api_calls/include";
import {get_login, login, logout} from "./api_calls/user";


export function useUsername() {
    const [user, setUser] = React.useState(undefined);
    let courses_user = useSuspendedDataFetcher(get_login, []);

    if(user !== undefined)
        courses_user = user;

    async function login2(username, password, remember) {
        await login(username, password, remember);
        let user = await get_login();
        setUser(user);
        return user;
    }

    async function logout2() {
        await logout();
        let user = await get_login();
        setUser(user);
        return user;
    }

    return {
        username: courses_user?.username,
        admin: courses_user?.admin,
        role: courses_user?.role,
        response: courses_user,
        login: login2,
        logout: logout2,
    };
}