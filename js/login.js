let backend = 'https://carex.uber.space/stories/backend/';
let backend_user = backend+'user/';

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
    let response = await fetch(`${backend_user}get_login.php`)
    if(response.status === 403)
        return undefined;
    console.log(response);
    let text = response.json();
    return text;
}

async function login(data) {
    console.log(data, dict_to_query(data), `${backend_user}check_auth.php?${dict_to_query(data)}`)
    let reponse = await fetch(`${backend_user}check_auth.php?${dict_to_query(data)}`)
    if(reponse.status === 403)
        return false;
    console.log(reponse);
    return true;
}

async function register(data) {
    console.log(`${backend_user}register_send.php`);
    let response;
    try {
        response = await fetch_post(`${backend_user}register_send.php`, data)
    }
    catch (e) {
        return [false, "Something went wrong."];
    }
    if(response.status === 403) {
        let text = await response.text();
        return [false, text];
    }
    else if(response.status !== 200) {
        return [false, "Something went wrong."];
    }
    console.log(response);
    return [true, ""];
}


async function activate(data) {
    console.log(data, dict_to_query(data), `${backend_user}get_activation.php?${dict_to_query(data)}`)
    let reponse = await fetch(`${backend_user}get_activation.php?${dict_to_query(data)}`)
    if(reponse.status !== 200) {
        return false;
    }
    console.log(reponse);
    return true;
}

async function logout() {
    let reponse = await fetch(`${backend_user}set_logout.php`)
    get_login();
}