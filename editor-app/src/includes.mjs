//import fetch from "node-fetch";
//import {FormData} from "formdata-node"

export function now() {
    var day = ((this.getDate() < 10)?"0":"") + this.getDate();
    var month = (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1);
    var year = this.getFullYear();
    var hours = ((this.getHours() < 10)?"0":"") + this.getHours();
    var minutes = ((this.getMinutes() < 10)?"0":"") + this.getMinutes();
    var seconds = ((this.getSeconds() < 10)?"0":"") + this.getSeconds();

    return year+"-"+month+"-"+day+" "+hours+":"+minutes+":"+seconds;
}

export async function fetch_post(url, data) {
    /** like fetch but with post instead of get */
    var fd = new FormData();
    //very simply, doesn't handle complete objects
    for(var i in data){
        fd.append(i,data[i]);
    }
    var res = fetch(url, {
        method:"POST",
        body:fd,
        mode:"cors"
    })
    return res
    var req = new Request(url,{
        method:"POST",
        body:fd,
        mode:"cors"
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
