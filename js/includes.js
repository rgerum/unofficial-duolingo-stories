Date.prototype.now = function () {
    var day = ((this.getDate() < 10)?"0":"") + this.getDate();
    var month = (((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1);
    var year = this.getFullYear();
    var hours = ((this.getHours() < 10)?"0":"") + this.getHours();
    var minutes = ((this.getMinutes() < 10)?"0":"") + this.getMinutes();
    var seconds = ((this.getSeconds() < 10)?"0":"") + this.getSeconds();

    return year+"-"+month+"-"+day+" "+hours+":"+minutes+":"+seconds;
};

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

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
let random_seed = 1234;
Math.random = function() {
    random_seed = Math.sin(random_seed) * 10000; return random_seed - Math.floor(random_seed);
    return random_seed;
};

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

try {
    module.exports = {
        "shuffle": shuffle,
    }
} catch (e) {}
