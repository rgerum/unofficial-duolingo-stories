import React from "react";
import useSWR from "swr";
import {login, logout} from "../components/login/api_calls/user";
import {useSession} from "next-auth/react";

export function useInput(def) {
    let [value, setValue] = React.useState(def);
    function set(e) {
        let v = e?.target ? e?.target?.value : e;
        if (v === null || v === undefined)
            v = "";
        setValue(v);
    }
    return [value, set];
} // Hook

async function fetch2(url) {
    let res = await fetch(url, {credentials: "include", mode: "cors",})
    return await res.json()
}

export function useUser () {
    const { data, error, mutate } = useSWR('https://test.duostories.org/stories/backend_node_test/session', fetch2)

    async function do_login(usernameInput, passwordInput, remember) {
        const userdata_new = await login(usernameInput, passwordInput, remember);
        await mutate(userdata_new)
        return userdata_new
    }
    async function do_logout() {
        await logout();
        await mutate(undefined)
    }

    return {
        userdata: data,
        login: do_login,
        isLoading: !error && !data,
        isError: error,
        logout: do_logout,
    }
}

export function useUserCourses() {
    const { data: session } = useSession();

    const { data } = useSWR(() => session.user.name ? 'api/course/user' : null, fetch2)
    return data
}

export function useUserStoriesDone() {
    const { data: session } = useSession();

    const { data } = useSWR(() => session.user.name ? 'api/course/user_done' : null, fetch2)
    return {user_stories_done: data}
}