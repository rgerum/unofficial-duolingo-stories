import "./includes.css"

window.setCookie = setCookie;
window.resetSession = () => setCookie("PHPSESSID");
export function setCookie(cname, cvalue, exdays) {
    cvalue = encodeURIComponent(cvalue);
    if(!exdays) {
        document.cookie = cname + "=" + cvalue + ";"
        return;
    }
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}


export function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return undefined;
}



export function isLocalNetwork(hostname) {
    try {
        if (hostname === undefined)
            hostname = window.location.hostname;
        return (
            (['localhost', '127.0.0.1', '', '::1'].includes(hostname))
            || (hostname.startsWith('192.168.'))
            || (hostname.startsWith('10.0.'))
            || (hostname.endsWith('.local'))
        )
    }
    catch (e) {
        return true;
    }
}

export async function fetch_post(url, data)
{
    // check if the user is logged in
    var req = new Request(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        mode: "cors",
        credentials: 'include',
    });
    return fetch(req);
}

export function inputs_to_dict(inputs) {
    /** Convert a list of input fields to a dictionary */
    let result = {}
    for(let name in inputs) {
        result[name] = document.querySelector(inputs[name]).value;
    }
    return result;
}

export function dict_to_query(data) {
    /** Convert a dictionary to an url query string  */
    let query = [];
    for(let name in data)
        query.push(`${encodeURIComponent(name)}=${encodeURIComponent(data[name])}`);
    return query.join("&")
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
let random_seed = 1234;
Math.set_seed = function (seed) {
    random_seed = seed;
}
Math.random_seeded = function() {
    random_seed = Math.sin(random_seed) * 10000;
    return random_seed - Math.floor(random_seed);
};

export function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random_seeded() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

try {
    module.exports = {
        "shuffle": shuffle,
    }
} catch (e) {}
