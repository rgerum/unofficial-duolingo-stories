import {backend_express, fetch_post} from "./include";


export async function get_login() {
    // get the current login status
    const response = await fetch(`${backend_express}/session`, {credentials: 'include'});  // {credentials: "same-origin"}
    try {
        // return the response
        let json = await response.json();
        if(json === null)
            return {error: true};
        return json;
    }
    catch (e) {
        return {error: true};
    }
}


export async function login(username, password, remember) {
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    let response = await fetch_post(`${backend_express}/login`, {username: username, password: password, remember: remember});
    return await response.json();
}


export async function logout() {
    // send the signal to logout
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    await fetch(`${backend_express}/logout`, {credentials: 'include'});
}

export async function register(data) {
    // register a new user
    let response;
    try {
        response = await fetch_post(`${backend_express}/register`, data)
    }
        // something wrong :-(
    catch (e) {
        return [false, "Something went wrong."];
    }
    // not allowed? perhaps the username is already taken
    if(response.status === 403) {
        let text = await response.text();
        return [false, text];
    }
    // again something wrong?
    else if(response.status !== 200) {
        return [false, "Something went wrong."];
    }
    // everything ok!
    return [true, ""];
}

export async function reset_pw(data) {
    // register a new user
    let response;
    try {
        response = await fetch_post(`${backend_express}/send`, data)
    }
        // something wrong :-(
    catch (e) {
        return [false, "Something went wrong."];
    }
    // not allowed? perhaps the username is already taken
    if(response.status === 403) {
        let text = await response.text();
        return [false, text];
    }
    // again something wrong?
    else if(response.status !== 200) {
        return [false, "Something went wrong."];
    }
    // everything ok!
    return [true, ""];
}
export async function reset_pw_check(data) {
    // register a new user
    let response;
    try {
        response = await fetch_post(`${backend_express}/check`, data)
    }
        // something wrong :-(
    catch (e) {
        return [false, "Something went wrong."];
    }
    // not allowed? perhaps the username is already taken
    if(response.status === 403) {
        let text = await response.text();
        return [false, text];
    }
    // again something wrong?
    else if(response.status !== 200) {
        return [false, "Something went wrong."];
    }
    // everything ok!
    return [true, ""];
}

export async function reset_pw_set(data) {
    // register a new user
    let response;

    try {
        response = await fetch_post(`${backend_express}/set`, data);
    } // something wrong :-(
    catch (e) {
        return false;
    } // not allowed? perhaps the username is already taken

    if (response.status === 403) {
        await response.text();
        return false;
    } // again something wrong?
    else if (response.status !== 200) {
        return false;
    } // everything ok!
    return true;
}


export async function activate(data) {
    let reponse = await fetch_post(`${backend_express}/activate`, data);
    return reponse.status === 200;
}