let backend = 'https://carex.uber.space/stories/backend/user/';

function inputs_to_dict(inputs) {
    let result = {}
    for(let name in inputs) {
        result[name] = document.querySelector(inputs[name]).value;
    }
    return result;
}
function dict_to_query(data) {
    let query = [];
    for(let name in data)
        query.push(`${encodeURIComponent(name)}=${encodeURIComponent(data[name])}`);
    return query.join("&")
}
function fetch_post(url, data) {
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(var i in data){
        fd.append(i,data[i]);
    }
    var req = new Request(url,{
        method:"POST",
        body:fd,
        mode:"cors"
    });
    return fetch(req);
}

async function get_login() {
    let response = await fetch(`${backend}get_login.php`)
    if(response.status === 403)
        return undefined;
    console.log(response);
    let text = response.json();
    return text;
}

async function login(data) {
    console.log(data, dict_to_query(data), `${backend}check_auth.php?${dict_to_query(data)}`)
    let reponse = await fetch(`${backend}check_auth.php?${dict_to_query(data)}`)
    if(reponse.status === 403)
        return false;
    console.log(reponse);
    return true;
}

async function register(data) {
    console.log(`${backend}register_send.php`);
    let response = await fetch_post(`${backend}register_send.php`, data)
    if(response.status === 403) {
        let text = await response.text();
        return [false, text];
    }
    else if(response.status !== 200) {
        return [false, "Error: an unknown error did occur."];
    }
    console.log(response);
    return [true, ""];
}


async function activate(data) {
    console.log(data, dict_to_query(data), `${backend}get_activation.php?${dict_to_query(data)}`)
    let reponse = await fetch(`${backend}get_activation.php?${dict_to_query(data)}`)
    if(reponse.status !== 200) {
        return false;
    }
    console.log(reponse);
    return true;
}

async function logout() {
    let reponse = await fetch(`${backend}set_logout.php`)
    get_login();
}